using System.Text.Json.Serialization;

namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public sealed class RegistrationErrorResponse
{
    public string Code { get; init; }

    public string Message { get; init; }

    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public int? AttemptsRemaining { get; init; }
}
