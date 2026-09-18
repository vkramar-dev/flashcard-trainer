namespace KramarDev.Flashcard.WebAPI.Models;

public sealed record AppStateModel
{
    public FullSetModel[] Sets { get; set; }

    public string UserName { get; set; }

    public SettingsModel Settings { get; set; }
}
