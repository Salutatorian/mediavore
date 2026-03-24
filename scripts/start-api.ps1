# Start Mediavore API on Windows — edit FFMPEG_BIN to YOUR real path (see /api/instance diagnostics).
# Example after extracting Gyan zip:  C:\Users\YOU\Downloads\ffmpeg-8.1-essentials_build\bin

$ErrorActionPreference = "Stop"

# === EDIT THIS to the folder that contains ffmpeg.exe AND ffprobe.exe ===
$FFMPEG_BIN = "C:\Users\JW\Downloads\ffmpeg-8.1-essentials_build\bin"

$env:MEDIAVORE_TEMP_DIR = "C:\Windows\Temp"
$env:MEDIAVORE_FFMPEG_DIR = $FFMPEG_BIN

if (-not (Test-Path (Join-Path $FFMPEG_BIN "ffmpeg.exe"))) {
    Write-Host "ERROR: ffmpeg.exe not found in: $FFMPEG_BIN" -ForegroundColor Red
    Write-Host "Fix FFMPEG_BIN in scripts/start-api.ps1 (must be the bin folder)." -ForegroundColor Yellow
    exit 1
}
if (-not (Test-Path (Join-Path $FFMPEG_BIN "ffprobe.exe"))) {
    Write-Host "ERROR: ffprobe.exe not found in: $FFMPEG_BIN" -ForegroundColor Red
    Write-Host "Install a FULL FFmpeg build (Gyan essentials/full), not ffmpeg-tools.zip." -ForegroundColor Yellow
    exit 1
}

$backend = Join-Path $PSScriptRoot "..\backend" | Resolve-Path
Set-Location $backend
Write-Host "Starting API — FFmpeg: $FFMPEG_BIN" -ForegroundColor Green
uvicorn main:app --reload --port 8000
