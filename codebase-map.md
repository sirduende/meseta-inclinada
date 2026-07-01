# Codebase Map — Meseta Inclinada
_Generado: 2026-06-30 · Actualizar: `/map-codebase`_

## Estructura
```
ParquesolSoftware.MesetaInclinada/
├── Pages/           (14 .razor — ver tabla Páginas)
│   └── Admin/       (5 .razor — AdminPanel, RutaForm, Usuarios, Avatares, AvatarLab)
├── Components/      LoadingSpinner, LoginButton, RouteCard
├── Layout/          MainLayout, MapLayout, NavMenu
├── Services/        (6 .cs — ver tabla Servicios)
├── Models/          (9 .cs — ver tabla Modelos)
└── wwwroot/
    ├── js/          firebase-interop.js · leaflet-interop.js · album-interop.js
    ├── data/        version.json · rutas-2025.json · rutas-secundarias.json · zonas-montana.json
    ├── gpx/         tracks 2025 (estático)
    └── gpx2026/     tracks 2026 (estático)
```

## Servicios
| Servicio | Métodos clave |
|----------|---------------|
| `FirestoreService` | `InitializeAsync()`, `GetRutasAsync(year?)`, `SaveRutaAsync`, `PatchRutaMetricasAsync`, `PatchRutaZonaAsync`, `GetPropuestasAsync`, `SavePropuestaAsync`, `GetGastroSitiosAsync`, `SaveGastroSitioAsync`, `SaveResenaGastroAsync`, `GetMiembrosAsync`, `SaveMiembroAsync`, `CheckInvitacionAsync`, `GetAvatarConfigsAsync`, `SaveAvatarConfigAsync`, `ToggleCumbreAsync` |
| `AuthService` | `SignInWithGoogleAsync()`, `SignOutAsync()`, `InitializeAuthStateListenerAsync()` · Props: `CurrentUser`, `IsAdmin`, `IsMember`, `NombreMostrado` · Evento: `AuthStateChanged` |
| `LeafletService` | `InitializeMapAsync`, `LoadGpxAsync`, `ZoomToRouteAsync`, `LoadRadarsAsync`, `LoadRutaSecundariaAsync`, `LoadGastroMarkersAsync`, `DestroyMapAsync`, `DrawZonaRectAsync`, `ClearZonaRectAsync`, `DrawAllZoneRectsAsync(mapId, zones)`, `HighlightZoneRectAsync(mapId, zonaId)` |
| `StorageService` | `UploadGpxAsync(filename, bytes)`, `GetGpxUrlAsync(filename)` |
| `MapsService` | `SearchPlacesAsync(input)` → autocomplete Google Places · `GetPlaceDetailsAsync(placeId)` |
| `RutasSecundariasService` | `GetAllAsync()` — cache en memoria de propuestas · `InvalidarCache()` |

## Modelos → Firestore
| Clase | Colección Firestore | Campos clave |
|-------|--------------------|-----------| 
| `Ruta` | `rutas/{id}` | Id, Nombre, Fecha (yyyy-MM-dd), Archivo (gpx), Participantes[], DistanciaKm, DesnivelM, DuracionS, **Zona** (string?, id de zona ej. `"montana-palentina"`) |
| `RutaEnriquecida` | — (proyección JS) | Id, Nombre, DistanciaKm, DesnivelM, Participantes[], Color, Index |
| `RutaSecundaria` | `propuestas/{id}` | NombreRuta, CumbrePrincipal, Dificultad, TipoPropuesta (secundario/libre), PropuestoPor, ArchivoGPX, CreadoPor, AnoRuta |
| `CumbreFDMESCYL` | `cumbresFDMESCYL/{id}` | Id (int), Nombre, Lat, Lng, Cubierta (bool), Orden |
| `SitioGastro` | `gastro/{id}` | Nombre, PlaceId, Lat, Lng, Direccion, Comentario, CreadoPor, ValoracionMedia, NumResenas, UltimoComentario |
| `ResenaGastro` | `gastro/{id}/resenas/{uid}` | Uid, NombreUsuario, Estrellas (1-5), Comentario, Fecha |
| `ZonaMontana` | — (estático `data/zonas-montana.json`) | Id, Nombre, Tier, Bounds (latMin/Max, lngMin/Max) · `ContienePunto(lat,lng)` · `Area` |
| `ZonaBounds` | — (parte de ZonaMontana) | LatMin, LatMax, LngMin, LngMax |
| `Miembro` | `miembros/{uid}` | Uid, Email, NombreMostrado, EsAdmin |
| `Invitacion` | `invitaciones/{email}` | Email, NombreMostrado, FechaInvitacion |
| `AvatarConfig` | `avatares/{nombre}` | Nombre (participante), Url (DiceBear SVG URL) |

_Modelos auxiliares en `PlacesModels.cs`: `Prediction`, `PlaceResult`, `PlaceGeometry` (respuestas Google Places API)._  
_`Solicitud` (en `Miembro.cs`) → colección `solicitudes/{uid}`: Uid, Email, DisplayName, FechaSolicitud._

