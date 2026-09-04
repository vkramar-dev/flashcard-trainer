using Microsoft.AspNetCore.Identity;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class AuthService(
    UserManager<IdentityUser> userManager,
    IJwtTokenGenerator tokenService) : IAuthService
{
    readonly UserManager<IdentityUser> _userManager = userManager;
    readonly IJwtTokenGenerator _tokenService = tokenService;

    public async Task<UserModel> GetUserAsync(string userName)
    {
        var user = await _userManager.FindByNameAsync(userName);

        if (user == null)
            return null;

        return new UserModel
        {
            Email = user.Email
        };
    }

    public async Task<UserModel> LoginAsync(LoginModel login)
    {
        var user = await _userManager.FindByNameAsync(login.Email);

        if (user == null ||
            !await _userManager.CheckPasswordAsync(user, login.Password))
        {
            return null;
        }

        return await CreateUserModelAsync(user);
    }

    public async Task<ServiceResult<UserModel>> RegisterAsync(
        RegisterModel register)
    {
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
        {
            await _userManager.DeleteAsync(user);
            return Failure(result);
        }

        return ServiceResult<UserModel>.Success(
            await CreateUserModelAsync(user));
    }

    private async Task<UserModel> CreateUserModelAsync(
        IdentityUser user)
    {
        return new UserModel
        {
            Email = user.Email,
            Token = await _tokenService.GenerateTokenAsync(user)
        };
    }

    private static ServiceResult<UserModel> Failure(
        IdentityResult result)
    {
        return ServiceResult<UserModel>.Failure(
            result.Errors.Select(x => (x.Code, x.Description)));
    }
}