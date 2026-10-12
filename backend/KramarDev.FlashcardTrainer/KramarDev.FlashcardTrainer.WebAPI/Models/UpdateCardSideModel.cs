namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class UpdateCardSideModel
{
    public required bool IsFrontSide { get; init; }

    public required string Text { get; init; }
}
