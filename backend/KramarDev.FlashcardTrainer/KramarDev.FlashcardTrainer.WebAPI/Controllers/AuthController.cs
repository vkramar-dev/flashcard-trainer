using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Resend;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public sealed class AuthController(IAuthService authService, IResend resend, IConfiguration configuration) : BaseController
{
    readonly IAuthService _authService = authService;
    readonly IResend _resend = resend;
    readonly IConfiguration _configuration = configuration;

    [HttpPost("email")]
    public async Task<ActionResult> Email(CT cancellationToken)
    {
        var fromEmail = _configuration["Resend:FC_FromEmail"]!;
        var fromName = _configuration["Resend:FC_FromName"]!;

        string verificationCode = new Random().Next(100000, 999999).ToString();

        var message = new EmailMessage
        {
            From = $"{fromName}<{fromEmail}>",
            Subject = "Your Flashcard Trainer verification code",
            HtmlBody = $"" +
            $"Flashcard Trainer Your verification code is:" +
            $"" +
            $"{verificationCode}" +
            $"" +
            $"The code expires in 10 minutes." +
            $"" +
            $"If you didn't create an account, you can ignore this email."
        };

        message.To.Add("kramarvladimir@gmail.com");
        message.To.Add("vkramar.biz@gmail.com");

        var response = await _resend.EmailSendAsync(
            message,
            cancellationToken);

        return Ok(response.Content);
    }

    [HttpPost("login")]
    [EnableRateLimiting(Constants.RateLimiterName)]
    [RequestSizeLimit(4 * 1024)]
    public async Task<ActionResult<AuthResponseModel>> Login(AuthModel login)
    {
        var user = await _authService.LoginAsync(login);

        if (user == null)
            return Unauthorized();

        return user;
    }

    [HttpPost("register")]
    [EnableRateLimiting(Constants.RateLimiterName)]
    [RequestSizeLimit(4 * 1024)]
    public async Task<ActionResult<AuthResponseModel>> Register(AuthModel register)
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
    public async Task<ActionResult<AuthResponseModel>> Me()
    {
        var user = await _authService.GetUserAsync(UserName);

        if (user == null)
            return Unauthorized();

        user.Token = await HttpContext.GetTokenAsync("access_token");

        return user;
    }
}
