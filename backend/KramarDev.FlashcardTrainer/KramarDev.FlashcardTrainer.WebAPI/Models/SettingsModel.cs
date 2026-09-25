using System.ComponentModel.DataAnnotations;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class SettingsModel
{
    [Required]
    [StringLength(ModelConstraints.ColorSchemeMaxLength)]
    public string ColorScheme { get; set; }

    public bool HideKnownCards { get; set; }
}
