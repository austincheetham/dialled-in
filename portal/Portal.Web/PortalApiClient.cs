namespace Portal.Web;

public class PortalApiClient(HttpClient httpClient)
{
    public async Task<PortalStatus?> GetStatusAsync(CancellationToken cancellationToken = default)
    {
        try
        {
            return await httpClient.GetFromJsonAsync<PortalStatus>("/api/status", cancellationToken);
        }
        catch (HttpRequestException)
        {
            return null;
        }
    }
}

public record PortalStatus(string Service, string Version, DateTimeOffset Timestamp);
