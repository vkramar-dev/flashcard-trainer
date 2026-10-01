namespace KramarDev.FlashcardTrainer.WebAPI.Database.Tables;

public class RegisteringUser
{
    public int Id { get; set; }

    public string Email { get; set; }

    public string Code { get; set; }

    public string IpAddress { get; set; }

    public byte FailCount { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime CodeExpAt { get; set; }

    public bool IsCompleted { get; set; }
}
