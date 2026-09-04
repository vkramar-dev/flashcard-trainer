namespace KramarDev.FlashcardTrainer.WebAPI.Types;

public class ServiceResult<T>
{
    public T Value { get; init; }

    public Dictionary<string, string[]> Errors { get; init; } = [];

    public bool Succeeded => Errors.Count == 0;

    public static ServiceResult<T> Success(T value) =>
        new() { Value = value };

    public static ServiceResult<T> Failure(
        IEnumerable<(string Code, string Description)> errors) =>
        new()
        {
            Errors = errors
                .GroupBy(x => x.Code)
                .ToDictionary(
                    x => x.Key,
                    x => x.Select(e => e.Description).ToArray())
        };
}