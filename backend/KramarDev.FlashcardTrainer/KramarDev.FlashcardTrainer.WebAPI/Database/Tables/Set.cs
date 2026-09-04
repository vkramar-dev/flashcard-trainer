namespace KramarDev.FlashcardTrainer.WebAPI.Database.Tables;

public class Set
{
    public int Id { get; set; }

    public string UserName { get; set; }

    public string Name { get; set; }

    public bool IsShuffled { get; set; }

    public DateTime Created { get; set; } = DateTime.UtcNow;

    public DateTime Modified { get; set; } = DateTime.UtcNow;

    public ICollection<Card> Cards { get; set; }
}
