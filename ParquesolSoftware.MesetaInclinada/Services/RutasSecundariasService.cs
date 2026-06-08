using System.Net.Http.Json;
using ParquesolSoftware.MesetaInclinada.Models;

namespace ParquesolSoftware.MesetaInclinada.Services;

/// <summary>
/// Lee las propuestas de rutas secundarias desde Firestore (colección "propuestas").
/// Si Firestore está vacío (migración pendiente), hace fallback al JSON estático legacy.
/// </summary>
public class RutasSecundariasService
{
    private readonly HttpClient _httpClient;
    private readonly FirestoreService _firestoreService;
    private List<RutaSecundaria>? _cache;

    public RutasSecundariasService(HttpClient httpClient, FirestoreService firestoreService)
    {
        _httpClient = httpClient;
        _firestoreService = firestoreService;
    }

    public async Task<List<RutaSecundaria>> GetAllAsync()
    {
        if (_cache != null) return _cache;

        try
        {
            var propuestas = await _firestoreService.GetPropuestasAsync();
            if (propuestas.Count > 0)
            {
                _cache = propuestas;
                return _cache;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Firestore no disponible, usando JSON legacy: {ex.Message}");
        }

        // Fallback al JSON estático (antes de la migración)
        try
        {
            _cache = await _httpClient.GetFromJsonAsync<List<RutaSecundaria>>("/data/rutas-secundarias.json");
            return _cache ?? new List<RutaSecundaria>();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error cargando rutas secundarias: {ex.Message}");
            return new List<RutaSecundaria>();
        }
    }

    /// <summary>
    /// Invalida la caché para forzar recarga (útil tras crear/borrar propuestas).
    /// </summary>
    public void InvalidarCache() => _cache = null;
}
