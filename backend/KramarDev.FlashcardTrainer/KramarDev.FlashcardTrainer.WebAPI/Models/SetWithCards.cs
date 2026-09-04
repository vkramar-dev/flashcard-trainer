namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class SetWithCards
{
    public int? Id { get; set; }

    public string Name { get; set; }

    public CardModel[] Cards { get; set; }
}
