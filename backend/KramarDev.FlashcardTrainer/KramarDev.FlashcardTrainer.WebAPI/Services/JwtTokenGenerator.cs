using Microsoft.AspNetCore.Identity;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.IdentityModel.Tokens.Jwt;

namespace KramarDev.FlashcardTrainer.WebAPI.Services;

public sealed class JwtTokenGenerator(UserManager<IdentityUser> userManager, IConfiguration config) : IJwtTokenGenerator
{
    private readonly IConfiguration _config = config;
    private readonly UserManager<IdentityUser> _userManager = userManager;

    public async Task<string> GenerateTokenAsync(IdentityUser user)
    {
        var username = user.UserName
            ?? throw new InvalidOperationException("UserName is missing.");

        var email = user.Email
            ?? throw new InvalidOperationException("Email is missing.");

        var tokenKey = _config["JWTSettings:TokenKey"]
            ?? throw new InvalidOperationException("JWTSettings:TokenKey is not configured.");

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, username),
            new(ClaimTypes.Name, username),
            new(ClaimTypes.Email, email)
        };

        var roles = await _userManager.GetRolesAsync(user);
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(tokenKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

        var tokenOptions = new JwtSecurityToken(
            issuer: null,
            audience: null,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(tokenOptions);
    }
}
