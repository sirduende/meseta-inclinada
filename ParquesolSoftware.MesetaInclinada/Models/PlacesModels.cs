using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

// ── Autocomplete ──────────────────────────────────────────────────────────────

public class PlacesAutocompleteResponse
{
    [JsonPropertyName("predictions")] public List<Prediction> Predictions { get; set; } = new();
    [JsonPropertyName("status")]      public string Status { get; set; } = string.Empty;
}

public class Prediction
{
    [JsonPropertyName("description")]           public string Description { get; set; } = string.Empty;
    [JsonPropertyName("place_id")]              public string PlaceId { get; set; } = string.Empty;
    [JsonPropertyName("structured_formatting")] public StructuredFormatting? StructuredFormatting { get; set; }
}

public class StructuredFormatting
{
    [JsonPropertyName("main_text")]      public string MainText { get; set; } = string.Empty;
    [JsonPropertyName("secondary_text")] public string SecondaryText { get; set; } = string.Empty;
}

// ── Place Details ─────────────────────────────────────────────────────────────

public class PlaceDetailsResponse
{
    [JsonPropertyName("result")] public PlaceResult? Result { get; set; }
    [JsonPropertyName("status")] public string Status { get; set; } = string.Empty;
}

public class PlaceResult
{
    [JsonPropertyName("name")]               public string Name { get; set; } = string.Empty;
    [JsonPropertyName("formatted_address")]  public string FormattedAddress { get; set; } = string.Empty;
    [JsonPropertyName("geometry")]           public PlaceGeometry? Geometry { get; set; }
    [JsonPropertyName("address_components")] public List<AddressComponent> AddressComponents { get; set; } = new();

    /// <summary>Extrae la localidad (ciudad) de los address_components.</summary>
    public string? GetLocality() =>
        AddressComponents.FirstOrDefault(c => c.Types.Contains("locality"))?.LongName;
}

public class PlaceGeometry
{
    [JsonPropertyName("location")] public GeoLocation? Location { get; set; }
}

public class GeoLocation
{
    [JsonPropertyName("lat")] public double Lat { get; set; }
    [JsonPropertyName("lng")] public double Lng { get; set; }
}

public class AddressComponent
{
    [JsonPropertyName("long_name")]  public string LongName { get; set; } = string.Empty;
    [JsonPropertyName("short_name")] public string ShortName { get; set; } = string.Empty;
    [JsonPropertyName("types")]      public List<string> Types { get; set; } = new();
}
