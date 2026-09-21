using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace KramarDev.FlashcardTrainer.WebAPI.Controllers;

public sealed class TrainingController(ITrainingService trainingService) : BaseController
{
    readonly ITrainingService _trainingService = trainingService;

    [Authorize]
    [HttpGet("start")]
    public async Task<ActionResult<CardModel[]>> Start(int setId, bool shouldHide, CT cancellationToken)
    {
        return Ok(await _trainingService.StartAsync(UserName, setId, shouldHide, cancellationToken));
    }

    [Authorize]
    [HttpPost("answer")]
    public async Task<IActionResult> Answer(AnswerModel answerModel, CT cancellationToken)
    {
        await _trainingService.AnswerAsync(
            UserName, answerModel.CardId, answerModel.IsKnown, cancellationToken);

        return NoContent();
    }
}
