# Mediavore

Next-gen media downloader — feed it a link, get your media.

**Own stack, own API, own UI.** Mediavore is inspired by the same *category* of tools (paste URL → file) but is **not** built from [Cobalt](https://github.com/imputnet/cobalt) or any other project's source—see [`docs/INSPIRATION.md`](docs/INSPIRATION.md) and [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

Highlights: streaming downloads with attachment headers (mobile-friendly), live health pulses, and the "Fluid-Dark" Mediavore interface.

**GitHub repo:** [github.com/Salutatorian/mediavore](https://github.com/Salutatorian/mediavore)

A root [`.gitignore`](.gitignore) keeps secrets and heavy folders out of your repo. First-time setup and safer upload checklist: [`docs/GITHUB.md`](docs/GITHUB.md).

## Prerequisites

- **Python 3.11+** with pip
- **Node.js 18+** with npm
- **FFmpeg** — **Strongly recommended** for YouTube (DASH merges). **Required** for **MP3 / WAV / OPUS**. You need **`ffmpeg` and `ffprobe`** in the same folder. If `ffmpeg -version` fails in PowerShell, see **[`docs/WINDOWS-FFMPEG.md`](docs/WINDOWS-FFMPEG.md)** (PATH + optional `MEDIAVORE_FFMPEG_DIR`).

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Windows:** If you copy-pasted `MEDIAVORE_FFMPEG_DIR = "C:\path\to\your\ffmpeg\bin"` from the docs, that is **not** a real path — replace it with your actual `bin` folder, or run `powershell -ExecutionPolicy Bypass -File scripts/start-api.ps1` after editing `FFMPEG_BIN` inside that script. Open [http://127.0.0.1:8000/api/instance](http://127.0.0.1:8000/api/instance) and check **`diagnostics`** (ffmpeg paths + warnings).

The API runs at `http://localhost:8000`. Endpoints:

| Method | Path              | Description                         |
| ------ | ----------------- | ----------------------------------- |
| GET    | `/api/instance`   | Mediavore identity + capabilities   |
| POST   | `/api/extract`    | Extract media info from a URL       |
| GET    | `/api/download`   | Stream-download media               |
| GET    | `/api/health`     | Platform connectivity + yt-dlp ver  |

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api/*` to the backend.

### PWA

Add Mediavore to your iPhone Home Screen for a native-app experience. The `manifest.json` and service worker are included — just serve over HTTPS in production.

## Project Structure

```
mediavore/
├── backend/
│   ├── main.py              # FastAPI server + yt-dlp
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Shell + state
│   │   ├── components/
│   │   │   ├── URLInput.tsx  # Glowing input + format morph
│   │   │   ├── MediaLab.tsx  # Settings slide-over
│   │   │   └── HealthDashboard.tsx
│   │   └── index.css         # Fluid-Dark theme
│   ├── public/
│   │   ├── manifest.json     # PWA manifest
│   │   └── sw.js             # Service worker
│   └── index.html
├── docs/
│   ├── ARCHITECTURE.md   # How Mediavore is designed (distinct from "tunnel APIs")
│   └── INSPIRATION.md    # Category reference vs code independence
└── ROADMAP.md
```

## iOS Download Fix

The backend uses `StreamingResponse` with `Content-Disposition: attachment`, which triggers Safari's native download prompt — no Apple Shortcuts needed.

## Auto-Update

A background task runs `pip install -U yt-dlp` every 12 hours to stay ahead of 2026 platform changes.

## License

Mediavore source code is licensed under [AGPL-3.0](LICENSE). If you host a modified version publicly, you must share your changes under the same license.

The **Mediavore** name and branding are not covered by the AGPL and remain the property of their creator.

Third-party libraries (React, Framer Motion, Three.js, FastAPI, yt-dlp, etc.) retain their own licenses.

---

## Push updates (so you never forget)

From the project root, after you change files:

```powershell
cd "C:\Users\JW\Desktop\project mediavore"
git add .
git commit -m "Describe what you changed"
git push
```

If `git push` says the remote has new commits, pull then push:

```powershell
git pull origin main
git push
```

**Don't bulk-upload on github.com** — GitHub caps that at ~100 files. Use `git push` from your PC instead.
