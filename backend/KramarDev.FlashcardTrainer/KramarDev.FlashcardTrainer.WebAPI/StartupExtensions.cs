using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Threading.RateLimiting;

namespace KramarDev.FlashcardTrainer.WebAPI;

public static class StartupExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var tokenKey = configuration["JWTSettings:FC_TokenKey"]
            ?? throw new InvalidOperationException("JWTSettings:FC_TokenKey was not found.");

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
                else
                {
                    logger.LogError(
                        "Global exception handler was invoked, but no exception was available.");
                }

                ProblemDetails problem = ProcessException(exception);

                context.Response.Clear();
                context.Response.StatusCode = problem.Status ?? StatusCodes.Status500InternalServerError;
                context.Response.ContentType = "application/problem+json";

                await context.Response.WriteAsJsonAsync(problem);
            });
        });

        return app;
    }

    private static ProblemDetails ProcessException(Exception ex)
    {
        ProblemDetails details = null;

        switch (ex)
        {
            case Http400BadRequestException badRequest:
                details = new ProblemDetails
                {
                    Status = StatusCodes.Status400BadRequest,
                    Title = "Bad request.",
                    Detail = badRequest.Message
                };
                break;

            case Http404NotFoundException notFound:
                details = new ProblemDetails
                {
                    Status = StatusCodes.Status404NotFound,
                    Title = "Resource not found.",
                    Detail = notFound.Message
                };
                break;

            case Http409ConflictException conflict:
                details = new ProblemDetails
                {
                    Status = StatusCodes.Status409Conflict,
                    Title = "Conflict.",
                    Detail = conflict.Message
                };
                break;

            default:
                details = new ProblemDetails
                {
                    Status = StatusCodes.Status500InternalServerError,
                    Title = "An unexpected error occurred.",
                    Detail = "Please try again later."
                };
                break;
        }

        return details;
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
            options.AddPolicy(rateLimitName, context =>
                RateLimitPartition.GetFixedWindowLimiter(
                    partitionKey:
                        ClientIp.Normalize(context.Connection.RemoteIpAddress)
                        ?? context.Connection.Id,
                    factory: _ => new FixedWindowRateLimiterOptions
                    {
                        PermitLimit = 10,
                        Window = TimeSpan.FromMinutes(1),
                        QueueLimit = 0,
                        AutoReplenishment = true
                    }));

            options.RejectionStatusCode =
                StatusCodes.Status429TooManyRequests;
        });

        return services;
    }
}
