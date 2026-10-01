namespace KramarDev.FlashcardTrainer.WebAPI.Database.Tables;

public class BlockedIpAddress
{
    public DateTime ExpAt { get; set; }

    public string IpAddress { get; set; }
}
