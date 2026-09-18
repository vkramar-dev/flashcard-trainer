namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class FullCardModel : CardModel
{
    public int UnknownCount { get; set; }

    public int ShownCount { get; set; }
}
