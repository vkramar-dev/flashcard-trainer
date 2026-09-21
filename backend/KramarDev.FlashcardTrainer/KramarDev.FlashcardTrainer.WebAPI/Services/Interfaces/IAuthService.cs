namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface IAuthService
{
    Task<AuthResponseModel> GetUserAsync(string userName);

    Task<AuthResponseModel> LoginAsync(AuthModel login);

    Task<ServiceResult<AuthResponseModel>> RegisterAsync(AuthModel register);
}
