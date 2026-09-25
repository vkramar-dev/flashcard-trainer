using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class AuthService(
    FlashcardsDbContext dbContext,
    UserManager<IdentityUser> userManager,
    IJwtTokenGenerator tokenService,
    ISettingsService settingsService) : IAuthService
{
    readonly FlashcardsDbContext _ctx = dbContext;
    readonly UserManager<IdentityUser> _userManager = userManager;
    readonly IJwtTokenGenerator _tokenService = tokenService;
    readonly ISettingsService _settingsService = settingsService;

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

    public async Task<ServiceResult<AuthResponseModel>> RegisterAsync(
    AuthModel register)
    {
        var strategy = _ctx.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction =
                await _ctx.Database.BeginTransactionAsync();

            var user = new IdentityUser
            {
                UserName = register.Email,
                Email = register.Email
            };

            var result = await _userManager.CreateAsync(
                user,
                register.Password);

            if (!result.Succeeded)
                return Failure(result);

            result = await _userManager.AddToRoleAsync(
                user,
                Constants.UserRole);

            if (!result.Succeeded)
                return Failure(result);

            await _settingsService.CreateDefaultSettingsAsync(
                user.UserName!,
                CancellationToken.None);

            var response = await CreateUserModelAsync(user);

            await transaction.CommitAsync();

            return ServiceResult<AuthResponseModel>.Success(response);
        });
    }

    private async Task<AuthResponseModel> CreateUserModelAsync(
        IdentityUser user)
    {
        return new AuthResponseModel
        {
            Email = user.Email,
            Token = await _tokenService.GenerateTokenAsync(user)
        };
    }

    private static ServiceResult<AuthResponseModel> Failure(
        IdentityResult result)
    {
        return ServiceResult<AuthResponseModel>.Failure(
            result.Errors.Select(x => (x.Code, x.Description)));
    }
}