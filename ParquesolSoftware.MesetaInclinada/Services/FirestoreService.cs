using Microsoft.JSInterop;
using ParquesolSoftware.MesetaInclinada.Models;
using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace ParquesolSoftware.MesetaInclinada.Services;

public class FirestoreService
{
    private readonly IJSRuntime _jsRuntime;
    private readonly HttpClient _httpClient;
    private bool _isInitialized = false;

    public FirestoreService(IJSRuntime jsRuntime, HttpClient httpClient)
    {
        _jsRuntime = jsRuntime;
        _httpClient = httpClient;
    }

    public async Task<bool> InitializeAsync()
    {
        if (_isInitialized) return true;

        try
        {
            var config = await _httpClient.GetFromJsonAsync<FirebaseConfig>("/firebase-config.json");
            if (config == null) return false;

            var firebaseConfig = new
            {
                apiKey = config.ApiKey,
                authDomain = config.AuthDomain,
                projectId = config.ProjectId,
                storageBucket = config.StorageBucket,
                messagingSenderId = config.MessagingSenderId,
                appId = config.AppId
            };

            var result = await _jsRuntime.InvokeAsync<bool>("firebaseInterop.initialize", firebaseConfig);
            _isInitialized = result;
            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error initializing Firebase: {ex.Message}");
            return false;
        }
    }

    // === RUTAS ===

