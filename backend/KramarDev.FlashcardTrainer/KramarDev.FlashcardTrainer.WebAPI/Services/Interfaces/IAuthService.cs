namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface IAuthService
{
    Task<UserModel> GetUserAsync(string userName);

    Task<UserModel> LoginAsync(AuthModel login);

    Task<ServiceResult<UserModel>> RegisterAsync(AuthModel register);
}
