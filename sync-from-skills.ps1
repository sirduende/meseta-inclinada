# sync-from-skills.ps1 — meseta-inclinada
# Uso: .\sync-from-skills.ps1  |  -DryRun  |  -Only skills
param(
    [switch]$DryRun,
    [string]$Only = ""
)

$SkillsRoot  = "C:\Proyectos\parquesol-skills"
$ProjectRoot = $PSScriptRoot

$FilesToSync = @(
    # Skills / comandos de Claude Code
    @{ Src = "skills\security-audit.md"; Dst = ".claude\commands\security-audit.md"; Group = "skills" }

    # CSS base (descomentar con cuidado: meseta tiene tema verde propio)
    # @{ Src = "templates\base-blazor\wwwroot\css\theme.css"
    #    Dst = "ParquesolSoftware.MesetaInclinada\wwwroot\css\theme.css"; Group = "theme" }
)

# ── Lógica (no editar) ────────────────────────────────────────────────────
$copied = 0; $skipped = 0; $errors = 0
foreach ($entry in $FilesToSync) {
    if ($Only -and $entry.Group -ne $Only) { continue }
    $src = Join-Path $SkillsRoot $entry.Src
    $dst = Join-Path $ProjectRoot $entry.Dst
    if (-not (Test-Path $src)) { Write-Host "⏭️  NO EXISTE  $($entry.Src)" -ForegroundColor DarkGray; $skipped++; continue }
    $srcHash = (Get-FileHash $src -Algorithm MD5).Hash
    $dstHash = if (Test-Path $dst) { (Get-FileHash $dst -Algorithm MD5).Hash } else { "" }
    if ($srcHash -eq $dstHash) { Write-Host "✅ SIN CAMBIOS  $($entry.Dst)" -ForegroundColor DarkGray; $skipped++; continue }
    $action = if (Test-Path $dst) { "ACTUALIZA" } else { "NUEVO    " }
    Write-Host "📥 $action  $($entry.Dst)" -ForegroundColor Cyan
    if (-not $DryRun) {
        try {
            $dstDir = Split-Path $dst -Parent
            if (-not (Test-Path $dstDir)) { New-Item -ItemType Directory -Force $dstDir | Out-Null }
            Copy-Item $src $dst -Force; $copied++
        } catch { Write-Host "   ❌ Error: $_" -ForegroundColor Red; $errors++ }
    }
}
Write-Host ""
if ($DryRun) { Write-Host "Modo DryRun — no se ha copiado nada." -ForegroundColor Yellow }
else {
    Write-Host "Copiados: $copied  |  Sin cambios: $skipped  |  Errores: $errors"
    if ($copied -gt 0) { Write-Host ""; Write-Host "Revisa los cambios antes de hacer commit:" -ForegroundColor Yellow; git diff --stat }
}
