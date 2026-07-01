using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

public class Ruta
{
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonPropertyName("nombre")]
    public string Nombre { get; set; } = string.Empty;

    [JsonPropertyName("archivo")]
    public string Archivo { get; set; } = string.Empty;

    [JsonPropertyName("fecha")]
    public string Fecha { get; set; } = string.Empty;

    [JsonPropertyName("descripcion")]
    public string Descripcion { get; set; } = string.Empty;

    [JsonPropertyName("dificultad")]
    public string Dificultad { get; set; } = string.Empty;

    [JsonPropertyName("relive")]
    public string? Relive { get; set; }

    [JsonPropertyName("participantes")]
    public List<string> Participantes { get; set; } = new();

    // Métricas calculadas desde GPX y persistidas en Firestore la primera vez que se carga el mapa.
    // Si el documento aún no tiene estos campos valdrán 0 / "".

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

    [JsonPropertyName("zona")]
    public string? Zona { get; set; }
}
