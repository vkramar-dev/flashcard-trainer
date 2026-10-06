using Microsoft.Data.SqlClient;

namespace KramarDev.FlashcardTrainer.WebAPI.Utils;

public static class ExceptionHelper
{
    const string DuplicatePattern = "The duplicate key value is";

    public static void ThrowIfDuplicateCard(Exception ex)
    {
        if (ex.InnerException is not SqlException sqlException ||
            !ex.InnerException.Message.Contains(DuplicatePattern))
        {
            return;
        }

        string duplicateData =
            ParseDuplicateDataInSqlExceptionMessage(sqlException.Message);

        if (String.IsNullOrEmpty(duplicateData))
        {
            throw new Http409ConflictException(
                "A card with the same Side A already exists", ex);
        }
        else
        {
            throw new Http409ConflictException(
                $"Card with side A '{duplicateData}' already exists.", ex);
        }
    }

    private static string ParseDuplicateDataInSqlExceptionMessage(string message)
    {
        try
        {
            string duplication = null;

            int index = message.IndexOf(DuplicatePattern, StringComparison.OrdinalIgnoreCase);
            index += DuplicatePattern.Length;

            for (; index < message.Length; ++index)
            {
                if (message[index] == ',')
                {
                    index += 2; // Skip ", "
                    duplication = message.Substring(index, message.Length - index - 2);
                    break;
                }
            }

            return duplication;
        }
        catch
        {
            // Ignore parsing errors.
            return null;
        }
    }
}
