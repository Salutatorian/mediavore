# FFmpeg on Windows (PATH not working)

## 0. Quick check (from project root)

```powershell
powershell -ExecutionPolicy Bypass -File scripts/find-ffmpeg.ps1
```

It searches common locations and prints a ready-to-paste `MEDIAVORE_FFMPEG_DIR` line if both tools exist in one folder.

## 1. Confirm the files exist

You need **both** in the **same folder**:

- `ffmpeg.exe`
- `ffprobe.exe`

The **“essentials”** zip that only contains `ffmpeg.exe` is **not enough** for Mediavore / yt-dlp.

**Reliable option:** [Gyan.dev “full” FFmpeg build](https://www.gyan.dev/ffmpeg/builds/) → **ffmpeg-release-full.7z** (or the latest full build) → extract → use the **`bin`** folder inside (it has both `.exe` files).

## 2. Option A — Add that `bin` folder to PATH

1. Win + R → `sysdm.cpl` → **Advanced** → **Environment Variables**.
2. Under **User variables** (or **System**), select **Path** → **Edit** → **New**.
3. Paste the full path to the **`bin`** folder, e.g.  
   `C:\ffmpeg\bin`  
   (whatever folder actually contains `ffmpeg.exe` and `ffprobe.exe`).
4. OK out of all dialogs.
5. **Close and reopen** PowerShell / Cursor / VS Code terminals (PATH is read at startup).

Test in a **new** window:

```powershell
ffmpeg -version
ffprobe -version
```

## 3. Option B — Don’t touch PATH (Mediavore env var)

If you know the folder that contains both exes, set this **before** starting the API (same session):

**PowerShell:**

```powershell
$env:MEDIAVORE_FFMPEG_DIR = "C:\path\to\ffmpeg\bin"
cd "C:\Users\JW\Desktop\project mediavore\backend"
uvicorn main:app --reload --port 8000
```

Use your real path (must be the directory that **directly** contains `ffmpeg.exe` and `ffprobe.exe`).

## 4. If downloads fail with `[Errno 22] Invalid argument`

Your Windows **TEMP** folder may be under **OneDrive** or another sync path. Set a plain local folder before starting the API:

```powershell
$env:MEDIAVORE_TEMP_DIR = "C:\Windows\Temp"
```

(or `C:\Users\YOU\AppData\Local\Temp`), then run `uvicorn` again.

## 5. Find ffmpeg.exe if you used winget but PATH is wrong

In PowerShell:

```powershell
Get-ChildItem -Path "$env:LOCALAPPDATA\Microsoft\WinGet\Packages" -Filter "ffmpeg.exe" -Recurse -ErrorAction SilentlyContinue |
  Select-Object -First 5 -ExpandProperty DirectoryName
```

Open the folder that contains **both** `ffmpeg.exe` and `ffprobe.exe`. If you only see `ffmpeg.exe`, install the **full** build from Gyan (above) or another package that ships **ffprobe** too.

Then use that folder for PATH or `MEDIAVORE_FFMPEG_DIR`.
