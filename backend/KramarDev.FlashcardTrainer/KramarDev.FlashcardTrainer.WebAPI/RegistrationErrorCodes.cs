using Microsoft.AspNetCore.Identity;

namespace KramarDev.FlashcardTrainer.WebAPI;

public static class RegistrationErrorCodes
{
    public const string IpBlocked = "IpBlocked";

    public const string EmailAlreadyRegistered = "EmailAlreadyRegistered";

    public const string InvalidCode = "InvalidCode";

    public const string TooManyAttempts = "TooManyAttempts";

    public const string CodeExpired = "CodeExpired";

    public const string CodeRequired = "CodeRequired";

    public const string EmailSendFailed = "EmailSendFailed";

    public const string InvalidRegistration = "InvalidRegistration";

    public const string TryAgain = "TryAgain";

    public const string ClientIpMissing = "ClientIpMissing";

    public static RegistrationError IpBlockedError() =>
        new()
        {
            Code = IpBlocked,
            Message = "Too many registration requests were made. Registration is temporarily blocked for one hour."
        };

    public static RegistrationError EmailAlreadyRegisteredError() =>
        new()
        {
            Code = EmailAlreadyRegistered,
            Message = "An account with this email already exists."
        };

    public static RegistrationError InvalidCodeError(int attemptsRemaining)
    {
        var attempts = attemptsRemaining == 1 ? "attempt" : "attempts";

        return new RegistrationError
        {
            Code = InvalidCode,
            Message = $"Incorrect code. {attemptsRemaining} {attempts} remaining.",
            AttemptsRemaining = attemptsRemaining
        };
    }

    public static RegistrationError TooManyAttemptsError() =>
        new()
        {
            Code = TooManyAttempts,
            Message = "Too many incorrect codes were entered. Request a new code."
        };

    public static RegistrationError CodeExpiredError() =>
        new()
        {
            Code = CodeExpired,
            Message = "This code has expired. Request a new code."
        };

    public static RegistrationError CodeRequiredError() =>
        new()
        {
            Code = CodeRequired,
            Message = "Request a new verification code."
        };

    public static RegistrationError EmailSendFailedError() =>
        new()
        {
            Code = EmailSendFailed,
            Message = "Could not send the verification email. Please try again."
        };

    public static RegistrationError TryAgainError() =>
        new()
        {
            Code = TryAgain,
            Message = "Please try again."
        };

    public static RegistrationError ClientIpMissingError() =>
        new()
        {
            Code = ClientIpMissing,
            Message = "Could not determine the client address."
        };

    public static RegistrationError InvalidRegistrationError(IdentityResult result)
    {
        var message = string.Join(" ", result.Errors.Select(error => error.Description));

        if (string.IsNullOrWhiteSpace(message))
            message = "Could not create the account.";

        return new RegistrationError
        {
            Code = InvalidRegistration,
            Message = message
        };
    }
}
