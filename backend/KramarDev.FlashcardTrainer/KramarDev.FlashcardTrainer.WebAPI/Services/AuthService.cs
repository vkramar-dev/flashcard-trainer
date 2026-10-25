using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Google.Apis.Auth;
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
    readonly string _googleClientId = configuration["GoogleAuth:FC_ClientId"];

    public async Task<AuthResponseModel> GetUserAsync(string userName)
    {
        var user = await _userManager.FindByNameAsync(userName);

        if (user == null)
            return null;

        // A still-valid token is replaced, so the session runs for another day from this visit.
        return await CreateUserModelAsync(user);
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

    public async Task<RegistrationOutcome<AuthResponseModel>> GoogleLoginAsync(
        GoogleAuthModel googleAuth,
        CT cancellationToken)
    {
        var payload = await ValidateGoogleCredentialAsync(googleAuth.Credential);

        if (payload == null)
        {
            return GoogleFailure(
                GoogleAuthErrorCodes.InvalidGoogleToken,
                "The Google sign-in token is invalid or has expired.");
        }

        const string provider = "Google";

        var user = await _userManager.FindByLoginAsync(provider, payload.Subject);
        if (user != null)
            return RegistrationOutcome<AuthResponseModel>.Success(await CreateUserModelAsync(user));

        var email = payload.Email.Trim();
        var normalizedEmail = _userManager.NormalizeEmail(email);

        // Identity user, external login, role, and user settings must be atomic.
        // The email lock is shared with the existing email/password registration.
        await using var transaction = await _ctx.Database.BeginTransactionAsync(cancellationToken);

        if (!await TryAcquireLockAsync(_ctx, EmailLockResource(normalizedEmail), cancellationToken))
        {
            return GoogleFailure(GoogleAuthErrorCodes.TryAgain, "Please try again.");
        }

        // Recheck inside the lock to handle two concurrent first-time sign-ins.
        user = await _userManager.FindByLoginAsync(provider, payload.Subject);
        if (user != null)
            return RegistrationOutcome<AuthResponseModel>.Success(await CreateUserModelAsync(user));

        // Don't auto-link a legacy account based on email alone.
        if (await _userManager.FindByEmailAsync(email) != null)
        {
            return GoogleFailure(
                GoogleAuthErrorCodes.EmailAlreadyRegistered,
                "An account with this email already exists. Sign in with your password and link Google in your account.");
        }

        user = new IdentityUser
        {
            UserName = email,
            Email = email,
            EmailConfirmed = true
        };

        var result = await _userManager.CreateAsync(user);
        if (!result.Succeeded)
            return GoogleIdentityFailure(result);

        result = await _userManager.AddLoginAsync(
            user, new UserLoginInfo(provider, payload.Subject, provider));
        if (!result.Succeeded)
            return GoogleIdentityFailure(result);

        result = await _userManager.AddToRoleAsync(user, Constants.UserRole);
        if (!result.Succeeded)
            return GoogleIdentityFailure(result);

        await _settingsService.CreateDefaultSettingsAsync(user.UserName, cancellationToken);
        var response = await CreateUserModelAsync(user);
        await transaction.CommitAsync(cancellationToken);

        return RegistrationOutcome<AuthResponseModel>.Success(response);
    }

    public async Task<RegistrationOutcome<AuthResponseModel>> LinkGoogleAsync(
        string userName,
        GoogleAuthModel googleAuth,
        CT cancellationToken)
    {
        var payload = await ValidateGoogleCredentialAsync(googleAuth.Credential);

        if (payload == null)
        {
            return GoogleFailure(
                GoogleAuthErrorCodes.InvalidGoogleToken,
                "The Google sign-in token is invalid or has expired.");
        }

        var user = await _userManager.FindByNameAsync(userName);
        if (user == null)
            return GoogleFailure(GoogleAuthErrorCodes.InvalidGoogleToken, "Invalid session.");

        // The user must control both the current signed-in account and
        // the verified Google account with the same email.
        if (_userManager.NormalizeEmail(user.Email) !=
            _userManager.NormalizeEmail(payload.Email.Trim()))
        {
            return GoogleFailure(
                GoogleAuthErrorCodes.EmailMismatch,
                "The Google account email must match your Flashcard Trainer email.");
        }

        var linkedUser = await _userManager.FindByLoginAsync("Google", payload.Subject);
        if (linkedUser != null)
        {
            if (linkedUser.Id == user.Id)
                return RegistrationOutcome<AuthResponseModel>.Success(await CreateUserModelAsync(user));

            return GoogleFailure(
                GoogleAuthErrorCodes.GoogleAccountInUse,
                "This Google account is already linked to another user.");
        }

        var userLogins = await _userManager.GetLoginsAsync(user);
        if (userLogins.Any(login => login.LoginProvider == "Google"))
        {
            return GoogleFailure(
                GoogleAuthErrorCodes.AccountAlreadyLinked,
                "A Google account is already linked to this user.");
        }

        var result = await _userManager.AddLoginAsync(
            user,
            new UserLoginInfo("Google", payload.Subject, "Google"));

        if (!result.Succeeded)
            return GoogleIdentityFailure(result);

        return RegistrationOutcome<AuthResponseModel>.Success(await CreateUserModelAsync(user));
    }

    private async Task<GoogleJsonWebSignature.Payload> ValidateGoogleCredentialAsync(string credential)
    {
        if (string.IsNullOrWhiteSpace(_googleClientId))
            throw new InvalidOperationException("GoogleAuth:FC_ClientId is not configured.");

        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(
                credential,
                new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience = [_googleClientId]
                });

            if (!payload.EmailVerified ||
                string.IsNullOrWhiteSpace(payload.Subject) ||
                string.IsNullOrWhiteSpace(payload.Email) ||
                payload.Email.Length > 256)
            {
                return null;
            }

            return payload;
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }

    private static RegistrationOutcome<AuthResponseModel> GoogleFailure(
        string code, string message) =>
        RegistrationOutcome<AuthResponseModel>.Failure(
            GoogleAuthErrorCodes.Error(code, message));

    private static RegistrationOutcome<AuthResponseModel> GoogleIdentityFailure(IdentityResult result)
    {
        if (result.Errors.Any(error => error.Code is "DuplicateEmail" or "DuplicateUserName"))
        {
            return GoogleFailure(
                GoogleAuthErrorCodes.EmailAlreadyRegistered,
                "An account with this email already exists.");
        }

        // Avoid leaking user identifiers or Identity internals in the HTTP response.
        return GoogleFailure(
            GoogleAuthErrorCodes.CouldNotCreateAccount,
            "Could not create or link the Google account.");
    }

    public async Task<RegistrationOutcome<SendRegistrationCodeResponse>> SendRegistrationCodeAsync(
        string email,
        string ipAddress,
        CT cancellationToken)
    {
        var recipient = email.Trim();
        var normalizedEmail = _userManager.NormalizeEmail(recipient);

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

        var code = GenerateCode();

        try
        {
            await SendVerificationEmailAsync(recipient, code, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Failed to send a registration verification email.");
            return RegistrationOutcome<SendRegistrationCodeResponse>.Failure(
                RegistrationErrorCodes.EmailSendFailedError());
        }

        var createdAt = DateTime.UtcNow;
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
    }

    public async Task<RegistrationOutcome<AuthResponseModel>> RegisterAsync(
        RegisterModel register,
        CT cancellationToken)
    {
        var email = register.Email.Trim();
        var normalizedEmail = _userManager.NormalizeEmail(email);
        var code = register.Code.Trim();

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
        while (true)
        {
            var code = RandomNumberGenerator.GetInt32(1000).ToString("D3");

            if (code is not ("666" or "911"))
                return code;
        }
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
