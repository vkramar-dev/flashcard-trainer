namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseModel> GetUserAsync(string userName);

    Task RequestPasswordResetAsync(string email, string ipAddress, CT cancellationToken);

    Task<bool> ResetPasswordAsync(ResetPasswordModel model);

    Task<AuthResponseModel> LoginAsync(AuthModel login);

    Task<RegistrationOutcome<AuthResponseModel>> GoogleLoginAsync(
        GoogleAuthModel googleAuth,
        CT cancellationToken);

    Task<RegistrationOutcome<AuthResponseModel>> LinkGoogleAsync(
        string userName,
        GoogleAuthModel googleAuth,
        CT cancellationToken);

    Task<RegistrationOutcome<SendRegistrationCodeResponse>> SendRegistrationCodeAsync(
        string email,
        string ipAddress,
        CT cancellationToken);

    Task<RegistrationOutcome<AuthResponseModel>> RegisterAsync(
        RegisterModel register,
        CT cancellationToken);
}
