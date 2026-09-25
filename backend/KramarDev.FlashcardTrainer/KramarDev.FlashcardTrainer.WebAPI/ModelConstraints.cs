namespace KramarDev.FlashcardTrainer.WebAPI;

public static class ModelConstraints
{
    public const int UserNameMaxLength = 255;

    public const int UserNameMinLength = 6;

    public const int SetNameMaxLength = 100;

    public const int CardFrontMaxLength = 300;

    public const int CardBackMaxLength = 500;

    public const int ColorSchemeMaxLength = 32;

    public const int PasswordMaxLength = 32;

    public const int PasswordMinLength = 6;
}
