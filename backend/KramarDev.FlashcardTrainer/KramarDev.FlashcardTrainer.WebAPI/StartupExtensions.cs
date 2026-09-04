using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using System.Text;

namespace KramarDev.FlashcardTrainer.WebAPI;

public static class StartupExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var tokenKey = configuration["JWTSettings:TokenKey"]
            ?? throw new InvalidOperationException("JWTSettings:TokenKey was not found.");

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(opt =>
            {
                opt.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(tokenKey))
                };
            });

        return services;
    }

    public static WebApplication UseAppExceptionHandler(this WebApplication app)
    {
        app.UseExceptionHandler(errorApp =>
        {
            errorApp.Run(async context =>
            {
                var logger = context.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("GlobalExceptionHandler");

                var env = context.RequestServices
                    .GetRequiredService<IHostEnvironment>();

                var exceptionFeature = context.Features
                    .Get<IExceptionHandlerFeature>();

                var exception = exceptionFeature?.Error;

                if (exception is not null)
                {
                    logger.LogError(exception, "Unhandled exception occurred.");
                }

                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/problem+json";

                var problem = new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "An unexpected error occurred.",
                    Detail = env.IsDevelopment()
                        ? exception?.Message
                        : "Please try again later."
                };

                await context.Response.WriteAsJsonAsync(problem);
            });
        });

        return app;
    }

    public static WebApplication UseApiNoCaching(this WebApplication app)
    {
        app.Use(async (context, next) =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.Headers.CacheControl = "no-store, no-cache, must-revalidate";
                context.Response.Headers.Pragma = "no-cache";
                context.Response.Headers.Expires = "0";
            }

            await next();
        });

        return app;
    }

    public static IServiceCollection AddAppRateLimiting(this IServiceCollection services, string rateLimitName)
    {
        services.AddRateLimiter(options =>
        {
            options.AddFixedWindowLimiter(rateLimitName, limiterOptions =>
            {
                limiterOptions.PermitLimit = 10;
                limiterOptions.Window = TimeSpan.FromMinutes(1);
                limiterOptions.QueueLimit = 0;
            });

            options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        });

        return services;
    }
}
