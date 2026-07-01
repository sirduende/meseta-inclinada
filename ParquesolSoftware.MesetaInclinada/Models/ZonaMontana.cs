using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Models;

public class ZonaBounds
{
    [JsonPropertyName("latMin")] public double LatMin { get; set; }
    [JsonPropertyName("latMax")] public double LatMax { get; set; }
    [JsonPropertyName("lngMin")] public double LngMin { get; set; }
    [JsonPropertyName("lngMax")] public double LngMax { get; set; }
}

public class ZonaMontana
{
    [JsonPropertyName("id")]     public string Id     { get; set; } = "";
    [JsonPropertyName("nombre")] public string Nombre { get; set; } = "";
    [JsonPropertyName("tier")]   public int    Tier   { get; set; }
    [JsonPropertyName("bounds")] public ZonaBounds? Bounds { get; set; }

    public bool ContienePunto(double lat, double lng) =>
        Bounds != null &&
        lat >= Bounds.LatMin && lat <= Bounds.LatMax &&
        lng >= Bounds.LngMin && lng <= Bounds.LngMax;

    public double Area => Bounds == null
        ? double.MaxValue
        : (Bounds.LatMax - Bounds.LatMin) * (Bounds.LngMax - Bounds.LngMin);
}
