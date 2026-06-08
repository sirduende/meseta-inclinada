using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

public class CumbreFDMESCYL
{
    [JsonPropertyName("id")]
    public int Id { get; set; }

    [JsonPropertyName("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [JsonPropertyName("lat")]
    public double Lat { get; set; }

    [JsonPropertyName("lng")]
    public double Lng { get; set; }

    [JsonPropertyName("cubierta")]
    public bool Cubierta { get; set; }

    [JsonPropertyName("orden")]
    public int Orden { get; set; }
}
