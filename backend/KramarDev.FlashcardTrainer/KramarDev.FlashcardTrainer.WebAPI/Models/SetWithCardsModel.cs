using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class SetWithCardsModel
{
    public int? Id { get; set; }

    [Required]
    [StringLength(ModelConstraints.SetNameMaxLength)]
    public string Name { get; set; }

    public CardModel[] Cards { get; set; }
}