    public async Task<List<Ruta>> GetRutasAsync(int? year = null)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<Ruta>>>("firebaseInterop.getRutasByYear", year);
        return result.Success && result.Data != null ? result.Data : new List<Ruta>();
    }

    public async Task<Ruta?> GetRutaAsync(string id)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<Ruta>>("firebaseInterop.getRuta", id);
        return result.Success ? result.Data : null;
    }

    public async Task<bool> SaveRutaAsync(string id, Ruta ruta)
    {
        await EnsureInitializedAsync();
        var data = new
        {
            id = ruta.Id,
            nombre = ruta.Nombre,
            archivo = ruta.Archivo,
            fecha = ruta.Fecha,
            descripcion = ruta.Descripcion,
            dificultad = ruta.Dificultad,
            relive = ruta.Relive,
            participantes = ruta.Participantes
        };
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.saveRuta", id, data);
        return result.Success;
    }

    /// <summary>
    /// Borra las métricas GPX de una ruta (pone a 0) para forzar recálculo
    /// la próxima vez que el admin cargue el mapa.
    /// </summary>
    public async Task<bool> ResetRutaMetricasAsync(string id)
    {
        await EnsureInitializedAsync();
        var metricas = new { distanciaKm = 0.0, desnivelM = 0.0, duracionS = 0.0, duracionFormateada = "", nivel = "" };
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>(
            "firebaseInterop.patchRutaMetricas", id, metricas);
        return result.Success;
    }

    /// <summary>
    /// Actualiza solo los campos de métricas GPX en el documento de Firestore existente.
    /// Se llama automáticamente la primera vez que se carga el mapa y el GPX es procesado.
    /// Usa update() en lugar de set() para no sobreescribir el resto de campos.
    /// </summary>
    public async Task<bool> PatchRutaMetricasAsync(string id, RutaEnriquecida e)
    {
        await EnsureInitializedAsync();
        var metricas = new
        {
            distanciaKm = e.DistanciaKm,
            desnivelM    = e.DesnivelM,
            duracionS    = e.DuracionS,
            duracionFormateada = e.DuracionFormateada,
            nivel        = e.Nivel
        };
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>(
            "firebaseInterop.patchRutaMetricas", id, metricas);
        return result.Success;
    }

    public async Task<bool> DeleteRutaAsync(string id)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.deleteRuta", id);
        return result.Success;
    }

    public async Task<string> GetNextRutaIdAsync()
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<string>>("firebaseInterop.getNextRutaId");
        return result.Success && result.Data != null ? result.Data : "1";
    }

    public async Task<List<string>> GetParticipantesUnicosAsync()
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<string>>>("firebaseInterop.getParticipantesUnicos");
        return result.Success && result.Data != null ? result.Data : new List<string>();
    }

    // === CUMBRES ===

    public async Task<List<CumbreFDMESCYL>> GetCumbresFDMESCYLAsync()
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<CumbreFDMESCYL>>>("firebaseInterop.getCumbres");
        return result.Success && result.Data != null ? result.Data : new List<CumbreFDMESCYL>();
    }

    public async Task<bool> ToggleCumbreAsync(int id, bool cubierta)
    {
        try
        {
            await EnsureInitializedAsync();
            var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.toggleCumbre", id, cubierta);
            return result.Success;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Cumbres] ToggleCumbreAsync({id}) error: {ex.Message}");
            return false;
        }
    }

    // === ROLES ===

    public async Task<bool> IsAdminAsync(string uid)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<bool>>("firebaseInterop.isAdmin", uid);
        return result.Success && result.Data;
    }

    public async Task<RolData> GetRolDataAsync(string uid)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<RolDataJs>>("firebaseInterop.getRolData", uid);
        if (!result.Success || result.Data == null)
            return new RolData();
        return new RolData
        {
            IsAdmin        = result.Data.Admin,
            IsMember       = result.Data.Miembro,
            NombreMostrado = result.Data.NombreMostrado
        };
    }

    // === MIEMBROS ===

    public async Task<List<Miembro>> GetMiembrosAsync()
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<Miembro>>>("firebaseInterop.getMembers");
        return result.Success && result.Data != null ? result.Data : new();
    }

    public async Task<bool> SaveMiembroAsync(string uid, Miembro m)
    {
        await EnsureInitializedAsync();
        var data = new { email = m.Email, nombreMostrado = m.NombreMostrado };
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.saveMember", uid, data);
        return result.Success;
    }

    public async Task<bool> DeleteMiembroAsync(string uid)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.deleteMember", uid);
        return result.Success;
    }

    // === SOLICITUDES ===

    public async Task<List<Solicitud>> GetSolicitudesAsync()
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<Solicitud>>>("firebaseInterop.getSolicitudes");
        return result.Success && result.Data != null ? result.Data : new();
    }

    public async Task<bool> SaveSolicitudAsync(UserInfo user)
    {
        await EnsureInitializedAsync();
        var data = new
        {
            uid           = user.Uid,
            email         = user.Email,
            displayName   = user.DisplayName,
            fechaSolicitud = DateTime.Today.ToString("yyyy-MM-dd")
        };
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.saveSolicitud", user.Uid, data);
        return result.Success;
    }

    public async Task<bool> DeleteSolicitudAsync(string uid)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.deleteSolicitud", uid);
        return result.Success;
    }

    // === INVITACIONES ===

    public async Task<List<Invitacion>> GetInvitacionesAsync()
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<Invitacion>>>("firebaseInterop.getInvitaciones");
        return result.Success && result.Data != null ? result.Data : new();
    }

    public async Task<bool> SaveInvitacionAsync(Invitacion inv)
    {
        await EnsureInitializedAsync();
        var data = new { nombreMostrado = inv.NombreMostrado, fechaInvitacion = inv.FechaInvitacion };
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.saveInvitacion", inv.Email, data);
        return result.Success;
    }

    public async Task<bool> DeleteInvitacionAsync(string email)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.deleteInvitacion", email);
        return result.Success;
    }

    public async Task<Invitacion?> CheckInvitacionAsync(string email)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<Invitacion>>("firebaseInterop.checkInvitacion", email);
        return result.Success ? result.Data : null;
    }

    // === PROPUESTAS ===

    public async Task<List<RutaSecundaria>> GetPropuestasAsync()
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<RutaSecundaria>>>("firebaseInterop.getPropuestas");
        return result.Success && result.Data != null ? result.Data : new();
    }

    public async Task<bool> SavePropuestaAsync(string? id, RutaSecundaria p)
    {
        await EnsureInitializedAsync();
        var data = new
        {
            nombreRuta       = p.NombreRuta,
            cumbrePrincipal  = p.CumbrePrincipal,
            dificultad       = p.Dificultad,
            anoRuta          = p.AnoRuta,
            enlaceWikiloc    = p.EnlaceWikiloc,
            archivoGPX       = p.ArchivoGPX,
            propuestoPor     = p.PropuestoPor,
            aviso            = p.Aviso,
            creadoPor        = p.CreadoPor,
            fechaCreacion    = p.FechaCreacion
        };
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.savePropuesta", id, data);
        return result.Success;
    }

    public async Task<bool> DeletePropuestaAsync(string id)
    {
        await EnsureInitializedAsync();
        var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.deletePropuesta", id);
        return result.Success;
    }

    // === GASTRO ===

    public async Task<List<SitioGastro>> GetGastroSitiosAsync()
    {
        try
        {
            await EnsureInitializedAsync();
            var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<SitioGastro>>>("firebaseInterop.getGastroSitios");
            return result.Success && result.Data != null ? result.Data : new();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Gastro] GetGastroSitiosAsync error: {ex.Message}");
            return new();
        }
    }

    public async Task<bool> SaveGastroSitioAsync(string? id, SitioGastro s)
    {
        try
        {
            await EnsureInitializedAsync();
            var data = new
            {
                nombre        = s.Nombre,
                placeId       = s.PlaceId,
                lat           = s.Lat,
                lng           = s.Lng,
                direccion     = s.Direccion,
                comentario    = s.Comentario,
                creadoPor     = s.CreadoPor,
                nombreCreador = s.NombreCreador,
                fechaCreacion = s.FechaCreacion
            };
            var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.saveGastroSitio", id, data);
            return result.Success;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Gastro] SaveGastroSitioAsync error: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> DeleteGastroSitioAsync(string id)
    {
        try
        {
            await EnsureInitializedAsync();
            var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.deleteGastroSitio", id);
            return result.Success;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Gastro] DeleteGastroSitioAsync error: {ex.Message}");
            return false;
        }
    }

    // === AVATARES ===

    public async Task<List<AvatarConfig>> GetAvatarConfigsAsync()
    {
        try
        {
            await EnsureInitializedAsync();
            var result = await _jsRuntime.InvokeAsync<FirestoreResult<List<AvatarConfig>>>("firebaseInterop.getAvatarConfigs");
            return result.Success && result.Data != null ? result.Data : new();
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Avatares] GetAvatarConfigsAsync error: {ex.Message}");
            return new();
        }
    }

    public async Task<AvatarConfig?> GetAvatarConfigAsync(string nombre)
    {
        try
        {
            await EnsureInitializedAsync();
            var result = await _jsRuntime.InvokeAsync<FirestoreResult<AvatarConfig>>("firebaseInterop.getAvatarConfig", nombre);
            return result.Success ? result.Data : null;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Avatares] GetAvatarConfigAsync({nombre}) error: {ex.Message}");
            return null;
        }
    }

    public async Task<bool> SaveAvatarConfigAsync(AvatarConfig config)
    {
        try
        {
            await EnsureInitializedAsync();
            var data = new { nombre = config.Nombre, url = config.Url };
            var result = await _jsRuntime.InvokeAsync<FirestoreResult<object>>("firebaseInterop.saveAvatarConfig", config.Nombre, data);
            return result.Success;
        }
        catch (Exception ex)
        {
            Console.Error.WriteLine($"[Avatares] SaveAvatarConfigAsync({config.Nombre}) error: {ex.Message}");
            return false;
        }
    }

    private async Task EnsureInitializedAsync()
    {
        if (!_isInitialized) await InitializeAsync();
    }
}

public class FirebaseConfig
{
    [JsonPropertyName("apiKey")]
    public string ApiKey { get; set; } = string.Empty;

    [JsonPropertyName("authDomain")]
    public string AuthDomain { get; set; } = string.Empty;

    [JsonPropertyName("projectId")]
    public string ProjectId { get; set; } = string.Empty;

    [JsonPropertyName("storageBucket")]
    public string StorageBucket { get; set; } = string.Empty;

    [JsonPropertyName("messagingSenderId")]
    public string MessagingSenderId { get; set; } = string.Empty;

    [JsonPropertyName("appId")]
    public string AppId { get; set; } = string.Empty;
}

public class FirestoreResult<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Id { get; set; }
    public string? Error { get; set; }
}

// Estructura del documento roles/{uid} tal como viene de JS
internal class RolDataJs
{
    [System.Text.Json.Serialization.JsonPropertyName("admin")]
    public bool Admin { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("miembro")]
    public bool Miembro { get; set; }

    [System.Text.Json.Serialization.JsonPropertyName("nombreMostrado")]
    public string? NombreMostrado { get; set; }
}
