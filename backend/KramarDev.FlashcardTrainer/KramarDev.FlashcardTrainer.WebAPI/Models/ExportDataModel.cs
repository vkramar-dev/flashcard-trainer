namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class ExportDataModel
{
    public string Name { get; set; }

    public ExportCardModel[] Cards { get; set; }
}
