# dev.ps1 - Arranca Meseta Inclinada en modo desarrollo
# Uso: .\dev.ps1        (build completo)
#      .\dev.ps1 -Fast  (sin recompilar)

param([switch]$Fast)

$proj = 'ParquesolSoftware.MesetaInclinada'

# Matar procesos dotnet anteriores en el puerto 5000
$pids = netstat -ano | Select-String ':5000 ' | ForEach-Object {
    ($_ -split '\s+')[-1]
} | Sort-Object -Unique
foreach ($p in $pids) {
    try { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue } catch {}
}

Write-Host ''
Write-Host '  Meseta Inclinada - dev server' -ForegroundColor Green
Write-Host '  http://localhost:5000' -ForegroundColor Cyan
Write-Host ''

Set-Location $proj

if ($Fast) {
    Write-Host '  Modo rapido (sin recompilar)' -ForegroundColor Yellow
    dotnet run --no-build
} else {
    dotnet run
}
