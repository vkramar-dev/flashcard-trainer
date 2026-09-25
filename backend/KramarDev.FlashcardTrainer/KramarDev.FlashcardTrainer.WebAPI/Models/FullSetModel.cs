using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public record FullSetModel
{
    public int Id { get; set; }

    [Required]
    [StringLength(ModelConstraints.SetNameMaxLength)]
    public string Name { get; set; }

    public bool Shuffle { get; set; }

    public int TotalCards { get; set; }

    public int LearntCards { get; set; }

    public DateTime Created { get; set; }

    public DateTime Modified { get; set; }
}
