using Microsoft.AspNetCore.Identity;

namespace KramarDev.FlashcardTrainer.WebAPI.Services.Interfaces;

public interface IJwtTokenGenerator
{
    Task<string> GenerateTokenAsync(IdentityUser user);
}
