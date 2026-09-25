using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class ExportCardModel
{
    [Required]
    [StringLength(ModelConstraints.CardFrontMaxLength)]
    public string Front { get; set; }

    [StringLength(ModelConstraints.CardBackMaxLength)]
    public string Back { get; set; }
}
