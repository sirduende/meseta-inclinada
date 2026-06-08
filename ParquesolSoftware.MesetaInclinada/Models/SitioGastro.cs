using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

public class SitioGastro
{
    [JsonPropertyName("firestoreId")]   public string? FirestoreId { get; set; }
    [JsonPropertyName("nombre")]        public string Nombre { get; set; } = string.Empty;
    [JsonPropertyName("placeId")]       public string PlaceId { get; set; } = string.Empty;
    [JsonPropertyName("lat")]           public double Lat { get; set; }
    [JsonPropertyName("lng")]           public double Lng { get; set; }
    [JsonPropertyName("direccion")]     public string Direccion { get; set; } = string.Empty;
    [JsonPropertyName("comentario")]    public string Comentario { get; set; } = string.Empty;
    [JsonPropertyName("creadoPor")]     public string? CreadoPor { get; set; }
    [JsonPropertyName("nombreCreador")] public string NombreCreador { get; set; } = string.Empty;
    [JsonPropertyName("fechaCreacion")] public string FechaCreacion { get; set; } = string.Empty;

    /// <summary>Enlace a Google Maps usando placeId (preferente) o coordenadas.</summary>
    public string GoogleMapsUrl =>
        !string.IsNullOrEmpty(PlaceId)
            ? $"https://www.google.com/maps/place/?q=place_id:{PlaceId}"
            : $"https://www.google.com/maps?q={Lat.ToString(System.Globalization.CultureInfo.InvariantCulture)},{Lng.ToString(System.Globalization.CultureInfo.InvariantCulture)}";
}
