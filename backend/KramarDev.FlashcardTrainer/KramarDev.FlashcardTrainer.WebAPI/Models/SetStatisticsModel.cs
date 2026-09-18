namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public class SetStatisticsModel
{
    public int SetId { get; set; }

    public string SetName { get; set; }

    public int LearntCards { get; set; }

    public int TotalCardsShown { get; set; }

    public FullCardModel[] HardestCards { get; set; }
}
