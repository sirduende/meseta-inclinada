# Mapa del Grupo de Montaña (Leaflet + GitHub Pages)

Este proyecto es un *starter* gratuito para publicar un mapa con rutas (GPX), participantes y filtros.

## 🚀 Cómo usar

1) **Descarga este ZIP** y descomprímelo.
2) Para verlo en local, evita abrir `index.html` directamente. Sirve los archivos por HTTP:
   - Con Python (opcional): `python -m http.server 8000` y abre `http://localhost:8000`
   - O usa la extensión *Live Server* de VS Code.
3) Abre `index.html` y comprueba que se cargan las dos rutas de demo.

## 🌐 Publicar en GitHub Pages (gratis)

1. Crea un repositorio en GitHub (por ejemplo, `grupo-montana-mapa`).
2. Sube **todo** el contenido de esta carpeta (incluida `gpx/` y `data.json`).
3. En *Settings → Pages*, selecciona:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (carpeta `/root`)
4. Guarda. En unos minutos tendrás una URL del tipo: `https://TU_USUARIO.github.io/grupo-montana-mapa/`

## ➕ Añadir una ruta nueva

1. Copia tu archivo GPX dentro de la carpeta `gpx/` (por ejemplo `pena_ubiña.gpx`).
2. Edita `data.json` y añade un nuevo objeto con tus metadatos:

```json
{
  "id": "pena_ubina",
  "nombre": "Peña Ubiña",
  "archivo": "pena_ubina.gpx",
  "participantes": ["Daniel", "Laura"],
  "fecha": "2025-08-10",
  "descripcion": "Ruta espectacular por Babia."
}
```

3. Guarda los cambios y sube al repositorio. Se mostrará automáticamente.

## 🔎 Filtros

- Puedes marcar varias personas a la vez; se muestran las rutas en las que participe **alguna** de las seleccionadas.
- Botón **Quitar filtros**: vuelve a mostrar todas.

## 🧩 Estructura

```
/
├─ index.html      # Mapa, UI y lógica de filtros
├─ data.json       # Metadatos de rutas (archivo, nombre, participantes, etc.)
└─ gpx/            # Ficheros GPX de las rutas
```

## 🛠️ Ajustes útiles

- Cambia el *zoom inicial* o el *estilo* de las polilíneas en `index.html`.
- Colores de rutas: ver función `colorForIndex`.
- ¿Waypoints/POIs? Añádelos a tu GPX y Leaflet.GPX los mostrará.

## ❗ Problemas frecuentes

- **No carga `data.json` o GPX en local**: usa un servidor HTTP (ver arriba). Abrir el archivo localmente bloquea `fetch()` por seguridad del navegador.
- **No se ven iconos**: con el CDN incluido de Leaflet y Leaflet.GPX debería funcionar. Si personalizas, asegúrate de que las rutas de iconos sean públicas.

¡Listo! Disfruta del panel y mantenlo gratuito con GitHub Pages.
