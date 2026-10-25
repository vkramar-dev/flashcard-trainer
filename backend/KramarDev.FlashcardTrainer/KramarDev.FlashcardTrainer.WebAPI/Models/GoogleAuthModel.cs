using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed record GoogleAuthModel
{
    [Required]
    [StringLength(10000)]
    public string Credential { get; init; }
}
