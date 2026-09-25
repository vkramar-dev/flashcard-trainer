namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed record AuthResponseModel
{
    public string Email { get; set; }

    public string Token { get; set; }
}