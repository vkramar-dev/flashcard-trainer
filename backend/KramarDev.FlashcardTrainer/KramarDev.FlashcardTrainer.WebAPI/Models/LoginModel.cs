using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed record LoginModel
{
    [Required]
    [StringLength(255, MinimumLength = 6)]
    public string Email { get; init; }

    [Required]
    [StringLength(32, MinimumLength = 6)]
    public string Password { get; init; }
}
