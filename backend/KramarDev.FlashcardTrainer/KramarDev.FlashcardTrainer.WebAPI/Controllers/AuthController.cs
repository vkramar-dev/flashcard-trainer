using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public sealed class AuthController(IAuthService authService) : BaseController
{
    readonly IAuthService _authService = authService;


    [HttpPost("login")]
    [EnableRateLimiting(RateLimiterName)]
    [RequestSizeLimit(4 * 1024)]
    public async Task<ActionResult<UserModel>> Login(LoginModel login)
    {
        var user = await _authService.LoginAsync(login);

        if (user == null)
            return Unauthorized();

        return user;
    }

    [HttpPost("register")]
    [EnableRateLimiting(RateLimiterName)]
    [RequestSizeLimit(4 * 1024)]
    public async Task<ActionResult<UserModel>> Register(RegisterModel register)
    {
        var result = await _authService.RegisterAsync(register);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
            {
                foreach (var description in error.Value)
                    ModelState.AddModelError(error.Key, description);
            }

            return ValidationProblem();
        }

        return result.Value;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserModel>> Me()
        {
        var user = await _authService.GetUserAsync(UserName);

        if (user == null)
            return Unauthorized();

        user.Token = await HttpContext.GetTokenAsync("access_token");

        return user;
    }
}
