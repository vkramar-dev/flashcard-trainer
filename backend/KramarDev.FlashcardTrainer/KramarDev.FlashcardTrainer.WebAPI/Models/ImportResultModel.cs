namespace KramarDev.FlashcardTrainer.WebAPI.Models
{
    public sealed class ImportResultModel
    {
        public int Imported { get; set; }

        public FullSetWithCardsModel Set { get; set; }
    }
}
