namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public readonly struct StorageUsageModel
{
    public long UsedCharacters { get; init; }

    public long CharacterLimit { get; init; }
}
