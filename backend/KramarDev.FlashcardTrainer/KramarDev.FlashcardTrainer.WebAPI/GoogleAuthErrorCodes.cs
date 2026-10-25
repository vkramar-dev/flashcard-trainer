namespace KramarDev.FlashcardTrainer.WebAPI;

public static class GoogleAuthErrorCodes
{
    public const string InvalidGoogleToken = "InvalidGoogleToken";
    public const string EmailAlreadyRegistered = "EmailAlreadyRegistered";
    public const string AccountAlreadyLinked = "AccountAlreadyLinked";
    public const string GoogleAccountInUse = "GoogleAccountInUse";
    public const string EmailMismatch = "EmailMismatch";
    public const string TryAgain = "TryAgain";
    public const string CouldNotCreateAccount = "CouldNotCreateAccount";

    public static RegistrationError Error(string code, string message) =>
        new() { Code = code, Message = message };
}
