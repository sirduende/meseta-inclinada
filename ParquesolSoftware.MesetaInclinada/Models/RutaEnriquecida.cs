using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

public class RutaEnriquecida
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [JsonPropertyName("distanciaKm")]
    public double DistanciaKm { get; set; }

    [JsonPropertyName("desnivelM")]
    public double DesnivelM { get; set; }

    [JsonPropertyName("duracionS")]
    public double DuracionS { get; set; }

    [JsonPropertyName("duracionFormateada")]
    public string DuracionFormateada { get; set; } = string.Empty;

    [JsonPropertyName("nivel")]
    public string Nivel { get; set; } = string.Empty;

    [JsonPropertyName("color")]
    public string Color { get; set; } = string.Empty;

    [JsonPropertyName("colorIndex")]
    public string ColorIndex { get; set; } = string.Empty;

    [JsonPropertyName("index")]
    public int Index { get; set; }

    [JsonPropertyName("fecha")]
    public string Fecha { get; set; } = string.Empty;

    [JsonPropertyName("participantes")]
    public List<string> Participantes { get; set; } = new();
}
