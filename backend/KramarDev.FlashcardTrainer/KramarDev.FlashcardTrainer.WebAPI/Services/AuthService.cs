using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Resend;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class AuthService(
    FlashcardsDbContext dbContext,
    IDbContextFactory<FlashcardsDbContext> dbContextFactory,
    UserManager<IdentityUser> userManager,
    IJwtTokenGenerator tokenService,
    ISettingsService settingsService,
    IResend resend,
    IConfiguration configuration,
    ILogger<AuthService> logger) : IAuthService
{
    const int MaxSendsPerWindow = 5;
    const int MaxCodeFailures = 3;
    const int LockTimeoutMilliseconds = 10000;

    readonly FlashcardsDbContext _ctx = dbContext;
    readonly IDbContextFactory<FlashcardsDbContext> _dbContextFactory = dbContextFactory;
    readonly UserManager<IdentityUser> _userManager = userManager;
    readonly IJwtTokenGenerator _tokenService = tokenService;
    readonly ISettingsService _settingsService = settingsService;
    readonly IResend _resend = resend;
    readonly ILogger<AuthService> _logger = logger;
    readonly string _fromEmail = configuration["Resend:FC_FromEmail"];
    readonly string _fromName = configuration["Resend:FC_FromName"];

    public async Task<AuthResponseModel> GetUserAsync(string userName)
    {
        var user = await _userManager.FindByNameAsync(userName);

        if (user == null)
            return null;

        return new AuthResponseModel
        {
            Email = user.Email
        };
    }

    public async Task<AuthResponseModel> LoginAsync(AuthModel login)
    {
        var user = await _userManager.FindByNameAsync(login.Email);

        if (user == null ||
            !await _userManager.CheckPasswordAsync(user, login.Password))
        {
            return null;
        }

        return await CreateUserModelAsync(user);
    }

    public async Task<RegistrationOutcome<SendRegistrationCodeResponse>> SendRegistrationCodeAsync(
        string email,
        string ipAddress,
        CT cancellationToken)
    {
        var recipient = email.Trim();
        var normalizedEmail = _userManager.NormalizeEmail(recipient);
        string code = null;
        var emailSent = false;
        DateTime? sentAt = null;

        var strategy = _ctx.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var ctx = await _dbContextFactory.CreateDbContextAsync(cancellationToken);
            await using var transaction = await ctx.Database.BeginTransactionAsync(cancellationToken);

            // Serialize send/resend for this IP and this email so overlapping
            // requests cannot both pass the send limit or issue two active codes.
            if (!await TryAcquireLockAsync(ctx, IpLockResource(ipAddress), cancellationToken) ||
                !await TryAcquireLockAsync(ctx, EmailLockResource(normalizedEmail), cancellationToken))
            {
                return RegistrationOutcome<SendRegistrationCodeResponse>.Failure(
                    RegistrationErrorCodes.TryAgainError());
            }

            var now = DateTime.UtcNow;

            if (await IsIpBlockedAsync(ctx, ipAddress, now, cancellationToken))
            {
                return RegistrationOutcome<SendRegistrationCodeResponse>.Failure(
                    RegistrationErrorCodes.IpBlockedError());
            }

            var windowStart = now.AddHours(-1);
            var sends = await ctx.RegisteringUsers.CountAsync(
                attempt => attempt.IpAddress == ipAddress && attempt.CreatedAt >= windowStart,
                cancellationToken);

            if (sends >= MaxSendsPerWindow)
            {
                ctx.BlockedIpAddresses.Add(new BlockedIpAddress
                {
                    IpAddress = ipAddress,
                    ExpAt = now.AddHours(1)
                });

                await ctx.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                return RegistrationOutcome<SendRegistrationCodeResponse>.Failure(
                    RegistrationErrorCodes.IpBlockedError());
            }

            if (await _userManager.FindByEmailAsync(recipient) != null)
            {
                return RegistrationOutcome<SendRegistrationCodeResponse>.Failure(
                    RegistrationErrorCodes.EmailAlreadyRegisteredError());
            }

            code ??= GenerateCode();

            if (!emailSent)
            {
                try
                {
                    await SendVerificationEmailAsync(recipient, code, cancellationToken);
                    emailSent = true;
                    sentAt ??= DateTime.UtcNow;
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Failed to send a registration verification email.");
                    return RegistrationOutcome<SendRegistrationCodeResponse>.Failure(
                        RegistrationErrorCodes.EmailSendFailedError());
                }
            }

            var createdAt = sentAt ?? now;
            var expiresAt = createdAt.AddMinutes(5);

            ctx.RegisteringUsers.Add(new RegisteringUser
            {
                Email = normalizedEmail,
                Code = code,
                IpAddress = ipAddress,
                FailCount = 0,
                CreatedAt = createdAt,
                CodeExpAt = expiresAt,
                IsCompleted = false
            });

            await ctx.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return RegistrationOutcome<SendRegistrationCodeResponse>.Success(
                new SendRegistrationCodeResponse
                {
                    CodeExpAt = expiresAt
                });
        });
    }

    public async Task<RegistrationOutcome<AuthResponseModel>> RegisterAsync(
        RegisterModel register,
        CT cancellationToken)
    {
        var email = register.Email.Trim();
        var normalizedEmail = _userManager.NormalizeEmail(email);
        var code = register.Code.Trim();
        var strategy = _ctx.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction =
                await _ctx.Database.BeginTransactionAsync(cancellationToken);

            if (!await TryAcquireLockAsync(_ctx, EmailLockResource(normalizedEmail), cancellationToken))
            {
                return RegistrationOutcome<AuthResponseModel>.Failure(
                    RegistrationErrorCodes.TryAgainError());
            }

            if (await _userManager.FindByEmailAsync(email) != null)
            {
                return RegistrationOutcome<AuthResponseModel>.Failure(
                    RegistrationErrorCodes.EmailAlreadyRegisteredError());
            }

            var attempt = await LockNewestAttemptAsync(_ctx, normalizedEmail, cancellationToken);

            if (attempt == null || attempt.IsCompleted)
            {
                return RegistrationOutcome<AuthResponseModel>.Failure(
                    RegistrationErrorCodes.CodeRequiredError());
            }

            if (attempt.FailCount >= MaxCodeFailures)
            {
                return RegistrationOutcome<AuthResponseModel>.Failure(
                    RegistrationErrorCodes.TooManyAttemptsError());
            }

            if (attempt.CodeExpAt <= DateTime.UtcNow)
            {
                return RegistrationOutcome<AuthResponseModel>.Failure(
                    RegistrationErrorCodes.CodeExpiredError());
            }

            if (!string.Equals(attempt.Code.Trim(), code, StringComparison.Ordinal))
            {
                attempt.FailCount++;
                await _ctx.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                if (attempt.FailCount >= MaxCodeFailures)
                {
                    return RegistrationOutcome<AuthResponseModel>.Failure(
                        RegistrationErrorCodes.TooManyAttemptsError());
                }

                return RegistrationOutcome<AuthResponseModel>.Failure(
                    RegistrationErrorCodes.InvalidCodeError(MaxCodeFailures - attempt.FailCount));
            }

            var user = new IdentityUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, register.Password);

            if (!result.Succeeded)
                return RegistrationFailure(result);

            result = await _userManager.AddToRoleAsync(user, Constants.UserRole);

            if (!result.Succeeded)
                return RegistrationFailure(result);

            await _settingsService.CreateDefaultSettingsAsync(
                user.UserName,
                cancellationToken);

            attempt.IsCompleted = true;
            await _ctx.SaveChangesAsync(cancellationToken);

            var response = await CreateUserModelAsync(user);

            await transaction.CommitAsync(cancellationToken);

            return RegistrationOutcome<AuthResponseModel>.Success(response);
        });
    }

    private async Task SendVerificationEmailAsync(
        string recipient,
        string code,
        CT cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(_fromEmail) || string.IsNullOrWhiteSpace(_fromName))
            throw new InvalidOperationException("Resend from-address settings are missing.");

        var message = new EmailMessage
        {
            From = $"{_fromName} <{_fromEmail}>",
            Subject = "Your Flashcard Trainer verification code",
            HtmlBody =
                "<p>Your verification code is:</p>" +
                $"<p><strong>{code}</strong></p>" +
                "<p>The code expires in 5 minutes.</p>" +
                "<p>If you didn't create an account, you can ignore this email.</p>"
        };

        message.To.Add(recipient);

        await _resend.EmailSendAsync(message, cancellationToken);
    }

    private static async Task<RegisteringUser> LockNewestAttemptAsync(
        FlashcardsDbContext ctx,
        string normalizedEmail,
        CT cancellationToken)
    {
        return await ctx.RegisteringUsers
            .FromSqlInterpolated($"""
                SELECT TOP (1) *
                FROM [RegisteringUsers] WITH (UPDLOCK, ROWLOCK)
                WHERE [Email] = {normalizedEmail}
                ORDER BY [Id] DESC
                """)
            .AsTracking()
            .FirstOrDefaultAsync(cancellationToken);
    }

    private static Task<bool> IsIpBlockedAsync(
        FlashcardsDbContext ctx,
        string ipAddress,
        DateTime now,
        CT cancellationToken)
    {
        return ctx.BlockedIpAddresses.AnyAsync(
            block => block.IpAddress == ipAddress && block.ExpAt > now,
            cancellationToken);
    }

    private static async Task<bool> TryAcquireLockAsync(
        FlashcardsDbContext ctx,
        string resource,
        CT cancellationToken)
    {
        var connection = ctx.Database.GetDbConnection();
        await using var command = connection.CreateCommand();
        command.Transaction = ctx.Database.CurrentTransaction?.GetDbTransaction();
        command.CommandText = """
            DECLARE @result int;
            EXEC @result = sp_getapplock
                @Resource = @resource,
                @LockMode = 'Exclusive',
                @LockOwner = 'Transaction',
                @LockTimeout = @timeout;
            SELECT @result;
            """;

        var resourceParameter = command.CreateParameter();
        resourceParameter.ParameterName = "@resource";
        resourceParameter.Value = resource;
        command.Parameters.Add(resourceParameter);

        var timeoutParameter = command.CreateParameter();
        timeoutParameter.ParameterName = "@timeout";
        timeoutParameter.Value = LockTimeoutMilliseconds;
        command.Parameters.Add(timeoutParameter);

        var scalar = await command.ExecuteScalarAsync(cancellationToken);
        return Convert.ToInt32(scalar) >= 0;
    }

    private static string GenerateCode()
    {
        return RandomNumberGenerator.GetInt32(0, 1000).ToString("D3");
    }

    private static string IpLockResource(string ipAddress)
    {
        return "reg-ip:" + ipAddress;
    }

    private static string EmailLockResource(string normalizedEmail)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedEmail));
        return "reg-email:" + Convert.ToHexString(hash);
    }

    private async Task<AuthResponseModel> CreateUserModelAsync(IdentityUser user)
    {
        return new AuthResponseModel
        {
            Email = user.Email,
            Token = await _tokenService.GenerateTokenAsync(user)
        };
    }

    private static RegistrationOutcome<AuthResponseModel> RegistrationFailure(IdentityResult result)
    {
        if (result.Errors.Any(error => error.Code is "DuplicateEmail" or "DuplicateUserName"))
        {
            return RegistrationOutcome<AuthResponseModel>.Failure(
                RegistrationErrorCodes.EmailAlreadyRegisteredError());
        }

        return RegistrationOutcome<AuthResponseModel>.Failure(
            RegistrationErrorCodes.InvalidRegistrationError(result));
    }
}
