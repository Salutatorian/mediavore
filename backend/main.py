from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import yt_dlp
import asyncio
import subprocess
import tempfile
import os
import re
import shutil
import time
import traceback
import httpx
from urllib.parse import parse_qs, quote, urlencode, urlparse, urlunparse


class ExtractRequest(BaseModel):
    url: str


class FeedbackRequest(BaseModel):
    type: str  # "bug" or "feature"
    message: str


QUALITY_MAP = {"8k": 4320, "4k": 2160, "1080p": 1080, "720p": 720, "480p": 480}
CODEC_MAP = {"av1": "av01", "vp9": "vp9", "h264": "avc1"}

PLATFORMS = {
    "YouTube": "https://www.youtube.com",
    "TikTok": "https://www.tiktok.com",
    "Instagram": "https://www.instagram.com",
    "Twitter/X": "https://x.com",
    "Reddit": "https://www.reddit.com",
    "SoundCloud": "https://soundcloud.com",
    "Twitch": "https://www.twitch.tv",
    "Vimeo": "https://vimeo.com",
    "Facebook": "https://www.facebook.com",
    "Pinterest": "https://www.pinterest.com",
    "Dailymotion": "https://www.dailymotion.com",
    "Bilibili": "https://www.bilibili.com",
    "Bandcamp": "https://bandcamp.com",
}

COOKIE_REQUIRED_PLATFORMS = {"twitter", "instagram", "instagram:story"}

COOKIES_FILE = os.path.join(os.path.dirname(__file__), "cookies.txt")


def _cookie_opts() -> dict:
    """If cookies.txt exists alongside main.py, pass it to yt-dlp for authenticated platforms."""
    if os.path.isfile(COOKIES_FILE):
        return {"cookiefile": COOKIES_FILE}
    return {}


def _proxy_opts() -> dict:
    """
    Optional HTTP(S) proxy for all yt-dlp traffic (often needed for YouTube from datacenter IPs).
    Set env MEDIAVORE_PROXY, e.g. http://user:pass@host:port
    """
    p = (os.environ.get("MEDIAVORE_PROXY") or "").strip()
    if p:
        return {"proxy": p}
    return {}


def _needs_cookies_hint(url: str) -> str | None:
    low = (url or "").lower()
    if "twitter.com" in low or "x.com" in low:
        return "twitter"
    if "instagram.com" in low:
        return "instagram"
    return None

def normalize_media_url(url: str) -> str:
    """
    Watch URLs copied from YouTube often include &list=RD...&start_radio=1.
    yt-dlp then treats them as playlists (radio/mix can be huge) — slow, flaky, or errors.
    Cobalt-style behavior: only the single video (strip playlist / mix params).
    """
    raw = (url or "").strip()
    if not raw:
        return raw
    try:
        parsed = urlparse(raw)
        host = (parsed.netloc or "").lower()
        if "youtube.com" not in host and "youtu.be" not in host and "m.youtube.com" not in host:
            return raw

        # youtu.be/VIDEO?t=...
        if "youtu.be" in host:
            path = parsed.path.strip("/")
            if not path:
                return raw
            vid = path.split("/")[0]
            qs = parse_qs(parsed.query)
            q = {"v": [vid]}
            if "t" in qs:
                q["t"] = qs["t"]
            return urlunparse(
                ("https", "www.youtube.com", "/watch", "", urlencode(q, doseq=True), "")
            )

        # www.youtube.com/watch?v=...
        if "/watch" in (parsed.path or "") or parsed.path in ("/watch", ""):
            qs = parse_qs(parsed.query)
            v = (qs.get("v") or [None])[0]
            if not v:
                return raw
            new_q = {"v": [v]}
            if "t" in qs:
                new_q["t"] = qs["t"]
            return urlunparse(
                (
                    parsed.scheme or "https",
                    "www.youtube.com",
                    "/watch",
                    "",
                    urlencode(new_q, doseq=True),
                    "",
                )
            )
    except Exception:
        return raw
    return raw


