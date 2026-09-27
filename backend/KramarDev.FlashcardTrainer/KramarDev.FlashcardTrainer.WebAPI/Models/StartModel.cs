namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public readonly record struct StartModel(
    int SetId,
    bool ShouldHide);
