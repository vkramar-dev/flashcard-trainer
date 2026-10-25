using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public sealed class AuthController(IAuthService authService) : BaseController
{
    readonly IAuthService _authService = authService;

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

    [HttpPost("google")]
    [EnableRateLimiting(Constants.RateLimiterName)]
    [RequestSizeLimit(16 * 1024)]
    public async Task<ActionResult<AuthResponseModel>> GoogleLogin(
        GoogleAuthModel model,
        CT cancellationToken)
    {
        var result = await _authService.GoogleLoginAsync(model, cancellationToken);

        if (!result.Succeeded)
            return GoogleFailure(result.Error);

        return result.Value;
    }

    [Authorize]
    [HttpPost("google/link")]
    [EnableRateLimiting(Constants.RateLimiterName)]
    [RequestSizeLimit(16 * 1024)]
    public async Task<ActionResult<AuthResponseModel>> LinkGoogle(
        GoogleAuthModel model,
        CT cancellationToken)
    {
        var result = await _authService.LinkGoogleAsync(UserName, model, cancellationToken);

        if (!result.Succeeded)
            return GoogleFailure(result.Error);

        return result.Value;
    }

    [HttpPost("register/send-code")]
    [EnableRateLimiting(Constants.RateLimiterName)]
    [RequestSizeLimit(4 * 1024)]
    public async Task<ActionResult<SendRegistrationCodeResponse>> SendRegistrationCode(
        SendRegistrationCodeModel model,
        CT cancellationToken)
    {
        var ipAddress = ClientIp.Normalize(HttpContext.Connection.RemoteIpAddress);

        if (ipAddress == null)
            return RegistrationFailure(RegistrationErrorCodes.ClientIpMissingError());

        var result = await _authService.SendRegistrationCodeAsync(
            model.Email,
            ipAddress,
            cancellationToken);

        if (!result.Succeeded)
            return RegistrationFailure(result.Error);

        return result.Value;
    }

    [HttpPost("register")]
    [EnableRateLimiting(Constants.RateLimiterName)]
    [RequestSizeLimit(4 * 1024)]
    public async Task<ActionResult<AuthResponseModel>> Register(
        RegisterModel register,
        CT cancellationToken)
    {
        var result = await _authService.RegisterAsync(register, cancellationToken);

        if (!result.Succeeded)
            return RegistrationFailure(result.Error);

        return result.Value;
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthResponseModel>> Me()
    {
        var user = await _authService.GetUserAsync(UserName);

        if (user == null)
            return Unauthorized();

        return user;
    }

    private ActionResult GoogleFailure(RegistrationError error)
    {
        var status = error.Code switch
        {
            GoogleAuthErrorCodes.InvalidGoogleToken => StatusCodes.Status401Unauthorized,
            GoogleAuthErrorCodes.EmailAlreadyRegistered => StatusCodes.Status409Conflict,
            GoogleAuthErrorCodes.AccountAlreadyLinked => StatusCodes.Status409Conflict,
            GoogleAuthErrorCodes.GoogleAccountInUse => StatusCodes.Status409Conflict,
            GoogleAuthErrorCodes.EmailMismatch => StatusCodes.Status409Conflict,
            GoogleAuthErrorCodes.TryAgain => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status400BadRequest
        };

        return StatusCode(status, new RegistrationErrorResponse
        {
            Code = error.Code,
            Message = error.Message
        });
    }

    private ActionResult RegistrationFailure(RegistrationError error)
    {
        var status = error.Code switch
        {
            RegistrationErrorCodes.IpBlocked => StatusCodes.Status429TooManyRequests,
            RegistrationErrorCodes.EmailSendFailed => StatusCodes.Status503ServiceUnavailable,
            RegistrationErrorCodes.TryAgain => StatusCodes.Status503ServiceUnavailable,
            _ => StatusCodes.Status400BadRequest
        };

        return StatusCode(status, new RegistrationErrorResponse
        {
            Code = error.Code,
            Message = error.Message,
            AttemptsRemaining = error.AttemptsRemaining
        });
    }
}
