namespace KramarDev.FlashcardTrainer.WebAPI.Types;

public sealed class RegistrationError
{
    public string Code { get; init; }

    public string Message { get; init; }

    public int? AttemptsRemaining { get; init; }
}

public sealed class RegistrationOutcome<T>
{
    public T Value { get; init; }

    public RegistrationError Error { get; init; }

    public bool Succeeded => Error == null;

    public static RegistrationOutcome<T> Success(T value) =>
        new() { Value = value };

    public static RegistrationOutcome<T> Failure(RegistrationError error) =>
        new() { Error = error };
}