def _win_long_path(path: str) -> str:
    """Windows: enable >260-char paths and avoid some EINVAL open() edge cases."""
    if os.name != "nt":
        return path
    ab = os.path.abspath(path)
    if ab.startswith("\\\\?\\"):
        return ab
    if ab.startswith("\\\\"):  # UNC — extended-length UNC
        return "\\\\?\\UNC\\" + ab[2:].lstrip("\\")
    return "\\\\?\\" + ab


def _ffmpeg_env_placeholder_warning() -> str | None:
    raw = (os.environ.get("MEDIAVORE_FFMPEG_DIR") or "").strip()
    low = raw.lower().replace("/", "\\")
    if not raw:
        return None
    if "path\\to\\your" in low or "your\\ffmpeg" in low or "path\\to\\ffmpeg" in low:
        return (
            "MEDIAVORE_FFMPEG_DIR looks like a documentation placeholder, not a real folder. "
            "Use the actual path to your bin folder (where ffmpeg.exe and ffprobe.exe live), "
            "e.g. C:\\Users\\YOU\\Downloads\\ffmpeg-8.1-essentials_build\\bin"
        )
    if not os.path.isdir(os.path.normpath(raw.strip('"'))):
        return (
            f"MEDIAVORE_FFMPEG_DIR is set to {raw!r} but that folder does not exist. "
            "Fix the path or unset the variable so PATH is used."
        )
    return None


def _mediavore_mkdtemp() -> str:
    """
    Avoid TEMP pointing at cloud-sync folders (OneDrive etc.) — they often trigger
    WinError 22 / OSError EINVAL when ffmpeg or yt-dlp writes media files.
    """
    override = (os.environ.get("MEDIAVORE_TEMP_DIR") or "").strip().strip('"')
    if override:
        override = os.path.normpath(override)
        if os.path.isdir(override):
            try:
                return tempfile.mkdtemp(prefix="mv_", dir=override)
            except OSError:
                pass
    local = os.environ.get("LOCALAPPDATA", "")
    if local:
        t = os.path.join(local, "Temp")
        if os.path.isdir(t):
            try:
                return tempfile.mkdtemp(prefix="mv_", dir=t)
            except OSError:
                pass
    return tempfile.mkdtemp(prefix="mv_")


def _ffmpeg_location_from_env() -> dict:
    """
    If ffmpeg/ffprobe are not on PATH, set:
      MEDIAVORE_FFMPEG_DIR=C:\\path\\to\\folder
    where that folder contains ffmpeg.exe and ffprobe.exe (typical: ...\\ffmpeg\\bin).
    """
    raw = (os.environ.get("MEDIAVORE_FFMPEG_DIR") or "").strip().strip('"')
    raw = os.path.normpath(raw) if raw else ""
    if not raw or not os.path.isdir(raw):
        return {}
    ext = ".exe" if os.name == "nt" else ""
    ff = os.path.join(raw, f"ffmpeg{ext}")
    fp = os.path.join(raw, f"ffprobe{ext}")
    if os.path.isfile(ff) and os.path.isfile(fp):
        return {"ffmpeg_location": raw}
    return {}


def _ytdlp_opts(base: dict) -> dict:
    return {**base, **_ffmpeg_location_from_env(), **_cookie_opts(), **_proxy_opts()}


# YouTube often returns "Video unavailable" for the default web client even when
# the video is public. A short fallback chain is enough; long chains make *every*
# paste feel stuck (each client can add 20s+ on timeouts).
# noplaylist: watch URLs with &list= must not expand into playlist/radio processing.
YTDLP_COMMON_OPTS = {
    "quiet": True,
    "no_warnings": True,
    "noplaylist": True,
    "socket_timeout": 20,
    "windows_filenames": True,
    "restrictfilenames": True,
    "remote_components": ["ejs:github"],
    "extractor_args": {
        "youtube": {
            "player_client": "web,android,ios",
        },
    },
}

