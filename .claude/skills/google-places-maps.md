---
description: Use when the user wants to integrate Google Places (autocomplete, place search, place details), show a Google Map with markers, add geolocation (GPS coordinates) to a model, or set up the Google Maps/Places API via Firebase Cloud Functions as a secure proxy. Also use when configuring Google Cloud Console for Maps/Places/Geocoding APIs, storing API keys as Firebase secrets, or building a search-and-select UI that auto-fills address/coordinates from a place selection.
---

# Google Places + Maps Integration (Blazor WASM + Firebase Cloud Functions)

## Architecture — Secure API Key Proxy

```
Browser (Blazor WASM)
    → Firebase Cloud Function (proxy, holds API key as secret)
        → Google Maps / Places / Geocoding API
```

**Never** expose the Google Maps API key in the browser or in git. The Blazor app calls the Cloud Function URL; the function injects the key server-side.

---

## 1. Google Cloud Console Setup (Checklist)

- [ ] Go to https://console.cloud.google.com → select your Firebase project
- [ ] **APIs & Services → Enable APIs:**
  - Places API (for autocomplete + place details)
  - Maps JavaScript API (for the interactive map in browser)
  - Geocoding API (for reverse geocode lat/lng → address)
- [ ] **Create API Key** with restrictions:
  - Maps JS key: restrict to HTTP referrers (your domain + `localhost`)
  - Cloud Functions key: restrict to IP or leave unrestricted (stored as secret, not in browser)
- [ ] Store the key as a Firebase secret (see section 2)

---

## 2. Firebase Cloud Functions — API Proxy (functions/index.js)

