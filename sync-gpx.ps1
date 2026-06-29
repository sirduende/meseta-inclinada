# sync-gpx.ps1 — Compara GPX locales con Firebase Storage
#
# Requiere: gcloud CLI autenticado (gcloud auth login)
#
# Uso:
#   .\sync-gpx.ps1              # solo muestra diferencias
#   .\sync-gpx.ps1 -Upload      # sube a Storage los que faltan alli
#   .\sync-gpx.ps1 -Download    # descarga de Storage los que faltan en local

param(
    [switch]$Upload,
    [switch]$Download
)

$BUCKET = "gs://mesetainclinada.firebasestorage.app/gpx/"

# Archivos locales (gpx + gpx2026)
$localDirs = @(
    "ParquesolSoftware.MesetaInclinada\wwwroot\gpx",
    "ParquesolSoftware.MesetaInclinada\wwwroot\gpx2026"
)

$localFiles = @{}
foreach ($dir in $localDirs) {
    if (Test-Path $dir) {
        Get-ChildItem $dir -Filter "*.gpx" | ForEach-Object {
            $localFiles[$_.Name] = $_.FullName
        }
    }
}

# Archivos en Storage
Write-Host ""
Write-Host "  Consultando Firebase Storage..." -ForegroundColor Gray

$storageRaw   = gcloud storage ls $BUCKET 2>&1
$storageFiles = $storageRaw |
    Where-Object { $_ -match "\.gpx$" } |
    ForEach-Object { ($_ -split "/")[-1].Trim() }

# Diferencias
$soloEnLocal   = $localFiles.Keys | Where-Object { $_ -notin $storageFiles } | Sort-Object
$soloEnStorage = $storageFiles    | Where-Object { $_ -notin $localFiles.Keys } | Sort-Object
$enAmbos       = $localFiles.Keys | Where-Object { $_ -in  $storageFiles } | Sort-Object

Write-Host ""
Write-Host "  En ambos lados ($($enAmbos.Count)):" -ForegroundColor Green
$enAmbos | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkGray }

if ($soloEnLocal.Count -gt 0) {
    Write-Host ""
    Write-Host "  Solo en local, no subidos ($($soloEnLocal.Count)):" -ForegroundColor Yellow
    $soloEnLocal | ForEach-Object { Write-Host "     $_" -ForegroundColor Yellow }
}

if ($soloEnStorage.Count -gt 0) {
    Write-Host ""
    Write-Host "  Solo en Storage, no descargados ($($soloEnStorage.Count)):" -ForegroundColor Magenta
    $soloEnStorage | ForEach-Object { Write-Host "     $_" -ForegroundColor Magenta }
}

Write-Host ""
Write-Host "  Local: $($localFiles.Count)  |  Storage: $($storageFiles.Count)  |  Solo local: $($soloEnLocal.Count)  |  Solo Storage: $($soloEnStorage.Count)" -ForegroundColor Cyan

# Subir los que faltan en Storage
if ($Upload -and $soloEnLocal.Count -gt 0) {
    Write-Host ""
    Write-Host "  Subiendo $($soloEnLocal.Count) archivo(s) a Storage..." -ForegroundColor Cyan
    foreach ($name in $soloEnLocal) {
        Write-Host "  -> $name" -ForegroundColor White
        gcloud storage cp $localFiles[$name] "${BUCKET}${name}"
    }
    Write-Host "  Subida completada." -ForegroundColor Green
}

# Descargar los que faltan en local
if ($Download -and $soloEnStorage.Count -gt 0) {
    Write-Host ""
    Write-Host "  Descargando $($soloEnStorage.Count) archivo(s) de Storage..." -ForegroundColor Cyan
    $destDir = "ParquesolSoftware.MesetaInclinada\wwwroot\gpx"
    foreach ($name in $soloEnStorage) {
        Write-Host "  -> $name" -ForegroundColor White
        gcloud storage cp "${BUCKET}${name}" "$destDir\$name"
    }
    Write-Host "  Descarga completada." -ForegroundColor Green
}

Write-Host ""