using ParquesolSoftware.MesetaInclinada.Models;
using System.Net.Http.Json;

namespace ParquesolSoftware.MesetaInclinada.Services;

/// <summary>
/// Cliente C# para las Cloud Functions de Google Places.
/// Las funciones actúan de proxy seguro: la API key nunca llega al navegador.
///
/// Tras desplegar las Cloud Functions (firebase deploy --only functions),
/// sustituye las URLs placeholder por las reales que aparecen en la consola.
/// </summary>
public class MapsService
{
    private readonly HttpClient _http;

    // ── URLs de Cloud Functions (europe-west1, proyecto mesetainclinada) ────
    private const string AutocompleteUrl = "https://placesautocomplete-lk763nlkma-ew.a.run.app";
    private const string DetailsUrl      = "https://europe-west1-mesetainclinada.cloudfunctions.net/placedetails";

    public MapsService(HttpClient httpClient) => _http = httpClient;

    /// <summary>
    /// Devuelve hasta 5 predicciones de autocompletado para la cadena dada.
    /// Devuelve null si hay error o si la URL aún no está configurada.
    /// </summary>
    public async Task<PlacesAutocompleteResponse?> SearchPlacesAsync(string input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        try
        {
            return await _http.GetFromJsonAsync<PlacesAutocompleteResponse>(
                $"{AutocompleteUrl}?input={Uri.EscapeDataString(input)}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MapsService] SearchPlaces error: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Obtiene los detalles de un lugar (nombre, dirección, coordenadas)
    /// a partir de su Google Place ID.
    /// </summary>
    public async Task<PlaceDetailsResponse?> GetPlaceDetailsAsync(string placeId)
    {
        if (string.IsNullOrEmpty(placeId)) return null;
        try
        {
            return await _http.GetFromJsonAsync<PlaceDetailsResponse>(
                $"{DetailsUrl}?placeId={Uri.EscapeDataString(placeId)}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[MapsService] GetPlaceDetails error: {ex.Message}");
            return null;
        }
    }
}