```javascript
const { defineSecret } = require('firebase-functions/params');
const { onRequest } = require('firebase-functions/v2/https');
const { logger } = require('firebase-functions');

const googleMapsApiKey = defineSecret("GOOGLE_MAPS_API_KEY");

// Shared options for all functions
const fnOptions = {
    secrets: [googleMapsApiKey],
    cors: true,
    invoker: "public",
    maxInstances: 10  // Cost control on free tier
};

// ── Places Autocomplete ──────────────────────────────────────────────────────
exports.placesautocomplete = onRequest(fnOptions, async (req, res) => {
    try {
        const apiKey = googleMapsApiKey.value();
        const input = req.query.input;
        if (!input) { res.status(400).json({ error: 'input required' }); return; }

        const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
            `?input=${encodeURIComponent(input)}` +
            `&types=establishment` +
            `&language=es` +
            `&components=country:es` +   // restrict to Spain — change as needed
            `&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error('placesautocomplete error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── Place Details ────────────────────────────────────────────────────────────
exports.placedetails = onRequest(fnOptions, async (req, res) => {
    try {
        const apiKey = googleMapsApiKey.value();
        const placeId = req.query.placeId;
        if (!placeId) { res.status(400).json({ error: 'placeId required' }); return; }

        const url = `https://maps.googleapis.com/maps/api/place/details/json` +
            `?place_id=${encodeURIComponent(placeId)}` +
            `&fields=name,formatted_address,geometry,address_components` +
            `&language=es` +
            `&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error('placedetails error:', error);
        res.status(500).json({ error: error.message });
    }
});

// ── Reverse Geocode (lat/lng → address) ─────────────────────────────────────
exports.reversegeocode = onRequest(fnOptions, async (req, res) => {
    try {
        const apiKey = googleMapsApiKey.value();
        const { lat, lng } = req.query;
        if (!lat || !lng) { res.status(400).json({ error: 'lat and lng required' }); return; }

        const url = `https://maps.googleapis.com/maps/api/geocode/json` +
            `?latlng=${lat},${lng}` +
            `&language=es` +
            `&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        logger.error('reversegeocode error:', error);
        res.status(500).json({ error: error.message });
    }
});
```

**firebase.json** — required config for v2 secrets:
```json
"functions": [{
  "source": "functions",
  "codebase": "default",
  "disallowLegacyRuntimeConfig": true
}]
```

**Deploy commands:**
```bash
firebase functions:secrets:set GOOGLE_MAPS_API_KEY
firebase deploy --only functions
```

After deploy, the function URLs follow the pattern:
`https://<functionname>-<hash>-uc.a.run.app`

Verify public access: Cloud Console → Cloud Run → select function → Permissions → `allUsers` with `Cloud Run Invoker`.

---

## 3. MapsService.cs — C# Service

```csharp
public class MapsService
{
    private readonly HttpClient _http;

    // Replace with your actual Cloud Run URLs after deploy
    private const string AutocompleteUrl = "https://placesautocomplete-XXXX-uc.a.run.app";
    private const string DetailsUrl      = "https://placedetails-XXXX-uc.a.run.app";
    private const string GeocodeUrl      = "https://reversegeocode-XXXX-uc.a.run.app";

    public MapsService(HttpClient httpClient) => _http = httpClient;

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
            Console.WriteLine($"SearchPlaces error: {ex.Message}");
            return null;
        }
    }

    public async Task<PlaceDetailsResponse?> GetPlaceDetailsAsync(string placeId)
    {
        try
        {
            return await _http.GetFromJsonAsync<PlaceDetailsResponse>(
                $"{DetailsUrl}?placeId={Uri.EscapeDataString(placeId)}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"GetPlaceDetails error: {ex.Message}");
            return null;
        }
    }

    public async Task<ReverseGeocodeResponse?> ReverseGeocodeAsync(double lat, double lng)
    {
        try
        {
            return await _http.GetFromJsonAsync<ReverseGeocodeResponse>(
                $"{GeocodeUrl}?lat={lat}&lng={lng}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"ReverseGeocode error: {ex.Message}");
            return null;
        }
    }
}
```

Register in `Program.cs`:
```csharp
builder.Services.AddScoped<MapsService>();
```

---

## 4. Response Model Classes (C#)

```csharp
// ── Autocomplete ─────────────────────────────────────────────────────────────
public class PlacesAutocompleteResponse
{
    [JsonPropertyName("predictions")] public List<Prediction> Predictions { get; set; } = new();
    [JsonPropertyName("status")]      public string Status { get; set; } = string.Empty;
}

public class Prediction
{
    [JsonPropertyName("description")]          public string Description { get; set; } = string.Empty;
    [JsonPropertyName("place_id")]             public string PlaceId { get; set; } = string.Empty;
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
    [JsonPropertyName("name")]              public string Name { get; set; } = string.Empty;
    [JsonPropertyName("formatted_address")] public string FormattedAddress { get; set; } = string.Empty;
    [JsonPropertyName("geometry")]          public Geometry? Geometry { get; set; }
    [JsonPropertyName("address_components")] public List<AddressComponent> AddressComponents { get; set; } = new();

    // Helper: extract city from address components
    public string? GetLocality() =>
        AddressComponents.FirstOrDefault(c => c.Types.Contains("locality"))?.LongName;
}

public class Geometry
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

// ── Reverse Geocode ───────────────────────────────────────────────────────────
public class ReverseGeocodeResponse
{
    [JsonPropertyName("results")] public List<GeocodeResult> Results { get; set; } = new();
    [JsonPropertyName("status")]  public string Status { get; set; } = string.Empty;
}

public class GeocodeResult
{
    [JsonPropertyName("formatted_address")] public string FormattedAddress { get; set; } = string.Empty;
    [JsonPropertyName("place_id")]          public string PlaceId { get; set; } = string.Empty;
    [JsonPropertyName("geometry")]          public Geometry? Geometry { get; set; }
}
```

---

## 5. Geolocation Fields in Domain Model

```csharp
public class MyEntity
{
    // ... other fields ...

    // Geolocation — all optional (entity may not have a location yet)
    [JsonPropertyName("latitud")]       public double? Latitud { get; set; }
    [JsonPropertyName("longitud")]      public double? Longitud { get; set; }
    [JsonPropertyName("googlePlaceId")] public string? GooglePlaceId { get; set; }
    [JsonPropertyName("direccion")]     public string? Direccion { get; set; }

    // Computed helpers
    public bool TieneGeolocalizacion => Latitud.HasValue && Longitud.HasValue;

    public string? GoogleMapsUrl =>
        !string.IsNullOrEmpty(GooglePlaceId)
            ? $"https://www.google.com/maps/place/?q=place_id:{GooglePlaceId}"
            : TieneGeolocalizacion
                ? $"https://www.google.com/maps?q={Latitud},{Longitud}"
                : null;
}
```

---

## 6. maps-interop.js — Map Display in Browser

```javascript
// Load Maps SDK dynamically (call once, before initializeMap)
window.loadGoogleMapsScript = function(apiKey) {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) { resolve(); return; }
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&language=es&v=weekly`;
        script.async = true;
        script.onload = () => {
            // Wait for importLibrary to be available
            let retries = 0;
            const check = setInterval(() => {
                if (window.google?.maps?.importLibrary || retries++ > 20) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

// Render map with markers
// markers: [{ lat, lng, nombre, precio, poblacion, googleMapsUrl, notaMedia, ranking }]
window.initializeMap = async function(containerId, center, zoom, markers) {
    const { Map } = await google.maps.importLibrary("maps");
    const { AdvancedMarkerElement, PinElement } = await google.maps.importLibrary("marker");

    const map = new Map(document.getElementById(containerId), {
        center,
        zoom,
        mapId: 'DEMO_MAP_ID'   // required for Advanced Markers; replace with real Map ID in production
    });

    let openInfoWindow = null;

    markers.forEach(m => {
        const pin = new PinElement({
            background: '#EA4335',
            borderColor: '#C62828',
            glyphColor: 'white',
            scale: 1.1
        });

        const marker = new AdvancedMarkerElement({
            map,
            position: { lat: m.lat, lng: m.lng },
            title: m.nombre,
            content: pin.element
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `
                <div style="max-width:220px;font-family:sans-serif">
                    ${m.ranking ? `<div style="background:#FFD700;border-radius:4px;padding:2px 8px;font-size:11px;font-weight:700;margin-bottom:6px">🏆 TOP ${m.ranking}</div>` : ''}
                    <h6 style="margin:0 0 4px;font-size:14px">${m.nombre}</h6>
                    ${m.notaMedia ? `<div style="color:#666;font-size:12px">⭐ ${m.notaMedia.toFixed(1)}</div>` : ''}
                    <div style="color:#666;font-size:12px">${m.poblacion} · ${m.precio ? '€'.repeat(Math.round(m.precio)) : ''}</div>
                    ${m.googleMapsUrl ? `<a href="${m.googleMapsUrl}" target="_blank" style="font-size:12px">Ver en Google Maps</a>` : ''}
                </div>`
        });

        marker.addListener('gmp-click', () => {
            if (openInfoWindow) openInfoWindow.close();
            infoWindow.open({ map, anchor: marker });
            openInfoWindow = infoWindow;
        });
    });

    // Auto-fit bounds if multiple markers
    if (markers.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(m => bounds.extend({ lat: m.lat, lng: m.lng }));
        map.fitBounds(bounds);
    }
};
```

---

## 7. geolocation-interop.js — Browser GPS

```javascript
window.geolocationInterop = {
    getCurrentPosition() {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve({ error: 'Geolocalización no soportada en este navegador.' });
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => {
                    const messages = {
                        1: 'Permiso denegado. Por favor permite el acceso a tu ubicación.',
                        2: 'Ubicación no disponible.',
                        3: 'Tiempo de espera agotado.'
                    };
                    resolve({ error: messages[err.code] || err.message });
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    }
};
```

Call from C# via `IJSRuntime`:
```csharp
var pos = await _jsRuntime.InvokeAsync<GeoPosition>("geolocationInterop.getCurrentPosition");
if (pos.Error == null) { entity.Latitud = pos.Lat; entity.Longitud = pos.Lng; }

record GeoPosition(double Lat, double Lng, string? Error);
```

---

## 8. UI Pattern — Search Input → Auto-fill Form (Razor)

```razor
@inject MapsService Maps
@inject IJSRuntime JS

<!-- Search field -->
<input @bind-value="searchInput" @bind-value:event="oninput"
       @oninput="OnSearchChanged" placeholder="Buscar lugar..." />

@if (predictions.Any())
{
    <div class="autocomplete-dropdown">
        @foreach (var p in predictions)
        {
            <div class="autocomplete-item" @onclick="() => SelectPlace(p.PlaceId)">
                <strong>@p.StructuredFormatting?.MainText</strong>
                <small>@p.StructuredFormatting?.SecondaryText</small>
            </div>
        }
    </div>
}

<!-- GPS button -->
<button @onclick="UseMyLocation">📍 Usar mi ubicación</button>

@if (entity.TieneGeolocalizacion)
{
    <div class="alert-success">
        ✅ Ubicación: <a href="@entity.GoogleMapsUrl" target="_blank">Ver en Google Maps</a>
    </div>
}

@code {
    private string searchInput = "";
    private List<Prediction> predictions = new();
    private System.Timers.Timer? _debounce;

    private void OnSearchChanged(ChangeEventArgs e)
    {
        searchInput = e.Value?.ToString() ?? "";
        _debounce?.Stop();
        _debounce = new(500) { AutoReset = false };
        _debounce.Elapsed += async (_, _) =>
        {
            var resp = await Maps.SearchPlacesAsync(searchInput);
            predictions = resp?.Predictions ?? new();
            await InvokeAsync(StateHasChanged);
        };
        _debounce.Start();
    }

    private async Task SelectPlace(string placeId)
    {
        predictions.Clear();
        var resp = await Maps.GetPlaceDetailsAsync(placeId);
        var place = resp?.Result;
        if (place == null) return;

        entity.NombreSitio = place.Name;
        entity.Latitud     = place.Geometry?.Location?.Lat;
        entity.Longitud    = place.Geometry?.Location?.Lng;
        entity.GooglePlaceId = placeId;
        entity.Direccion   = place.FormattedAddress;
        entity.Poblacion   = place.GetLocality() ?? entity.Poblacion;
    }

    private async Task UseMyLocation()
    {
        var pos = await JS.InvokeAsync<GeoPosition>("geolocationInterop.getCurrentPosition");
        if (pos.Error != null) { /* show error */ return; }

        entity.Latitud  = pos.Lat;
        entity.Longitud = pos.Lng;

        var geo = await Maps.ReverseGeocodeAsync(pos.Lat, pos.Lng);
        if (geo?.Results.FirstOrDefault() is { } result)
        {
            entity.Direccion    = result.FormattedAddress;
            entity.GooglePlaceId = result.PlaceId;
        }
    }

    record GeoPosition(double Lat, double Lng, string? Error);
}
```

---

## 9. Mapa Page Pattern (Blazor)

```razor
@page "/mapa"
@inject ValoracionService Valoraciones
@inject IJSRuntime JS

<div id="mapa-principal" style="width:100%;height:500px;border-radius:12px"></div>

@code {
    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (!firstRender) return;

        var sitios = await Valoraciones.GetSitiosAgrupadosAsync("valoracion-desc");
        var conGeo = sitios.Where(s => s.Sitio.TieneGeolocalizacion).ToList();

        // Add ranking
        var markers = conGeo.Select((s, i) => new {
            lat = s.Sitio.Latitud!.Value,
            lng = s.Sitio.Longitud!.Value,
            nombre = s.Sitio.NombreSitio,
            precio = s.Sitio.Precio,
            poblacion = s.Sitio.Poblacion,
            googleMapsUrl = s.Sitio.GoogleMapsUrl,
            notaMedia = s.MediaPonderada,
            ranking = i < 10 ? i + 1 : (int?)null
        });

        var center = new { lat = 41.6521, lng = -4.7286 }; // adjust to your city
        await JS.InvokeVoidAsync("initializeMap", "mapa-principal", center, 12, markers);
    }
}
```

---

## Reference files in patatas-con-palillos
- `ParquesolSoftware.PatatasConPalillos/Services/MapsService.cs`
- `ParquesolSoftware.PatatasConPalillos/wwwroot/js/maps-interop.js`
- `ParquesolSoftware.PatatasConPalillos/wwwroot/js/geolocation-interop.js`
- `ParquesolSoftware.PatatasConPalillos/functions/index.js`
- `ParquesolSoftware.PatatasConPalillos/Models/Sitio.cs` (geolocation fields)
- `ParquesolSoftware.PatatasConPalillos/Pages/Mapa.razor`
- `ParquesolSoftware.PatatasConPalillos/Pages/Admin/SitioForm.razor` (Places search UI)
- `ParquesolSoftware.PatatasConPalillos/Pages/Admin/MapaTest.razor` (testing page)
- `ParquesolSoftware.PatatasConPalillos.IntegrationTests/MapsServiceIntegrationTests.cs`
