namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class ImportModel
{
    public bool Append { get; set; }

    public CardModel[] Cards { get; set; }
}
