<#
.SYNOPSIS
    Detecta la zona geográfica de cada ruta analizando el centroide de su GPX.

.DESCRIPTION
    Lee los archivos GPX locales, calcula el centroide (media lat/lng de los trackpoints)
    y lo compara contra la base de datos de zonas en wwwroot/data/zonas-montana.json.
    Genera un CSV/JSON de sugerencias para revisión antes de aplicar a Firestore.

.PARAMETER Sample
    Si se especifica, procesa solo N archivos aleatorios (útil para validar).

.PARAMETER GpxDir
    Carpeta raíz donde buscar GPX. Por defecto busca en wwwroot/gpx y wwwroot/gpx2026.

.PARAMETER OutputFormat
    Formato de salida: "csv" (defecto) o "json".

.EXAMPLE
    .\sync-zonas.ps1 -Sample 5
    .\sync-zonas.ps1 -OutputFormat json
#>

param(
    [int]$Sample = 0,
    [string]$GpxDir = "",
    [ValidateSet("csv","json")]
    [string]$OutputFormat = "csv"
)

$ErrorActionPreference = "Stop"

# ── Rutas base ────────────────────────────────────────────────────────────────

$scriptDir = $PSScriptRoot
$zonaDbPath = Join-Path $scriptDir "ParquesolSoftware.MesetaInclinada\wwwroot\data\zonas-montana.json"

if (-not (Test-Path $zonaDbPath)) {
    Write-Error "No se encuentra $zonaDbPath. Ejecuta el script desde la raiz del repositorio."
    exit 1
}

# Carpetas GPX
if ($GpxDir -ne "") {
    $gpxDirs = @($GpxDir)
} else {
    $gpxDirs = @(
        (Join-Path $scriptDir "ParquesolSoftware.MesetaInclinada\wwwroot\gpx"),
        (Join-Path $scriptDir "ParquesolSoftware.MesetaInclinada\wwwroot\gpx2026")
    )
}

# ── Cargar base de datos de zonas ─────────────────────────────────────────────

$zonas = Get-Content $zonaDbPath -Encoding UTF8 | ConvertFrom-Json
Write-Host "Zonas cargadas: $($zonas.Count)" -ForegroundColor Cyan

# ── Recopilar archivos GPX ────────────────────────────────────────────────────

$gpxFiles = @()
foreach ($dir in $gpxDirs) {
    if (Test-Path $dir) {
        $gpxFiles += Get-ChildItem -Path $dir -Filter "*.gpx" -File
    }
}

if ($gpxFiles.Count -eq 0) {
    Write-Warning "No se encontraron archivos GPX en las carpetas configuradas."
    exit 0
}

if ($Sample -gt 0) {
    $gpxFiles = $gpxFiles | Get-Random -Count ([Math]::Min($Sample, $gpxFiles.Count))
    Write-Host "Modo muestra: procesando $($gpxFiles.Count) archivos aleatorios." -ForegroundColor Yellow
} else {
    Write-Host "Procesando $($gpxFiles.Count) archivos GPX." -ForegroundColor Cyan
}

# ── Funciones ─────────────────────────────────────────────────────────────────

function Get-Centroid {
    param([string]$GpxPath)

    [xml]$gpx = Get-Content $GpxPath -Encoding UTF8

    # Intentar con namespace GPX 1.1
    $nsm = New-Object System.Xml.XmlNamespaceManager($gpx.NameTable)
    $nsm.AddNamespace("g", "http://www.topografix.com/GPX/1/1")
    $trkpts = $gpx.SelectNodes("//g:trkpt", $nsm)

    # Si no hay nada (GPX sin namespace o versión 1.0), buscar sin namespace
    if ($trkpts.Count -eq 0) {
        $trkpts = $gpx.GetElementsByTagName("trkpt")
    }

    if ($trkpts.Count -eq 0) {
        return $null
    }

    $sumLat = 0.0
    $sumLng = 0.0
    foreach ($pt in $trkpts) {
        $sumLat += [double]$pt.GetAttribute("lat")
        $sumLng += [double]$pt.GetAttribute("lon")
    }

    return [PSCustomObject]@{
        Lat   = [Math]::Round($sumLat / $trkpts.Count, 5)
        Lng   = [Math]::Round($sumLng / $trkpts.Count, 5)
        Count = $trkpts.Count
    }
}

function Find-Zona {
    param([double]$Lat, [double]$Lng)

    $candidatas = @()
    foreach ($z in $zonas) {
        if ($null -eq $z.bounds) { continue }
        $b = $z.bounds
        if ($Lat -ge $b.latMin -and $Lat -le $b.latMax -and $Lng -ge $b.lngMin -and $Lng -le $b.lngMax) {
            $area = ($b.latMax - $b.latMin) * ($b.lngMax - $b.lngMin)
            $candidatas += [PSCustomObject]@{ Id = $z.id; Nombre = $z.nombre; Area = $area }
        }
    }

    if ($candidatas.Count -eq 0) {
        return [PSCustomObject]@{ Id = "otras-zonas"; Nombre = "Otras zonas" }
    }

    # Zona más específica = menor área
    return ($candidatas | Sort-Object Area | Select-Object -First 1)
}

# ── Procesar GPX ──────────────────────────────────────────────────────────────

$resultados = @()

foreach ($file in $gpxFiles) {
    Write-Host "  $($file.Name)..." -NoNewline

    $centroide = $null
    $ok = $false

    try {
        $centroide = Get-Centroid -GpxPath $file.FullName
        $ok = $true
    } catch {
        Write-Host " ERROR: $_" -ForegroundColor Red
    }

    if ($ok) {
        if ($null -eq $centroide) {
            Write-Host " sin trackpoints" -ForegroundColor Yellow
        } else {
            $zona = Find-Zona -Lat $centroide.Lat -Lng $centroide.Lng
            Write-Host " ($($centroide.Lat), $($centroide.Lng)) -> $($zona.Nombre)" -ForegroundColor Green

            $resultados += [PSCustomObject]@{
                Archivo       = $file.Name
                CentroidLat   = $centroide.Lat
                CentroidLng   = $centroide.Lng
                Trackpoints   = $centroide.Count
                ZonaDetectada = $zona.Nombre
                ZonaId        = $zona.Id
            }
        }
    }
}

# ── Exportar resultados ───────────────────────────────────────────────────────

$sufijo = if ($Sample -gt 0) { "-muestra" } else { "" }
$outputFile = Join-Path $scriptDir "zonas-detectadas$sufijo.$OutputFormat"

if ($OutputFormat -eq "json") {
    $resultados | ConvertTo-Json -Depth 3 | Out-File $outputFile -Encoding utf8
} else {
    $resultados | Export-Csv $outputFile -NoTypeInformation -Encoding UTF8
}

Write-Host ""
Write-Host "Procesados : $($resultados.Count) archivos"
Write-Host "Resultado  : $outputFile"
Write-Host "Revisa el fichero y asigna las zonas en /admin al editar cada ruta." -ForegroundColor Yellow
