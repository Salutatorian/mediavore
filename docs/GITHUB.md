# Putting Mediavore on GitHub

Use this checklist so you only upload **source code**, not junk or secrets.

## What to include (safe to push)

| Path | What it is |
|------|------------|
| `backend/main.py` | API server |
| `backend/requirements.txt` | Python dependencies |
| `frontend/src/` | React app source |
| `frontend/public/` | PWA manifest, service worker |
| `frontend/index.html` | Vite entry |
| `frontend/package.json` | npm deps list |
| `frontend/package-lock.json` | Lockfile (recommended) |
| `frontend/vite.config.ts` | Build + dev proxy |
| `frontend/tsconfig.json`, `tailwind.config.js`, `postcss.config.js` | Tooling config |
| `docs/` | Architecture, FFmpeg help, this file |
| `scripts/` | PowerShell helpers |
| `README.md`, `ROADMAP.md` | Project docs |
| `.gitignore` | Keeps bad files out |

## What must stay off GitHub

| Path / pattern | Why |
|----------------|-----|
| `frontend/node_modules/` | Huge; reinstall with `npm install` |
| `frontend/dist/` | Build output; recreate with `npm run build` |
| `backend/.venv/` or any `venv/` | Local Python env; recreate with `python -m venv` |
| `backend/cookies.txt` | **Your login cookies** — private |
| `.env` | API keys, paths, secrets |
| `__pycache__/` | Python cache |

The root [`.gitignore`](../.gitignore) is set up to ignore these automatically.

## First-time push (Windows PowerShell)

From the **project root** (folder that contains `backend/` and `frontend/`):

```powershell
cd "C:\Users\JW\Desktop\project mediavore"
git init
git add .
git status
git commit -m "Initial Mediavore"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub repo URL.

## Later updates

```powershell
git add .
git commit -m "Describe your change"
git push
```

## If `git` says “not a command”

Install [Git for Windows](https://git-scm.com/download/win), restart the terminal, then run the commands again.

## Web upload vs Git

- **Drag-and-drop on github.com** works for a one-off upload but is painful for updates.
- **Git from your PC** is what you want for “push and update” forever.

## After GitHub: going live

GitHub stores code only. To run the site publicly you still need a **server (VPS)** with Python, FFmpeg, Node (to build the frontend), and something like **Nginx** in front. See the main [README](../README.md) and deployment notes there when you add a domain.
