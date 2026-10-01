using System.Net;

namespace KramarDev.FlashcardTrainer.WebAPI;

public static class ClientIp
{
    public static string Normalize(IPAddress address)
    {
        if (address == null)
            return null;

        if (address.IsIPv4MappedToIPv6)
            address = address.MapToIPv4();

        return address.ToString();
    }
}
