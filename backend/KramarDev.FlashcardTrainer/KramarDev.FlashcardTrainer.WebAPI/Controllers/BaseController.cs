using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public abstract class BaseController : ControllerBase
{
    public const string RateLimiterName = "auth";

    protected string UserName
    {
        get
        {
            return User?.Identity?.Name;
        }
    }

    protected string IpAddress
    {
        get
        {
            return HttpContext.Connection.RemoteIpAddress?.ToString();
        }
    }
}
