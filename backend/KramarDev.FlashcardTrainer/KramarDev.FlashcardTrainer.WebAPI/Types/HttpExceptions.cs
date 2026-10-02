namespace KramarDev.FlashcardTrainer.WebAPI.Types;

public sealed class Http400BadRequestException : Exception
{
    public Http400BadRequestException(string message)
        : base(message)
    {
    }

    public Http400BadRequestException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

public sealed class Http404NotFoundException : Exception
{
    public Http404NotFoundException(string message)
        : base(message)
    {
    }

    public Http404NotFoundException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

public sealed class Http409ConflictException : Exception
{
    public Http409ConflictException(string message)
        : base(message)
    {
    }

    public Http409ConflictException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}