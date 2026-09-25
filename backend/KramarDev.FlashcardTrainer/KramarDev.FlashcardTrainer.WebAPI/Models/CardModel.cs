using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public class CardModel
{
    public int? Id { get; set; }

    [Required]
    [StringLength(ModelConstraints.CardFrontMaxLength)]
    public string Front { get; set; }

    [StringLength(ModelConstraints.CardBackMaxLength)]
    public string Back { get; set; }
}
