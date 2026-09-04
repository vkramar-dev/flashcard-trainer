namespace KramarDev.FlashcardTrainer.WebAPI.Database.Tables;

public class Card
{
    public int Id { get; set; }

    public int SetId { get; set; }

    public Set ParentSet { get; set; }

    public string FrontSide { get; set; }

    public string BackSide { get; set; }

    public int KnowCounter { get; set; }

    public int NotKnowCounter { get; set; }
}
