namespace KramarDev.FlashcardTrainer.WebAPI.Models;

public readonly record struct AnswerModel(
    int CardId,
    bool IsKnown);
