using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

public class RutaSecundaria
{
    [JsonPropertyName("nombreRuta")]
    public string NombreRuta { get; set; } = string.Empty;

    [JsonPropertyName("cumbrePrincipal")]
    public string CumbrePrincipal { get; set; } = string.Empty;

    [JsonPropertyName("dificultad")]
    public string Dificultad { get; set; } = string.Empty;

    [JsonPropertyName("añoRuta")]
    public int AnoRuta { get; set; }

    [JsonPropertyName("enlaceWikiloc")]
    public string EnlaceWikiloc { get; set; } = string.Empty;

    [JsonPropertyName("archivoGPX")]
    public string ArchivoGPX { get; set; } = string.Empty;

    [JsonPropertyName("propuestoPor")]
    public string PropuestoPor { get; set; } = string.Empty;

    [JsonPropertyName("aviso")]
    public string? Aviso { get; set; }

    // Metadatos de Firestore (nulos si viene del JSON estático legacy)
    [JsonPropertyName("creadoPor")]
    public string? CreadoPor { get; set; }

    [JsonPropertyName("fechaCreacion")]
    public string? FechaCreacion { get; set; }

    // "secundario" = propuesta del reto con cumbre de referencia
    // "libre"      = propuesta libre sin cumbre asignada
    [JsonPropertyName("tipoPropuesta")]
    public string TipoPropuesta { get; set; } = "secundario";

    // ID del documento en Firestore — se deserializa al leer, pero nunca se envía a Firestore
    // (SavePropuestaAsync construye el payload manualmente sin incluir este campo)
    [JsonPropertyName("firestoreId")]
    public string? FirestoreId { get; set; }
}
