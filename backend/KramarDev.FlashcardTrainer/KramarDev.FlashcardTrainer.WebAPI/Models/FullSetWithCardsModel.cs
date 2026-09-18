namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed record FullSetWithCardsModel : FullSetModel
{
    public CardModel[] Cards { get; set; }
}
