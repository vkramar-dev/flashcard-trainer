using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed record ForgotPasswordModel
{
    [Required, EmailAddress]
    [StringLength(ModelConstraints.UserNameMaxLength, MinimumLength = ModelConstraints.UserNameMinLength)]
    public string Email { get; init; }
}
