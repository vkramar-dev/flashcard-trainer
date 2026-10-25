using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed record ResetPasswordModel
{
    [Required, EmailAddress]
    [StringLength(ModelConstraints.UserNameMaxLength, MinimumLength = ModelConstraints.UserNameMinLength)]
    public string Email { get; init; }

    [Required]
    public string Token { get; init; }

    [Required]
    [StringLength(ModelConstraints.PasswordMaxLength, MinimumLength = ModelConstraints.PasswordMinLength)]
    public string NewPassword { get; init; }
}