# Metadata-only extract: skip downloading subtitles, thumbnails, etc. = faster.
YTDLP_EXTRACT_OPTS = {
    **YTDLP_COMMON_OPTS,
    "writesubtitles": False,
    "writeautomaticsub": False,
    "writethumbnail": False,
    "writeinfojson": False,
}


def _build_display_filename(info: dict, dl_type: str, quality: str, ext: str) -> str:
    """Build a clean, descriptive filename from yt-dlp metadata for the browser download."""
    title = (info.get("title") or "mediavore-download").strip()
    title = re.sub(r'[<>:"/\\|?*\x00-\x1f]', '', title)
    title = title.encode("ascii", "ignore").decode("ascii")
    title = re.sub(r'\s+', '_', title)
    title = re.sub(r'_+', '_', title).strip('_')
    if not title:
        title = "mediavore-download"
    title = title[:180]

    if dl_type == "video":
        # Use actual resolution from info if available, fall back to the requested quality
        h = info.get("height")
        w = info.get("width")
        if h and w:
            q = f"{min(h, w)}x{max(h, w)}" if h > w else f"{w}x{h}"
        elif h:
            q = f"{h}p"
        else:
            q = quality if quality else "best"
        return f"{title}_{q}{ext}"
    return f"{title}{ext}"


def _best_thumbnail_url(info: dict) -> str | None:
    """
    yt-dlp often omits top-level `thumbnail` for Instagram, TikTok, etc. but fills
    `thumbnails` with multiple URLs. Pick the largest by pixel area when dimensions exist.
    """
    if not isinstance(info, dict):
        return None

    def from_single(d: dict) -> str | None:
        for key in ("thumbnail", "thumbnail_url"):
            v = d.get(key)
            if isinstance(v, str) and v.strip():
                return v.strip()
            if isinstance(v, list) and v:
                first = v[0]
                if isinstance(first, str) and first.strip():
                    return first.strip()
                if isinstance(first, dict):
                    u = first.get("url")
                    if isinstance(u, str) and u.strip():
                        return u.strip()
        thumbs = d.get("thumbnails")
        if not isinstance(thumbs, list) or not thumbs:
            return None
        best_url = None
        best_score = (-1, -9999)  # (pixel_area, preference)
        for th in thumbs:
            if not isinstance(th, dict):
                continue
            url = th.get("url")
            if not isinstance(url, str) or not url.strip():
                continue
            url = url.strip()
            w = th.get("width") or 0
            h = th.get("height") or 0
            try:
                area = int(w) * int(h) if w and h else 0
            except (TypeError, ValueError):
                area = 0
            pref = th.get("preference")
            try:
                p = int(pref) if pref is not None else -9999
            except (TypeError, ValueError):
                p = -9999
            score = (area, p)
            if score > best_score:
                best_score = score
                best_url = url
        if best_url:
            return best_url
        for th in reversed(thumbs):
            if isinstance(th, dict):
                u = th.get("url")
                if isinstance(u, str) and u.strip():
                    return u.strip()
        return None

    top = from_single(info)
    if top:
        return top
    entries = info.get("entries")
    if isinstance(entries, list):
        for ent in entries:
            if isinstance(ent, dict):
                u = from_single(ent)
                if u:
                    return u
    return None


def _ytdlp_extract_info_sync(url: str, opts: dict):
    with yt_dlp.YoutubeDL(opts) as ydl:
        return ydl.extract_info(url, download=False)


def _pick_existing_file(preferred: str, directory: str) -> str:
    if preferred and os.path.isfile(preferred):
        return preferred
    if os.path.isdir(directory):
        # Prefer media-like extensions; avoid picking random sidecar files.
        media_exts = (
            ".m4a", ".webm", ".opus", ".mp3", ".wav", ".mp4", ".mkv", ".ogg", ".flac",
        )
        files = [
            os.path.join(directory, f)
            for f in os.listdir(directory)
            if os.path.isfile(os.path.join(directory, f))
            and os.path.splitext(f)[1].lower() in media_exts
        ]
        if files:
            return max(files, key=os.path.getmtime)
    return preferred


