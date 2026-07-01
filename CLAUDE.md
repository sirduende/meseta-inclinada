# Meseta Inclinada — Guía para Claude

Aplicación web del grupo de montaña Meseta Inclinada (Valladolid). Stack: **Blazor WebAssembly .NET 10 + Firebase**.

## Mapa del código
Lee [`codebase-map.md`](codebase-map.md) al inicio de cada sesión para entender la estructura del proyecto sin explorar ficheros. Actualizar con `/map-codebase`.

## Repositorio de conocimiento compartido

Antes de implementar cualquier patrón nuevo, consultar [`C:/Proyectos/parquesol-skills`](../parquesol-skills) (GitHub: `sirduende/parquesol-skills`). Contiene patrones probados para todo el stack. **Al aprender algo nuevo aplicable a otros proyectos, añadirlo ahí y hacer push al final de la sesión.**

Índice del skills repo:
- `stack/blazor-firebase-patterns.md` — Lazy init, JSInterop, auth con roles
- `stack/firebase-hosting.md` — SPA routing, headers Content-Type, deploy
- `stack/seo-blazor-wasm.md` — Pre-render, HeadContent, JSON-LD, Search Console
- `stack/blazor-theming.md` — CSS variables, layout, componentes UI
- `stack/testing-patterns.md` — xUnit, bUnit, FluentAssertions, mocks

## Estructura del proyecto

```
ParquesolSoftware.MesetaInclinada/
├── Layout/          — MainLayout, MapLayout, NavMenu
├── Pages/           — Páginas públicas y de admin (ver tabla abajo)
│   └── Admin/       — Panel admin, RutaForm, Usuarios, Avatares
├── Components/      — RouteCard, LoadingSpinner (reutilizables)
├── Services/        — FirestoreService, AuthService, LeafletService, StorageService, ...
├── Models/          — Ruta, RutaEnriquecida, SitioGastro, ResenaGastro, ...
└── wwwroot/
    ├── css/app.css
    ├── data/version.json    ← BUMPAR en cada release
    ├── gpx/                 ← GPX rutas 2025 (estático)
    ├── gpx2026/             ← GPX rutas 2026 (estático)
    ├── js/
    │   ├── firebase-interop.js   ← toda la lógica Firebase (Auth/Firestore/Storage)
    │   └── leaflet-interop.js    ← mapa Leaflet + GPX + marcadores gastro
    └── sitemap.xml

ParquesolSoftware.MesetaInclinada.Tests/
├── Components/   — Tests bUnit de componentes Razor
├── Models/       — Tests de modelos (GastroModelTests, ...)
└── Services/     — Tests de servicios con JSInterop mockeado
```

## Páginas y rutas

| Página | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| Home | `/` | No | Presentación del grupo |
| Rutas | `/rutas` | No | Mapa interactivo con tracks GPX |
| Propuestas | `/propuestas` | No | Mapa de propuestas y filtro gastro |
| Secundarios | `/secundarios` | Sí | Reto 2026 picos secundarios |
| Estadísticas | `/estadisticas` | Sí | Métricas del grupo |
| Gastronomia | `/gastronomia` | No* | Lista de sitios gastro con reseñas (*login para valorar) |
| Hall of Fame | `/hall-of-fame` | No | Reconocimientos especiales |
| Acerca de | `/acerca-de` | No | Versión y changelog |
| Mi Área | `/mi-area` | Sí | Perfil del usuario |
| Admin | `/admin` | Admin | Panel de gestión |

## Colecciones Firestore

| Colección | Propósito |
|-----------|-----------|
| `rutas/{id}` | Tracks GPX con métricas calculadas |
| `gastro/{id}` | Sitios gastronómicos con agregados de valoración |
| `gastro/{id}/resenas/{uid}` | Reseñas (una por usuario por sitio) |
| `propuestas/{id}` | Rutas propuestas por el grupo |
| `cumbres/{id}` | Cumbres FDMESCYL del reto 2026 |
| `roles/{uid}` | Roles de usuario (admin / miembro) |
| `miembros/{uid}` | Perfil de miembros |
| `solicitudes/{uid}` | Solicitudes de acceso pendientes |
| `invitaciones/{email}` | Invitaciones de acceso por email |

## Autenticación

- Login con Google via Firebase Auth
- Roles en `roles/{uid}`: `{ admin: bool, miembro: bool, nombreMostrado: string }`
- `AuthService.IsAdmin` / `AuthService.IsMember` / `AuthService.IsAuthenticated`
- Usuario sin rol → solicitud guardada en `solicitudes/` y se desloguea automáticamente

## GPX y métricas

- Los GPX se buscan primero en `/gpx/` o `/gpx2026/` (estático); si no existen, caen a Firebase Storage (`gpx/` bucket)
- **Importante**: Firebase Hosting reescribe rutas inexistentes a `index.html` (200 OK con HTML). La detección local verifica `Content-Type != text/html`
- Las métricas (distanciaKm, desnivelM, duracionS) se calculan en JS al cargar el GPX y se persisten en Firestore la primera vez que un admin carga el mapa
- Botón "Recalcular" en sidebar (solo admin) para forzar recálculo

## Deploy

```powershell
dotnet publish ParquesolSoftware.MesetaInclinada/ParquesolSoftware.MesetaInclinada.csproj -c Release -o publish_output
firebase deploy --only hosting
```

Antes de hacer publish: **actualizar `version.json`** si hay cambios de usuario.

## Tests

```powershell
dotnet test ParquesolSoftware.MesetaInclinada.Tests
```

Patrones: xUnit + bUnit (componentes) + Moq (JSRuntime) + FluentAssertions. Ver `parquesol-skills/stack/testing-patterns.md`.

## Límite de tokens — Avisos obligatorios

⚠️ Avisar ANTES de:
- Leer/modificar más de 10 archivos simultáneamente
- Refactors que toquen más de 5 archivos
- Ejecutar suite de tests completa en contextos muy largos
- Migración de datos en Firestore

## Convenciones

- Servicios: `XxxService.cs` en `Services/`, registrados como `Scoped` en `Program.cs`
- Modelos: `Models/`, con `[JsonPropertyName]` para coincidencia con campos Firestore
- Páginas: `Pages/`, nombres en español (ej. `Gastronomia.razor`)
- JS: namespace `firebaseInterop.*` para Firebase, `leafletInterop.*` para el mapa
- Tests: un archivo por servicio/componente, sufijo `Tests.cs`
- SEO: `<HeadContent>` con canonical + description en cada página

## Especificaciones funcionales

Ver [`docs/especificaciones.md`](docs/especificaciones.md) para el detalle de cada funcionalidad.

## Comandos Claude Code

- `/release` — Proceso completo de release: obtiene versión de producción, calcula la nueva versión (PATCH o MINOR según reglas del mes), actualiza los 4 ficheros de versión, hace commit/push, crea tag git y despliega a Firebase Hosting. **Sugerirlo cuando el usuario mencione "subir a producción", "release", "nueva versión", "desplegar" o "publicar".**
- `/map-codebase` — Regenera `codebase-map.md` con el índice compacto del proyecto.
- `/security-audit` — Auditoría de seguridad Firebase + Blazor WASM (reglas, claves, guards de auth, headers).
