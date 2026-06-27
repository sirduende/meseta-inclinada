# Especificaciones funcionales — Meseta Inclinada

Documento de referencia para desarrollo futuro. Describe el comportamiento esperado de cada sección de la aplicación.

---

## 1. Rutas (`/rutas`)

**Acceso:** público

**Funcionalidad:**
- Mapa interactivo (Leaflet) con todos los tracks GPX del grupo
- Sidebar izquierdo con listado de rutas, filtrable por año (2025 / 2026 / Todas)
- Cada tarjeta muestra: fecha, nombre, participantes (iconos), nivel, distancia (km), desnivel (m)
- Al hacer clic en una tarjeta → zoom a esa ruta en el mapa
- Popup del mapa: nombre, fecha, participantes, estadísticas, enlace GPX, enlace Relive si existe
- Marcador numerado en el punto de inicio de cada ruta

**Métricas (calculadas automáticamente):**
- Se calculan desde el GPX al cargarse el mapa (JS)
- Se persisten en Firestore la primera vez (solo si el usuario es admin)
- Trigger: `DistanciaKm == 0 || DuracionS == 0` en la ruta original
- Fallback tiempo: `(km / 4.5) * 3600` si el GPX no tiene timestamps
- **Botón "Recalcular"** (solo admin): resetea métricas a 0 y recarga para forzar recálculo

**GPX lookup (en orden):**
1. `/gpx/{archivo}` (estático local 2025)
2. `/gpx2026/{archivo}` (estático local 2026)
3. Firebase Storage `gpx/{archivo}` (signed URL)
- Detección de archivo real: si respuesta tiene `Content-Type: text/html` → no existe en local → usar Storage

---

## 2. Propuestas (`/propuestas`)

**Acceso:** público

**Capas del mapa (checkboxes):**
- 🗺️ Fuera de reto — propuestas libres (ON por defecto)
- 🏔️ Propuestas reto — cumbres del reto FDMESCYL (OFF)
- 🟢 Rutas realizadas 2026 — GPX en verde (OFF, carga diferida)
- 🔵 Cumbres FDMESCYL — radares de 8 km (OFF)
- 🍽️ Gastro — marcadores de sitios gastronómicos (OFF)

**Popup gastro en mapa:**
- Nombre del sitio
- Dirección
- Valoración media (estrellas ★/☆) + número de reseñas
- Último comentario de la comunidad
- Enlace a Google Maps

**Desde `/secundarios?desde=reto`:** activa capas Reto + Verde + Cumbres automáticamente

---

## 3. Gastronomía (`/gastronomia`)

**Acceso:** público para ver; login requerido para valorar

### Vista pública (sin login)

- Listado de todos los sitios gastronómicos en cards
- Cada card muestra:
  - Nombre del sitio (enlace a Google Maps)
  - Dirección
  - Valoración media (★★★★☆ + número de reseñas)
  - Último comentario de la comunidad (en itálica)
  - Autor del último comentario
- Footer: "Inicia sesión para valorar y comentar"

### Vista autenticada (miembro o admin)

Todo lo anterior más, en cada card:

**Si el usuario NO tiene reseña:**
- Selector de estrellas (1-5, clickable)
- Textarea de comentario (opcional)
- Botón "Guardar" (deshabilitado hasta seleccionar ≥1 estrella)

**Si el usuario YA tiene reseña:**
- Muestra su valoración (estrellas) y comentario
- Fecha de la reseña
- Botón "Editar" → vuelve al formulario pre-rellenado
- Botón "Eliminar" → elimina reseña con confirmación visual (spinner)

### Reglas de negocio

- Un usuario puede tener como máximo **una reseña por sitio** (doc id = uid)
- Editar sobreescribe la reseña existente
- Al guardar o eliminar → se recalculan los **agregados** en el documento padre:
  - `valoracionMedia`: media de todas las estrellas (redondeada a 1 decimal)
  - `numResenas`: número total de reseñas
  - `ultimoComentario`: comentario más reciente (por fecha)
  - `ultimoAutor`: nombre del autor del último comentario
- Estos agregados se usan en el popup del mapa de propuestas

### Estructura Firestore

```
gastro/{sitioId}
  nombre: string
  placeId: string         ← Google Place ID (preferente para enlace Maps)
  lat: number
  lng: number
  direccion: string
  comentario: string      ← comentario inicial del admin al añadir el sitio
  creadoPor: string       ← uid del admin
  nombreCreador: string
  fechaCreacion: string   ← YYYY-MM-DD
  valoracionMedia: number ← agregado calculado
  numResenas: number      ← agregado calculado
  ultimoComentario: string ← agregado calculado
  ultimoAutor: string     ← agregado calculado

gastro/{sitioId}/resenas/{uid}
  sitioId: string
  uid: string
  nombreUsuario: string
  estrellas: number       ← 1-5
  comentario: string
  fecha: string           ← YYYY-MM-DD
```

