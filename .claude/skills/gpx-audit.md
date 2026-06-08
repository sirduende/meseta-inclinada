# Skill: gpx-audit

Audita y gestiona los archivos GPX del proyecto Meseta Inclinada.
Invócala con `/gpx-audit` desde la raíz del proyecto.

## Instrucciones

Ejecuta los siguientes pasos en orden.

---

### Paso 1 — Escanear archivos GPX locales

```powershell
$base = "ParquesolSoftware.MesetaInclinada\wwwroot"
$gpxOld     = if (Test-Path "$base\gpx")       { Get-ChildItem "$base\gpx"       -Filter "*.gpx" | ForEach-Object { $_.Name } } else { @() }
$gpx2026    = if (Test-Path "$base\gpx2026")   { Get-ChildItem "$base\gpx2026"   -Filter "*.gpx" | ForEach-Object { $_.Name } } else { @() }
$gpxStaging = if (Test-Path "$base\gpx-nuevos"){ Get-ChildItem "$base\gpx-nuevos" -Filter "*.gpx" | Select-Object -ExpandProperty Name } else { @() }

$todosLocales = @($gpxOld) + @($gpx2026)
Write-Host "gpx/:      $($gpxOld.Count)"
Write-Host "gpx2026/:  $($gpx2026.Count)"
Write-Host "staging:   $($gpxStaging.Count)"
```

---

### Paso 2 — Obtener archivos referenciados en Firestore (rutas realizadas)

Usa Node.js para consultar la REST API de Firestore y extraer el campo `archivo` de cada ruta:

```bash
node -e "
const https = require('https');
const PROJECT = 'mesetainclinada';
const url = 'https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/rutas?pageSize=100';
https.get(url, res => {
  let d = '';
  res.on('data', x => d += x);
  res.on('end', () => {
    const json = JSON.parse(d);
    const docs = json.documents || [];
    const archivos = docs
      .map(doc => doc.fields?.archivo?.stringValue)
      .filter(Boolean)
      .sort();
    archivos.forEach(a => console.log(a));
  });
});
"
```

Guarda la lista resultante como `$archivosFirestore`.

---

### Paso 3 — Leer referencias del JSON de propuestas

```powershell
$jsonPath = "ParquesolSoftware.MesetaInclinada\wwwroot\data\rutas-secundarias.json"
$json = Get-Content $jsonPath -Raw | ConvertFrom-Json
$archivosJson = $json | ForEach-Object { $_.archivoGPX } | Where-Object { $_ } |
    ForEach-Object { $_.Split('/')[-1] }   # quitar prefijo gpx2026/
```

---

### Paso 4 — Cruzar datos

Combina las dos listas de referencias (`$archivosFirestore` + `$archivosJson`) y compara contra `$todosLocales`:

- **✓ OK** — referenciados y presentes localmente
- **⚠ Solo en Storage** — referenciados pero NO locales → hay que descargarlos
- **? Huérfanos** — locales no referenciados en ninguna fuente

---

### Paso 5 — Mostrar informe

```
## Auditoría GPX — Meseta Inclinada

### Resumen
- GPX locales en gpx/          : [N]
- GPX locales en gpx2026/      : [N]
- GPX en staging (gpx-nuevos/) : [N]
- Referencias en Firestore      : [N]
- Referencias en JSON propuestas: [N]

---

### ✓ OK — Presentes localmente ([N])

### ⚠ Solo en Firebase Storage — Faltan en local ([N])
[lista — estos hay que descargar]

### ? Posibles huérfanos — Locales sin referencia ([N])
[lista]
```

---

### Paso 6 — Descargar los que faltan

Si hay archivos en "Solo en Storage", descargarlos automáticamente a `wwwroot/gpx/` usando Node y la REST API de Firebase Storage (no requiere auth, los tokens están en la metadata pública del objeto):

```bash
BUCKET="mesetainclinada.firebasestorage.app"
LOCAL_DIR="ParquesolSoftware.MesetaInclinada/wwwroot/gpx"

for f in <lista_de_faltantes>; do
  ENCODED=$(node -e "console.log(encodeURIComponent('gpx/$f'))")
  META=$(curl -s "https://firebasestorage.googleapis.com/v0/b/$BUCKET/o/$ENCODED")
  TOKEN=$(echo "$META" | node -e "
    let d='';
    process.stdin.on('data', x => d += x);
    process.stdin.on('end', () => {
      try {
        const j = JSON.parse(d);
        const t = j.downloadTokens;
        console.log(t ? t.split(',')[0] : '');
      } catch(e) { console.log(''); }
    });
  ")

  if [ -n "$TOKEN" ]; then
    URL="https://firebasestorage.googleapis.com/v0/b/$BUCKET/o/$ENCODED?alt=media&token=$TOKEN"
    HTTP=$(curl -s -o "$LOCAL_DIR/$f" -w "%{http_code}" "$URL")
    [ "$HTTP" = "200" ] && echo "✓ $f" || echo "✗ $f (HTTP $HTTP)"
  else
    echo "✗ $f (sin token — archivo puede no existir en Storage)"
  fi
done
```

Tras descargar, confirma el número de archivos nuevos en `wwwroot/gpx/`.

---

### Paso 7 — Mover staging (si existe gpx-nuevos/)

Si `$gpxStaging` tiene archivos, preguntar confirmación y moverlos a `gpx2026/` para propuestas o a `gpx/` para rutas realizadas según indique el usuario:

```powershell
Move-Item "ParquesolSoftware.MesetaInclinada\wwwroot\gpx-nuevos\*.gpx" `
          "ParquesolSoftware.MesetaInclinada\wwwroot\gpx\"
```

Recordar actualizar `rutas-secundarias.json` o Firestore según corresponda.

---

### Paso 8 — Recordatorio de deploy

Si se descargaron o movieron archivos:

> "Recuerda hacer `dotnet publish` para incluir los nuevos GPX en el bundle de despliegue."

---

## Contexto de referencia

| Carpeta | Contenido |
|---------|-----------|
| `wwwroot/gpx/` | Rutas **realizadas** 2025 y 2026 (las del mapa principal) |
| `wwwroot/gpx2026/` | **Propuestas** del reto 2026 (rutas secundarias) |
| `wwwroot/gpx-nuevos/` | Staging opcional — crear manualmente antes de un deploy |

- `getGPXUrl(nombre)` en `firebase-interop.js` prueba `gpx/` → `gpx2026/` → Firebase Storage.
- Las rutas subidas vía AdminPanel van solo a Storage — este skill las detecta y descarga.
- Firestore: colección `rutas` con campo `archivo` = nombre del fichero GPX.
- Propuestas: `wwwroot/data/rutas-secundarias.json` con campo `archivoGPX` = `gpx2026/nombre.gpx`.
- La descarga usa los `downloadTokens` de la metadata pública de Firebase Storage (no requiere autenticación).
