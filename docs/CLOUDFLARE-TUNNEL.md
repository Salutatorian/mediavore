# Go live with Cloudflare Tunnel (no VPS)

Use this when you want **your domain** to reach Mediavore **running on your PC** — fast to try, no server bill. **Your computer must stay on** and running the app for the site to work.

**Trade-offs vs a VPS**

| Tunnel (this doc) | VPS + Nginx |
|-------------------|-------------|
| Free tier friendly | ~$5–12/mo |
| HTTPS automatic | You set up Certbot |
| PC must be on 24/7 for “always up” | Server always on |
| Large downloads may hit Cloudflare limits/timeouts | Usually better for big streams |
| Your home IP not exposed | Normal production pattern |

---

## Before you start

1. **Domain on Cloudflare** — Add the site in the [Cloudflare dashboard](https://dash.cloudflare.com) and point your registrar’s **nameservers** to Cloudflare (required to attach `yourdomain.com` to a tunnel).
2. **Mediavore works locally** — Backend `http://127.0.0.1:8000`, frontend `npm run dev` on `http://127.0.0.1:5173`.
3. **Install `cloudflared`** on Windows: [Cloudflare — Install cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/). Put it on PATH or use the full path to `cloudflared.exe`.

---

## Why two ports?

The UI calls `/api/...` on the **same hostname** as the page. The tunnel must send:

- `https://yourdomain.com/api/*` → **FastAPI** (`127.0.0.1:8000`)
- everything else → **Vite** (`127.0.0.1:5173`)

That way the browser never needs a separate API domain.

**Rule order matters:** put `/api/*` **first**, then the catch‑all for the UI.

---

## Step 1 — Log in and create a tunnel

In PowerShell:

```powershell
cloudflared tunnel login
```

Pick your domain in the browser. Then:

```powershell
cloudflared tunnel create mediavore
```

Note the **Tunnel ID** (UUID) and the **credentials JSON path** (usually `C:\Users\YOU\.cloudflared\<UUID>.json`).

---

## Step 2 — Config file

Create folder `C:\Users\YOU\.cloudflared\` if needed.

Copy [`deploy/cloudflared/config.example.yml`](../deploy/cloudflared/config.example.yml) to:

`C:\Users\YOU\.cloudflared\config.yml`

Edit it:

1. Replace `TUNNEL_UUID` with your tunnel ID (in **two** places: `tunnel:` and `credentials-file` filename).
2. Replace `mediavore.example.com` with the hostname you want (e.g. `app.yourdomain.com` or `yourdomain.com`).
3. Confirm `credentials-file` path matches the `.json` path from step 1.

---

## Step 3 — DNS route for that hostname

Still in PowerShell (use your real hostname):

```powershell
cloudflared tunnel route dns mediavore app.yourdomain.com
```

(`mediavore` is the **tunnel name** you used in `tunnel create`, not the UUID.)

If you use the **apex** domain (`yourdomain.com`), some accounts need a **CNAME flattening** / **CNAME to `yourdomain.com`** setup — Cloudflare usually handles this; if `route dns` errors, add the record manually in **DNS** as instructed by `cloudflared` or the Zero Trust dashboard.

---

## Step 4 — Run everything (three terminals)

**Terminal A — API**

```powershell
cd "C:\Users\JW\Desktop\project mediavore\backend"
# optional: set MEDIAVORE_FFMPEG_DIR / MEDIAVORE_TEMP_DIR if you use them locally
uvicorn main:app --host 127.0.0.1 --port 8000
```

**Terminal B — Frontend**

```powershell
cd "C:\Users\JW\Desktop\project mediavore\frontend"
npm run dev
```

**Terminal C — Tunnel**

```powershell
cloudflared tunnel run mediavore
```

Open `https://app.yourdomain.com` (or whatever hostname you set).

---

## Optional — Run tunnel as a Windows service

So it survives logoff (still need API + Vite running or use a proper process manager):

```powershell
cloudflared service install
```

See Cloudflare docs for **running `cloudflared` as a service** with your `config.yml`.

---

## Troubleshooting

| Issue | What to check |
|--------|----------------|
| 502 / blank | API on 8000? Vite on 5173? Tunnel running? |
| API 404 | Ingress order: `/api/*` must be **above** the UI rule. |
| SSL errors | Domain must use Cloudflare nameservers; wait for DNS. |
| Instagram / X | Same as local: `cookies.txt` in `backend/` if needed. |
| Huge download fails | Try a VPS later; tunnels can hit size/time limits. |

---

## When to move to a VPS

Use [`DEPLOY.md`](DEPLOY.md) when you want 24/7 uptime, fewer limits on streaming, and no dependency on your home PC.
