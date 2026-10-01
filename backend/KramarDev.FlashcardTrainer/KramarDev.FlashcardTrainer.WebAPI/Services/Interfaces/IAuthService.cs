namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseModel> GetUserAsync(string userName);

    Task<AuthResponseModel> LoginAsync(AuthModel login);

    Task<RegistrationOutcome<SendRegistrationCodeResponse>> SendRegistrationCodeAsync(
        string email,
        string ipAddress,
        CT cancellationToken);

    Task<RegistrationOutcome<AuthResponseModel>> RegisterAsync(
        RegisterModel register,
        CT cancellationToken);
}
