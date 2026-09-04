namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed record UserModel
{
    public string Email { get; set; }

    public string Token { get; set; }
}
