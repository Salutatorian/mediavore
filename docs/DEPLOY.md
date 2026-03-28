# Deploy Mediavore (go live)

Your **domain** points visitors to a **server**. **GitHub** only stores code. The live site runs on a **VPS** with Nginx + Python + FFmpeg.

**Why VPS (not your PC):** The server stays on 24/7. Visitors don’t depend on your laptop. This is the right setup for a public site.

**Want a quick test on your domain from home first?** Optional: [**Cloudflare Tunnel**](CLOUDFLARE-TUNNEL.md) (PC must stay on).

**Why one VPS:** The frontend calls `/api/...` on the same host. Nginx serves the built React app and proxies `/api` to FastAPI.

---

## 1. Buy / create a VPS

- **Ubuntu 22.04 or 24.04**
- **~2 GB RAM** minimum (FFmpeg + yt-dlp)
- **20+ GB** disk

Providers: Hetzner, DigitalOcean, Vultr, Linode, etc.

You get a **public IP** (e.g. `203.0.113.50`).

---

## 2. Point your domain (DNS)

At your domain registrar:

| Type | Name | Value        |
|------|------|--------------|
| A    | @    | your VPS IP  |
| A    | www  | your VPS IP  |

Wait until DNS resolves (minutes to a few hours).

---

## 3. SSH into the server

```bash
ssh root@YOUR_SERVER_IP
```

Update the system:

```bash
apt update && apt upgrade -y
```

---

## 4. Install packages

**Node.js:** Ubuntu’s default `nodejs` from `apt` is often **too old** for this frontend (Vite 6 needs **Node 18+**, **20 LTS** is safest). Use NodeSource, then install the rest:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v   # should show v20.x
```

**Everything else:**

```bash
apt install -y git nginx ffmpeg python3 python3-pip python3-venv certbot python3-certbot-nginx ufw
```

`npm` ships with the NodeSource `nodejs` package.

Check FFmpeg:

```bash
ffmpeg -version && ffprobe -version
```

Open the firewall:

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

---

## 5. Clone the repo

Pick an install path (example: `/opt/mediavore`):

```bash
cd /opt
git clone https://github.com/Salutatorian/mediavore.git
cd mediavore
```

---

## 6. Backend (Python venv + install)

```bash
cd /opt/mediavore/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
deactivate
```

Optional env vars (create a small file the service will load, or use `Environment=` in systemd):

- `MEDIAVORE_FFMPEG_DIR` — if `ffmpeg`/`ffprobe` are not on `PATH`
- `MEDIAVORE_TEMP_DIR` — e.g. `/tmp` or `/var/tmp/mediavore`

Instagram / Twitter often need `cookies.txt` in `backend/` (see main app docs). **Never commit** that file.

---

## 7. Frontend build

```bash
cd /opt/mediavore/frontend
npm ci
npm run build
```

Output is `frontend/dist/`.

---

## 8. Systemd: keep the API running

Create `/etc/systemd/system/mediavore.service`:

```ini
[Unit]
Description=Mediavore FastAPI (yt-dlp)
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/mediavore/backend
Environment=PATH=/opt/mediavore/backend/.venv/bin:/usr/bin
ExecStart=/opt/mediavore/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Adjust `User`/`Group` if you use a dedicated `mediavore` user.

Give `www-data` read access to the app (and write to temp if needed):

```bash
chown -R www-data:www-data /opt/mediavore/backend
```

Enable and start:

```bash
systemctl daemon-reload
systemctl enable mediavore
systemctl start mediavore
systemctl status mediavore
```

Test locally on the server:

```bash
curl -s http://127.0.0.1:8000/api/instance | head
```

---

## 9. Nginx: static site + `/api` proxy

Create `/etc/nginx/sites-available/mediavore`:

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    root /opt/mediavore/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        client_max_body_size 0;
    }
}
```

Enable the site:

```bash
ln -sf /etc/nginx/sites-available/mediavore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

---

## 10. HTTPS (Let’s Encrypt)

```bash
certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

Follow prompts. Certbot will edit Nginx for SSL.

---

## 11. Smoke test

Open in a browser:

- `https://YOUR_DOMAIN.com` — UI
- `https://YOUR_DOMAIN.com/api/instance` — JSON diagnostics

Paste a YouTube URL and try a download.

---

## 12. Updates after you `git push`

On your PC:

```powershell
git add .
git commit -m "Your change"
git push
```

On the server:

```bash
cd /opt/mediavore
git pull
source backend/.venv/bin/activate
pip install -r backend/requirements.txt
deactivate
cd frontend && npm ci && npm run build
systemctl restart mediavore
systemctl reload nginx
```

---

## Troubleshooting

| Problem | Check |
|--------|--------|
| 502 on `/api` | `systemctl status mediavore`, `journalctl -u mediavore -n 50` |
| FFmpeg errors | `which ffmpeg ffprobe`, or set `MEDIAVORE_FFMPEG_DIR` in the systemd unit |
| Long downloads cut off | Nginx `proxy_*_timeout` (already 300s above) |
| Instagram / X fail | `cookies.txt` in `backend/`, latest `yt-dlp` (`pip install -U yt-dlp`) |

---

## Summary

1. VPS + Ubuntu  
2. DNS A record → VPS IP  
3. Install git, nginx, ffmpeg, python, node  
4. Clone repo → venv + `pip install` → `npm ci` + `npm run build`  
5. systemd for uvicorn on `127.0.0.1:8000`  
6. Nginx: `root` = `frontend/dist`, `location /api/` → proxy  
7. certbot for HTTPS  

That is the full path from **GitHub** to **live website**.
