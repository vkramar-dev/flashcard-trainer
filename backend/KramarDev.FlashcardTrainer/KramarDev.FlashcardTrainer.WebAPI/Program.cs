using KramarDev.FlashcardTrainer.WebAPI;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DbConnection")
                ?? throw new InvalidOperationException("Connection string 'DbConnection' was not found.");

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Register a DbContext factory so we can create short-lived contexts inside
// execution strategy retries. Uses the same SQL Server options as the regular DbContext.
builder.Services.AddDbContextFactory<FlashcardsDbContext>(opt =>
{
    opt.UseSqlServer(connectionString, sqlOptions =>
    {
        sqlOptions.EnableRetryOnFailure();
    });
});

//builder.Services.AddDbContext<FlashcardsDbContext>(
//    contextLifetime: ServiceLifetime.Transient,
//    optionsLifetime: ServiceLifetime.Singleton);

builder.Services.AddIdentityCore<IdentityUser>(opt =>
{
    opt.Password.RequireUppercase = false;
    opt.Password.RequiredLength = 6;
    opt.Password.RequireLowercase = false;
    opt.User.RequireUniqueEmail = true;
    opt.Password.RequireDigit = false;
    opt.Password.RequireNonAlphanumeric = false;
}).AddRoles<IdentityRole>()
  .AddEntityFrameworkStores<FlashcardsDbContext>();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(builder =>
    {
        builder.WithOrigins("https://new-words.online", "http://localhost:3000")
               .AllowAnyMethod()
               .AllowAnyHeader();
    });
});

builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddScoped<ISetsService, SetsService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITrainingService, TrainingService>();
builder.Services.AddScoped<IJwtTokenGenerator, JwtTokenGenerator>();
builder.Services.AddScoped<ISettingsService, SettingsService>();
builder.Services.AddScoped<IStatisticsService, StatisticsService>();
builder.Services.AddAppRateLimiting(Constants.RateLimiterName);

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/openapi/v1.json", "Flashcard API");
    });
}

app.UseAppExceptionHandler();
app.UseHttpsRedirection();
app.UseRouting();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    await DbInitializer.MigrateAndInitializeAsync(scope);
}

await app.RunAsync();
