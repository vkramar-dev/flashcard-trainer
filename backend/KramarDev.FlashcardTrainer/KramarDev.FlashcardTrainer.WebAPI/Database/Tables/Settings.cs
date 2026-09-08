namespace KramarDev.FlashcardTrainer.WebAPI.Database.Tables;

public class Settings
{
    public int Id { get; set; }

    public string UserName { get; set; }

    public string ColorScheme { get; set; }

    public bool HideKnownCards { get; set; }
}
