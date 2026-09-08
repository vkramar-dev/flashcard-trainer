namespace KramarDev.Flashcard.WebAPI.Models;

public sealed record AppStateModel
{
    public SetModel[] Sets { get; set; }

    public string UserName { get; set; }

    public SettingsModel Settings { get; set; }
}
