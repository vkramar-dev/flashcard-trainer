using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public class LogController() : BaseController
{
    [Authorize]
    [HttpPost("write")]
    public async Task<ActionResult> Write(LogModel logModel)
    {
        return NoContent();
    }
}
