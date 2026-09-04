namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface IAuthService
{
    Task<UserModel> GetUserAsync(string userName);

    Task<UserModel> LoginAsync(LoginModel login);

    Task<ServiceResult<UserModel>> RegisterAsync(RegisterModel register);
}
