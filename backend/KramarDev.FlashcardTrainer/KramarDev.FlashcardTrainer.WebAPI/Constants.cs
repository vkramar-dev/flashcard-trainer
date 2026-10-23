namespace KramarDev.FlashcardTrainer.WebAPI;

public static class Constants
{
    public const string UserRole = "User";

    public const string PowerUserRole = "PowerUser";

    public const int LearntThreshold = 2;

    public const string RateLimiterName = "auth";

    public const int MinCardsPerTrainingSession = 4;

    public const int MaxCardsPerTrainingSessionDefault = 20;

    public const long AccountCharacterLimit = 1_000_000;
}
