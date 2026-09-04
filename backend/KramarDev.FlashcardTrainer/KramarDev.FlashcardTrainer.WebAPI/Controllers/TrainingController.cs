using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers
{
    public sealed class TrainingController(ITrainingService trainingService) : BaseController
    {
        readonly ITrainingService _trainingService = trainingService;

        [Authorize]
        [HttpGet("start")]
        public async Task<ActionResult<CardModel[]>> Start(int setId, CancellationToken cancellationToken)
        {
            return Ok(await _trainingService.StartAsync(UserName, setId, cancellationToken));
        }

        [Authorize]
        [HttpPost("answer")]
        public async Task<IActionResult> Answer(int cardId, bool isKnown, CancellationToken cancellationToken)
        {
            await _trainingService.AnswerAsync(UserName, cardId, isKnown, cancellationToken);

            return NoContent();
        }
    }
}
