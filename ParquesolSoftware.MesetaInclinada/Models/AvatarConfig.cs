using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

/// <summary>
/// Configuración visual del avatar DiceBear ToonHead de un miembro.
/// Se guarda en Firestore bajo la colección "avatares", con el nombre del miembro como ID.
/// Solo se almacena la URL completa de DiceBear, que contiene todos los parámetros.
/// </summary>
public class AvatarConfig
{
    /// <summary>Nombre del miembro (clave en Firestore).</summary>
    [JsonPropertyName("nombre")]
    public string Nombre { get; set; } = string.Empty;

    /// <summary>URL completa de DiceBear con todos los parámetros de personalización.</summary>
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    /// <summary>URL de la imagen o placeholder si aún no tiene avatar guardado.</summary>
    public string UrlODefault =>
        !string.IsNullOrEmpty(Url) ? Url
        : $"https://api.dicebear.com/9.x/adventurer/svg?seed={Uri.EscapeDataString(Nombre)}";
}