def _final_download_path(info: dict, template_path: str) -> str:
    """Use yt-dlp's post-download filepath — avoids wrong-file bugs in tmp dirs."""
    fp = info.get("filepath")
    if fp and os.path.isfile(fp):
        return fp
    rd = info.get("requested_downloads")
    if isinstance(rd, list) and rd:
        last = rd[-1]
        if isinstance(last, dict):
            fp2 = last.get("filepath")
            if fp2 and os.path.isfile(fp2):
                return fp2
    d = os.path.dirname(template_path)
    return _pick_existing_file(template_path, d)


def _ytdlp_download_sync(url: str, opts: dict, media_type: str, audio_format: str) -> tuple[str, dict]:
    """Run full download in a worker thread; returns (file_path, info_dict)."""
    with yt_dlp.YoutubeDL(opts) as ydl:
        info = ydl.extract_info(url, download=True)
        template_path = ydl.prepare_filename(info)
        if media_type == "audio":
            if audio_format == "original":
                path = _final_download_path(info, template_path)
            else:
                base = os.path.splitext(template_path)[0]
                transcoded = f"{base}.{audio_format}"
                path = _final_download_path(info, transcoded)
                if not os.path.isfile(path):
                    d = os.path.dirname(transcoded)
                    path = _pick_existing_file(transcoded, d)
            return path, info
        return _final_download_path(info, template_path), info


async def auto_update_ytdlp():
    """Background task: update yt-dlp every 12 hours to stay ahead of platform changes."""
    while True:
        await asyncio.sleep(43200)
        try:
            subprocess.run(
                ["pip", "install", "-U", "yt-dlp"],
                capture_output=True,
                timeout=120,
            )
        except Exception:
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    task = asyncio.create_task(auto_update_ytdlp())
    yield
    task.cancel()


MEDIAVORE_API_VERSION = "1.0.0"
MEDIAVORE_INSTANCE_SCHEMA = "mediavore.instance.v1"

