# Find folders that contain BOTH ffmpeg.exe and ffprobe.exe on Windows.
# Run:  powershell -ExecutionPolicy Bypass -File scripts/find-ffmpeg.ps1

$ErrorActionPreference = "SilentlyContinue"
$candidates = @(
    "C:\ffmpeg\bin",
    "$env:ProgramFiles\ffmpeg\bin",
    "${env:ProgramFiles(x86)}\ffmpeg\bin",
    "$env:LOCALAPPDATA\Microsoft\WinGet\Packages"
)

Write-Host ""
Write-Host "Mediavore: looking for ffmpeg.exe + ffprobe.exe in the same folder..." -ForegroundColor Cyan
Write-Host ""

$found = @()
foreach ($root in $candidates) {
    if (-not (Test-Path $root)) { continue }
    if ($root -like "*WinGet*Packages*") {
        Get-ChildItem -Path $root -Filter "ffmpeg.exe" -Recurse -File | ForEach-Object {
            $dir = $_.DirectoryName
            $probe = Join-Path $dir "ffprobe.exe"
            if (Test-Path $probe) { $found += $dir }
        }
    } else {
        $ff = Join-Path $root "ffmpeg.exe"
        $fp = Join-Path $root "ffprobe.exe"
        if ((Test-Path $ff) -and (Test-Path $fp)) { $found += $root }
    }
}

$found = $found | Select-Object -Unique

if ($found.Count -eq 0) {
    Write-Host "NOT FOUND." -ForegroundColor Red
    Write-Host ""
    Write-Host "Your install likely has no ffprobe, or it is not on PATH." -ForegroundColor Yellow
    Write-Host "Do this:" -ForegroundColor Yellow
    Write-Host "  1) Download FULL build: https://www.gyan.dev/ffmpeg/builds/"
    Write-Host "     (e.g. ffmpeg-release-full.7z — NOT 'essentials' only)"
    Write-Host "  2) Extract and open the 'bin' folder — you must see BOTH:"
    Write-Host "       ffmpeg.exe   AND   ffprobe.exe"
    Write-Host "  3) Add that 'bin' path to Windows PATH (User), OR run API with:"
    Write-Host ""
    Write-Host '     $env:MEDIAVORE_FFMPEG_DIR = "C:\path\to\that\bin"' -ForegroundColor Green
    Write-Host ""
    exit 1
}

Write-Host "OK — use one of these folders:" -ForegroundColor Green
foreach ($d in $found) {
    Write-Host "  $d"
}
Write-Host ""
Write-Host "Set for this PowerShell session, then start the API:" -ForegroundColor Cyan
Write-Host ('$env:MEDIAVORE_FFMPEG_DIR = "' + $found[0] + '"') -ForegroundColor Green
Write-Host 'cd backend; uvicorn main:app --reload --port 8000'
Write-Host ""
Write-Host "To fix PATH permanently: Win+R -> sysdm.cpl -> Advanced -> Environment Variables" -ForegroundColor DarkGray
Write-Host " -> Path -> New -> paste the folder above. Then open a NEW terminal." -ForegroundColor DarkGray
Write-Host ""
