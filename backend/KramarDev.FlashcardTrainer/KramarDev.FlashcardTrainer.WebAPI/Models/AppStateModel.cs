namespace KramarDev.Flashcard.WebAPI.Models
{
    public sealed record AppStateModel
    {
        public SetModel[] Sets { get; set; }

        public UserModel User { get; set; }
    }
}
