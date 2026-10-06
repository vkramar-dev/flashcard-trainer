namespace KramarDev.FlashcardTrainer.WebAPI.Types;

public class HttpExceptionBase : Exception
{
    public string ClientMessage { get; }

    protected HttpExceptionBase(string clientMessage)
        : base(clientMessage)
    {
        ClientMessage = clientMessage;
    }

    protected HttpExceptionBase(string clientMessage, Exception ex)
        : base(clientMessage, ex)
    {
        ClientMessage = clientMessage;
    }
}

public sealed class Http400BadRequestException : HttpExceptionBase
{
    public Http400BadRequestException(string clientMessage)
        : base(clientMessage)
    {
    }

    public Http400BadRequestException(string clientMessage, Exception innerException)
        : base(clientMessage, innerException)
    {
    }
}

public sealed class Http404NotFoundException : HttpExceptionBase
{
    public Http404NotFoundException(string clientMessage)
        : base(clientMessage)
    {
    }

    public Http404NotFoundException(string clientMessage, Exception innerException)
        : base(clientMessage, innerException)
    {
    }
}

public sealed class Http409ConflictException : HttpExceptionBase
{
    public Http409ConflictException(string clientMessage)
        : base(clientMessage)
    {
    }

    public Http409ConflictException(string clientMessage, Exception innerException)
        : base(clientMessage, innerException)
    {
    }
}