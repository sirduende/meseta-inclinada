using Microsoft.JSInterop;
using ParquesolSoftware.MesetaInclinada.Models;
using System.Collections.Generic;

namespace ParquesolSoftware.MesetaInclinada.Services;

public class LeafletService
{
    private readonly IJSRuntime _jsRuntime;

    public LeafletService(IJSRuntime jsRuntime)
    {
        _jsRuntime = jsRuntime;
    }

    public async Task InitializeMapAsync(string mapId, double lat, double lng, int zoom)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.initializeMap", mapId, lat, lng, zoom);
    }

    public async Task LoadGpxAsync<T>(string mapId, string routeId, string gpxUrl, int displayIndex, object meta, DotNetObjectReference<T> dotNetHelper) where T : class
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.loadGpxLayer", mapId, routeId, gpxUrl, displayIndex, meta, dotNetHelper);
    }

    public async Task ClearMapAsync(string mapId)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.clearMap", mapId);
    }

    public async Task FitAllBoundsAsync(string mapId)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.fitAllBounds", mapId);
    }

    public async Task ZoomToRouteAsync(string mapId, string routeId)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.zoomToRoute", mapId, routeId);
    }

    public async Task LoadRadarsAsync(string mapId, List<CumbreFDMESCYL> cumbres)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.loadRadars", mapId, cumbres);
    }

    public async Task ClearSecundariasAsync(string mapId)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.clearSecundarias", mapId);
    }

    public async Task SetRadarVisibilityAsync(string mapId, bool visible)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.setRadarVisibility", mapId, visible);
    }

    public async Task SetVerdeVisibilityAsync(string mapId, bool visible)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.setVerdeVisibility", mapId, visible);
    }

    public async Task LoadRutaSecundariaAsync(string mapId, RutaSecundaria ruta, bool visible = true)
        => await _jsRuntime.InvokeVoidAsync("leafletInterop.loadRutaSecundaria", mapId, ruta, visible);

    public async Task SetSecRetoVisibilityAsync(string mapId, bool visible)
        => await _jsRuntime.InvokeVoidAsync("leafletInterop.setSecRetoVisibility", mapId, visible);

    public async Task SetSecLibreVisibilityAsync(string mapId, bool visible)
        => await _jsRuntime.InvokeVoidAsync("leafletInterop.setSecLibreVisibility", mapId, visible);

    public async Task LoadGpxVerdeAsync(string mapId, string routeId, string gpxUrl, object meta)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.loadGpxVerde", mapId, routeId, gpxUrl, meta);
    }

    public async Task DestroyMapAsync(string mapId)
    {
        await _jsRuntime.InvokeVoidAsync("leafletInterop.destroyMap", mapId);
    }

    // ── Gastro markers ───────────────────────────────────────────────────────

    public async Task LoadGastroMarkersAsync(string mapId, List<SitioGastro> sitios)
        => await _jsRuntime.InvokeVoidAsync("leafletInterop.loadGastroMarkers", mapId, sitios);

    public async Task ClearGastroMarkersAsync(string mapId)
        => await _jsRuntime.InvokeVoidAsync("leafletInterop.clearGastroMarkers", mapId);

    public async Task SetGastroVisibilityAsync(string mapId, bool visible)
        => await _jsRuntime.InvokeVoidAsync("leafletInterop.setGastroVisibility", mapId, visible);
}
