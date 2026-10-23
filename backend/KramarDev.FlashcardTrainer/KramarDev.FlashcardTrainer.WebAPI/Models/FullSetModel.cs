using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public record FullSetModel
{
    public int Id { get; set; }

    [Required]
    [StringLength(ModelConstraints.SetNameMaxLength)]
    public string Name { get; set; }

    public int TotalCards { get; set; }

    public int LearntCards { get; set; }

    public DateTime Created { get; set; }

    public DateTime Modified { get; set; }

    public DateTime? LastTrained { get; set; }

    [JsonIgnore]
    public long UsedCharacters { get; set; }
}
