namespace KramarDev.FlashcardTrainer.WebAPI.Database.Tables;

// Stores only delivery metadata for rate limiting; no passwords, reset tokens, or raw emails.
public sealed class PasswordResetEmail
{
    public int Id { get; set; }
    public string EmailHash { get; set; }
    public string IpAddress { get; set; }
    public DateTime SentAt { get; set; }
}