app = FastAPI(title="Mediavore API", version=MEDIAVORE_API_VERSION, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """So opening http://127.0.0.1:8000/ in a browser is not a 404."""
    return {
        "service": "Mediavore API",
        "status": "ok",
        "docs": "/docs",
        "endpoints": {
            "instance": "GET /api/instance",
            "health": "GET /api/health",
            "extract": "POST /api/extract",
            "download": "GET /api/download?url=...",
        },
    }


@app.get("/api/instance")
async def instance_info():
    """
    Mediavore-specific instance descriptor — not interchangeable with other tools' JSON shapes.
    """
    try:
        ytdlp_version = yt_dlp.version.__version__
    except Exception:
        ytdlp_version = "unknown"

    ff_dir = (os.environ.get("MEDIAVORE_FFMPEG_DIR") or "").strip()
    ytdlp_ffmpeg = _ffmpeg_location_from_env().get("ffmpeg_location")
    return {
        "schema": MEDIAVORE_INSTANCE_SCHEMA,
        "product": "mediavore",
        "api_version": MEDIAVORE_API_VERSION,
        "diagnostics": {
            "platform": os.name,
            "ffmpeg_on_path": shutil.which("ffmpeg") or None,
            "ffprobe_on_path": shutil.which("ffprobe") or None,
            "mediavore_ffmpeg_dir_env": ff_dir or None,
            "yt_dlp_ffmpeg_location": ytdlp_ffmpeg,
            "env_warning": _ffmpeg_env_placeholder_warning(),
            "cookies_file": COOKIES_FILE if os.path.isfile(COOKIES_FILE) else None,
            "proxy_configured": bool((os.environ.get("MEDIAVORE_PROXY") or "").strip()),
        },
        "engine": {
            "name": "yt-dlp",
            "version": ytdlp_version,
        },
        "endpoints": {
            "openapi": "/docs",
            "instance": "/api/instance",
            "health": "/api/health",
            "extract": "POST /api/extract",
            "download": "GET /api/download",
        },
        "pipeline": {
            "summary": "normalize → metadata (extract) → file materialization → stream attachment",
            "materializes_files": True,
        },
        "capabilities": [
            "url_normalization",
            "metadata_preview",
            "streamed_attachment_download",
            "audio_transcode_via_ffmpeg",
        ],
    }


@app.get("/api/health")
async def check_health():
    results = []
    async with httpx.AsyncClient(timeout=10, follow_redirects=True) as client:
        for name, url in PLATFORMS.items():
            start = time.time()
            try:
                resp = await client.head(url)
                latency = int((time.time() - start) * 1000)
                status = "online" if resp.status_code < 400 else "degraded"
            except Exception:
                latency = None
                status = "offline"
            results.append({
                "name": name,
                "status": status,
                "latency_ms": latency,
                "last_checked": time.time(),
            })

    try:
        version = yt_dlp.version.__version__
    except Exception:
        version = "unknown"

    return {"platforms": results, "ytdlp_version": version}


GITHUB_REPO = "Salutatorian/mediavore"
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")
_feedback_timestamps: dict[str, float] = {}
FEEDBACK_COOLDOWN = 60


@app.post("/api/feedback")
async def submit_feedback(req: FeedbackRequest, request: Request):
    if not GITHUB_TOKEN:
        raise HTTPException(status_code=503, detail="Feedback is not configured on this instance.")

    msg = (req.message or "").strip()
    if not msg or len(msg) < 5:
        raise HTTPException(status_code=422, detail="Message must be at least 5 characters.")
    if len(msg) > 2000:
        raise HTTPException(status_code=422, detail="Message must be under 2000 characters.")

    fb_type = (req.type or "bug").strip().lower()
    if fb_type not in ("bug", "feature"):
        raise HTTPException(status_code=422, detail='Type must be "bug" or "feature".')

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    last = _feedback_timestamps.get(client_ip, 0)
    if now - last < FEEDBACK_COOLDOWN:
        wait = int(FEEDBACK_COOLDOWN - (now - last))
        raise HTTPException(status_code=429, detail=f"Please wait {wait}s before submitting again.")
    _feedback_timestamps[client_ip] = now

    label = "bug" if fb_type == "bug" else "enhancement"
    title_prefix = "Bug Report" if fb_type == "bug" else "Feature Request"
    title = f"[{title_prefix}] {msg[:80]}"

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(
            f"https://api.github.com/repos/{GITHUB_REPO}/issues",
            headers={
                "Authorization": f"Bearer {GITHUB_TOKEN}",
                "Accept": "application/vnd.github+json",
            },
            json={"title": title, "body": msg, "labels": [label]},
        )
    if resp.status_code not in (200, 201):
        raise HTTPException(status_code=502, detail="Failed to create issue. Try again later.")

    return {"ok": True, "issue_url": resp.json().get("html_url")}


@app.post("/api/extract")
async def extract_info(req: ExtractRequest):
    url = normalize_media_url(req.url)
    ydl_opts = {**_ytdlp_opts(YTDLP_EXTRACT_OPTS), "skip_download": True}
    try:
        # yt-dlp is blocking; run off the event loop so the API stays responsive.
        info = await asyncio.wait_for(
            asyncio.to_thread(_ytdlp_extract_info_sync, url, ydl_opts),
            timeout=75.0,
        )
    except asyncio.TimeoutError:
        raise HTTPException(
            status_code=504,
            detail="YouTube took too long to respond. Try again, or run: pip install -U yt-dlp",
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=_download_error_detail(e))

    formats = []
    for f in (info.get("formats") or []):
        formats.append({
            "format_id": f.get("format_id", ""),
            "ext": f.get("ext", ""),
            "resolution": f.get("resolution"),
            "filesize": f.get("filesize"),
            "vcodec": f.get("vcodec"),
            "acodec": f.get("acodec"),
            "tbr": f.get("tbr"),
        })

    platform = None
    if info.get("extractor"):
        platform = info["extractor"].split(":")[0]

    return {
        "title": info.get("title", "Unknown"),
        "thumbnail": _best_thumbnail_url(info),
        "duration": info.get("duration"),
        "uploader": info.get("uploader"),
        "platform": platform,
        "formats": formats,
    }


def _download_error_detail(exc: Exception) -> str:
    msg = str(exc).strip() or repr(exc)
    low = msg.lower()
    if "errno 22" in low or "invalid argument" in low or "oserror 22" in low:
        extra = _ffmpeg_env_placeholder_warning()
        tail = (
            "Windows: (1) Open http://127.0.0.1:8000/api/instance and check "
            "`diagnostics` — ffmpeg_on_path and yt_dlp_ffmpeg_location must be set. "
            "(2) Do NOT use the placeholder C:\\path\\to\\your\\ffmpeg\\bin — use your real "
            "bin folder, e.g. C:\\Users\\YOU\\Downloads\\ffmpeg-8.1-essentials_build\\bin. "
            "(3) If TEMP is on OneDrive, set MEDIAVORE_TEMP_DIR to C:\\Windows\\Temp."
        )
        if extra:
            return f"{msg}\n\n{extra}\n\n{tail}"
        return f"{msg}\n\n{tail}"
    if "ffmpeg" in low or "ffprobe" in low:
        return (
            f"{msg}\n\n"
            "MP3, WAV, and OPUS need FFmpeg + ffprobe. Either add their folder to "
            "Windows PATH, or set env var MEDIAVORE_FFMPEG_DIR to that folder "
            "(must contain ffmpeg.exe and ffprobe.exe). See docs/WINDOWS-FFMPEG.md\n\n"
            "Download: https://ffmpeg.org/download.html (full build with ffprobe, not ffmpeg.exe only)."
        )
    if ("sign in" in low and "bot" in low) or "requested format is not available" in low:
        return (
            "YouTube is temporarily unavailable. YouTube actively blocks downloads "
            "from cloud servers. Try again later, or try a different platform like "
            "Instagram, TikTok, SoundCloud, Reddit, or Twitch."
        )
    if "cookie" in low or "login" in low or "not granting access" in low or "empty media response" in low:
        return (
            "This platform requires authentication to download. "
            "The server may not have valid credentials for this service right now. "
            "Try again later."
        )
    if "no video could be found" in low:
        return (
            "No downloadable video found. If this is a Twitter/X link, "
            "image-only tweets can't be downloaded — only tweets with video."
        )
    return msg


@app.get("/api/download")
async def download_media(
    url: str = Query(...),
    type: str = Query("video"),
    quality: str = Query("1080p"),
    video_codec: str = Query("h264"),
    audio_format: str = Query("original"),
    audio_bitrate: int = Query(192),
    client: str = Query(
        "unknown",
        description="Client device profile from the Mediavore UI (ios, macos, windows, …).",
    ),
):
    url = normalize_media_url(url)
    dl_type = (type or "video").strip().lower()
    quality = (quality or "1080p").strip().lower()
    video_codec = (video_codec or "h264").strip().lower()
    audio_format = (audio_format or "original").strip().lower()

    if dl_type not in ("video", "audio"):
        raise HTTPException(
            status_code=422,
            detail='Invalid type= (use "video" or "audio").',
        )

    tmp_dir = _mediavore_mkdtemp()
    # Short ASCII basename — avoids reserved names, odd ids, and merge temp edge cases.
    output_template = os.path.join(tmp_dir, "m.%(ext)s")

    ydl_opts = {
        **_ytdlp_opts(YTDLP_COMMON_OPTS),
        "outtmpl": output_template,
    }

    is_youtube = "youtube.com" in url or "youtu.be" in url

    # iPhone / iOS: Safari and Files play MP4 (H.264 + AAC) reliably. Without this,
    # merged DASH streams often become .webm or .mkv, which are flaky in iOS Downloads.
    if dl_type == "video":
        ydl_opts["merge_output_format"] = "mp4"

    if dl_type == "audio":
        if audio_format == "original":
            if is_youtube:
                ydl_opts["format"] = (
                    "140/141/139/"
                    "bestaudio*[protocol!=http_dash_segments][protocol!=m3u8_native]/"
                    "bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best"
                )
            else:
                ydl_opts["format"] = "bestaudio/best"
        else:
            ydl_opts["format"] = "bestaudio/best"
            ydl_opts["postprocessors"] = [{
                "key": "FFmpegExtractAudio",
                "preferredcodec": audio_format,
                "preferredquality": str(audio_bitrate),
            }]
    else:
        if is_youtube:
            height = QUALITY_MAP.get(quality, 1080)
            vcodec = CODEC_MAP.get(video_codec, "avc1")
            ydl_opts["format"] = (
                f"bestvideo[height<={height}][vcodec^={vcodec}]+bestaudio/"
                f"bestvideo[height<={height}]+bestaudio/"
                f"bestvideo+bestaudio/"
                f"best[height<={height}]/best"
            )
        else:
            # Non-YouTube platforms (Instagram, TikTok, Reddit, etc.) serve
            # progressive files — just grab the best available. Forcing a height
            # cap ruins vertical video quality (reels are 1080x1920 = height 1920).
            ydl_opts["format"] = "bestvideo+bestaudio/best"

    if dl_type == "video":
        ydl_opts.setdefault("postprocessors", [])
        ydl_opts["postprocessors"].append({
            "key": "FFmpegVideoRemuxer",
            "preferedformat": "mp4",
        })

    try:
        downloaded_file, dl_info = await asyncio.to_thread(
            _ytdlp_download_sync, url, ydl_opts, dl_type, audio_format
        )
    except Exception as e:
        print(f"\n[MEDIAVORE] Download failed:\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=400,
            detail=_download_error_detail(e),
        )

    if not os.path.exists(downloaded_file):
        files = os.listdir(tmp_dir)
        if files:
            downloaded_file = os.path.join(tmp_dir, files[0])
        else:
            raise HTTPException(status_code=500, detail="Download failed — no output file")

    io_path = _win_long_path(downloaded_file) if os.name == "nt" else downloaded_file
    try:
        file_size = os.path.getsize(io_path)
    except OSError:
        file_size = os.path.getsize(downloaded_file)
    if file_size < 1024:
        raise HTTPException(
            status_code=500,
            detail="Downloaded file is too small to be valid audio. Retry, or install FFmpeg for reliable YouTube merges.",
        )

    ext = os.path.splitext(downloaded_file)[1].lower()
    display_name = _build_display_filename(dl_info, dl_type, quality, ext)
    content_types = {
        ".mp4": "video/mp4",
        ".webm": "video/webm",
        ".mkv": "video/x-matroska",
        ".mp3": "audio/mpeg",
        ".wav": "audio/wav",
        ".opus": "audio/opus",
        ".m4a": "audio/mp4",
        ".ogg": "audio/ogg",
        ".flac": "audio/flac",
    }
    content_type = content_types.get(ext, "application/octet-stream")
    if ext == ".webm" and dl_type == "audio":
        content_type = "audio/webm"

    def iter_file():
        try:
            try:
                fobj = open(io_path, "rb")
            except OSError:
                fobj = open(downloaded_file, "rb")
            with fobj as f:
                while True:
                    chunk = f.read(65536)
                    if not chunk:
                        break
                    yield chunk
        finally:
            try:
                for p in (io_path, downloaded_file):
                    try:
                        if os.path.isfile(p):
                            os.remove(p)
                    except OSError:
                        pass
                os.rmdir(tmp_dir)
            except Exception:
                pass

    encoded_name = quote(display_name, safe='')
    return StreamingResponse(
        iter_file(),
        media_type=content_type,
        headers={
            "Content-Disposition": (
                f"attachment; filename=\"{display_name}\"; "
                f"filename*=UTF-8''{encoded_name}"
            ),
            "Content-Length": str(file_size),
            "Access-Control-Expose-Headers": "Content-Disposition, Content-Length",
        },
    )
