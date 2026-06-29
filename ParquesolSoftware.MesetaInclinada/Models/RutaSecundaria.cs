using System.Text.Json.Serialization;
using System.Text.RegularExpressions;

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

    /// <summary>True si es una propuesta libre (fuera del reto de cumbres).</summary>
    public bool EsLibre => TipoPropuesta == "libre" || CumbrePrincipal == "Fuera de Reto";

    /// <summary>Color hex asociado al nivel de dificultad.</summary>
    public string DificultadColor => Dificultad switch
    {
        "Fácil"       => "#22c55e",
        "Moderada"    => "#f97316",
        "Difícil"     => "#ef4444",
        "Muy difícil" => "#1f2937",
        _             => "#6b7280"
    };

    /// <summary>Número de orden extraído del prefijo numérico de CumbrePrincipal (para ordenación).</summary>
    public int NumeroOrden
    {
        get
        {
            var m = Regex.Match(CumbrePrincipal, @"^(\d+)");
            return m.Success ? int.Parse(m.Groups[1].Value) : 999;
        }
    }
}
