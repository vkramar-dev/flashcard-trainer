using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed record AuthModel
{
    [Required]
    [EmailAddress]
    [StringLength(ModelConstraints.UserNameMaxLength, MinimumLength = ModelConstraints.UserNameMinLength)]
    public string Email { get; init; }

    [Required]
    [StringLength(ModelConstraints.PasswordMaxLength, MinimumLength = ModelConstraints.PasswordMinLength)]
    public string Password { get; init; }
}