---

## 4. Reto 2026 — Picos Secundarios (`/secundarios`)

**Acceso:** miembro o admin

- Tabla de cumbres secundarias de Castilla y León
- Cada cumbre: nombre, sierra, dificultad, metros, cubierta (checkbox admin)
- Filtros: sierra, dificultad, estado (cubierta/pendiente)
- Botón "Ver en mapa" → navega a `/propuestas?desde=reto`
- Admins pueden marcar cumbres como cubiertas

---

## 5. Estadísticas (`/estadisticas`)

**Acceso:** miembro o admin

- Resumen anual: total km, desnivel, rutas, participaciones
- Tabla mensual: km y desnivel acumulados por mes
- Tabla por participante: km, desnivel, número de rutas
- Filtro por año (2025 / 2026 / Todas)

---

## 6. Autenticación y roles

**Flujo de login:**
1. Usuario hace clic en "Acceder" → Google Sign-In popup
2. Si tiene rol `admin` o `miembro` en `roles/{uid}` → sesión activa
3. Si tiene invitación en `invitaciones/{email}` → auto-aprobado como miembro
4. Sin rol ni invitación → solicitud guardada en `solicitudes/{uid}` → logout automático

**Roles:**
- `admin`: acceso completo (panel admin, marcar cumbres, subir rutas, añadir sitios gastro)
- `miembro`: acceso a estadísticas, reto, mi área, reseñas gastro

**Gestión (admin):**
- Panel admin (`/admin`): añadir/editar/eliminar rutas, gestionar usuarios, laboratorio de avatares
- Invitaciones: admin invita por email, usuario se auto-aprueba al hacer login

---

## 7. Hall of Fame (`/hall-of-fame`)

**Acceso:** público

Página estática con reconocimientos a miembros destacados del grupo. Contenido editado manualmente en el `.razor`.

---

## 8. Acerca de (`/acerca-de`)

**Acceso:** público

- Versión actual (leída desde `/data/version.json`)
- Fecha de build
- Historial de versiones (changelog manual en el `.razor`)
- Botón "Limpiar caché" (hard reload)

**Bumpar versión en cada release:**
```json
// wwwroot/data/version.json
{
  "version": "2.0.1",
  "buildDate": "2026-06-21T00:00:00Z",
  "appName": "Meseta Inclinada",
  "description": "Migración a Blazor WebAssembly"
}
```

---

## 9. SEO

Ver guía completa en `parquesol-skills/stack/seo-blazor-wasm.md`.

Resumen implementado:
- Pre-render en `<div id="app">` con nav + h1 + texto + links para crawlers
- Spinner movido a esquina inferior derecha (no tapa contenido pre-renderizado)
- `<HeadContent>` con `canonical` + `description` específicos en cada página
- NO canonical hardcodeado en `index.html` (Firebase sirve el mismo HTML para todas las rutas)
- JSON-LD `SportsClub` en `index.html`
- Twitter Card + Open Graph en `index.html`
- `<noscript>` fallback
- `sitemap.xml` con `<lastmod>`
- Verificación Google Search Console via archivo HTML (`googlee9f1da7f5ea8809d.html`)
- `Content-Type: text/html; charset=utf-8` explícito en `firebase.json`

---

## 10. Patrones de implementación recurrentes

### Añadir una nueva página

1. Crear `Pages/NombrePagina.razor` con `@page "/ruta"`
2. Añadir `<HeadContent>` con canonical y description
3. Añadir enlace en `Layout/NavMenu.razor`
4. Si usa datos de Firestore: añadir método en `FirestoreService.cs` + función en `firebase-interop.js`
5. Actualizar `wwwroot/sitemap.xml`
6. Escribir tests de componente y/o servicio

### Añadir datos a Firestore

1. Crear/actualizar modelo en `Models/`
2. Añadir función JS en `firebase-interop.js` (patrón `{ success, data, error }`)
3. Añadir método C# en `FirestoreService.cs` (con try/catch y log)
4. Escribir tests con `Mock<IJSRuntime>`

### Actualizar el mapa de propuestas con nueva capa

1. Añadir checkbox en sidebar de `Propuestas.razor`
2. Añadir estado `mostrarXxx` y handler `OnXxxChanged`
3. Añadir función JS en `leaflet-interop.js` para cargar/toggle la capa
4. Añadir método C# en `LeafletService.cs`
