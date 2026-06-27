using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

public class ResenaGastro
{
    [JsonPropertyName("sitioId")]       public string? SitioId { get; set; }
    [JsonPropertyName("uid")]           public string Uid { get; set; } = string.Empty;
    [JsonPropertyName("nombreUsuario")] public string NombreUsuario { get; set; } = string.Empty;
    [JsonPropertyName("estrellas")]     public int Estrellas { get; set; }
    [JsonPropertyName("comentario")]    public string Comentario { get; set; } = string.Empty;
    [JsonPropertyName("fecha")]         public string Fecha { get; set; } = string.Empty;
}
