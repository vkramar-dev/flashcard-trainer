namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed record SetModel
{
    public int Id { get; set; }

    public string Name { get; set; }

    public bool Shuffle { get; set; }

    public int TotalCards { get; set; }

    public int LearntCards { get; set; }

    public DateTime Created { get; set; }

    public DateTime Modified { get; set; }
}