## Páginas
| Fichero | Ruta | Auth | Qué hace |
|---------|------|------|----------|
| `Home.razor` | `/` | — | Presentación + últimas 3 rutas + sección "Conquistando nuevas vistas" (zonas exploradas) |
| `Rutas.razor` | `/rutas` | — | Mapa Leaflet con tracks GPX 2025+2026 |
| `Zonas.razor` | `/zonas` | — | Sidebar numerada con contadores circulares por año (naranja/verde) · muestra todas las zonas del JSON incluidas las de 0 rutas · click → GPX coloreados por año + marcador inicio con mismo color · 21 zonas: eliminadas Pirineos y Picos de Urbión; añadidas Collados del Asón (`colados-ason`) y Las Loras (`las-loras`); Montaña Palentina acotada al macizo real (Cervera/Guardo) |
| `Propuestas.razor` | `/propuestas` | — | Mapa propuestas + filtro gastro |
| `Gastronomia.razor` | `/gastronomia` | — (✅ para reseñar) | Lista sitios gastro con reseñas y valoraciones |
| `Secundarios.razor` | `/secundarios` | ✅ miembro | Reto 2026 picos secundarios FDMESCYL |
| `Estadisticas.razor` | `/estadisticas` | ✅ miembro | Métricas y estadísticas del grupo |
| `HallOfFame.razor` | `/hall-of-fame` | — | Reconocimientos especiales |
| `AcercaDe.razor` | `/acerca-de` | — | Versión, changelog |
| `MiArea.razor` | `/mi-area` | ✅ miembro | Perfil: gestión de propuestas y sitios gastro propios |
| `Participante.razor` | `/participante` | — | Perfil público de un participante |
| `Album.razor` | `/album?id=XX` | — | Galería fotos de ruta (desactivada, SPA route comentada) |
| `Admin/AdminPanel.razor` | `/admin` | 👑 admin | Panel rutas, usuarios, cumbres, migración · pestaña "Zonas": asignación masiva + catálogo solo lectura (lazy) con bounds y `RutasPorZonaCount` · columna Zona con select inline (`CambiarZonaRuta`) |
| `Admin/RutaForm.razor` | — (componente) | 👑 admin | Formulario crear/editar ruta · auto-detecta zona al seleccionar GPX (centroide → `zonas-montana.json`) |
_NavMenu: "Reto 2026" renombrado a "Reto"; "Acerca de" solo icono en desktop (lg+); enlace /zonas añadido._
_MainLayout: carga `version.json` en `OnInitializedAsync` y muestra `v{version}` en el footer._
| `Admin/Usuarios.razor` | `/admin/usuarios` | 👑 admin | Gestión miembros, invitaciones, solicitudes |
| `Admin/Avatares.razor` | `/admin/avatares` | 👑 admin | Vista de avatares de todos los miembros |
| `Admin/AvatarLab.razor` | `/admin/avatar-lab` | 👑 admin | Editor visual avatares DiceBear Adventurer |

## Componentes
- `RouteCard` → tarjeta resumen de ruta (nombre, fecha, participantes, dificultad)
- `LoginButton` → botón Google Sign-In reutilizable
- `LoadingSpinner` → spinner centrado genérico

## DI (Program.cs)
| Servicio | Lifetime |
|----------|----------|
| `HttpClient` | Scoped |
| `FirestoreService` | Scoped |
| `AuthService` | Scoped |
| `StorageService` | Scoped |
| `LeafletService` | Scoped |
| `RutasSecundariasService` | Scoped |
| `MapsService` | Scoped |

## Firebase
- **Project**: `mesetainclinada`
- **Servicios**: Auth · Firestore (europe-southwest1) · Storage · Hosting · Functions
- **firestore.rules**: ✅ restrictivas — usan `request.auth`, roles admin/miembro, subcollección `resenas` protegida por uid
- **storage.rules**: ✅ restrictivas — lectura pública en `/gpx/`, escritura solo admin
- **SPA rewrite**: sí (`** → /index.html`)

## Scripts de utilidad
- `sync-gpx.ps1` — compara GPX locales vs Firebase Storage
- `sync-zonas.ps1` — detecta zona geográfica de cada GPX por centroide; genera CSV/JSON de sugerencias para asignar el campo `zona` en Firestore. Uso: `.\sync-zonas.ps1 [-Sample 5] [-OutputFormat json]`

## Notas del proyecto
- **Detección GPX local**: Firebase Hosting devuelve 200+HTML para rutas inexistentes; el código detecta por `Content-Type != text/html`, no por status code.
- **Métricas GPX**: se calculan en JS (leaflet-interop) al cargar el mapa y se persisten en Firestore solo la primera vez; botón "Recalcular" (solo admin) para forzar.
- **Roles**: en colección `roles/{uid}` (no en `miembros/`). Miembro sin rol → solicitud en `solicitudes/` + auto-logout.
- **Álbum**: la página `/album` está desactivada (la directiva `@page` está comentada). Las fotos se sirven estáticamente desde `fotos/{albumId}/{albumId} (N).jpg`.
- **Avatares**: URL DiceBear Adventurer SVG guardada en Firestore; `AvatarConfig.UrlODefault` devuelve una URL por defecto basada en el seed si no hay personalización.
- **Deploy**: `dotnet publish` + `firebase deploy --only hosting`. Bumpar `wwwroot/data/version.json` antes de cada release. Versión actual: **2.1.0** (2026-07-01).
