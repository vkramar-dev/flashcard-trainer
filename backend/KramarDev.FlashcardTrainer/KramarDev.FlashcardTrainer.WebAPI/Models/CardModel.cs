namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class CardModel
{
    public int? Id { get; set; }

    public string Front { get; set; }

    public string Back { get; set; }
}
