# Mediavore architecture

Distinct design choices so Mediavore stays **its own product**, not a re-skin of any other downloader.

## High-level flow

1. **Normalize** — Host-specific cleanup (e.g. YouTube watch URLs with `list=` / `start_radio=` collapsed to a single video) so metadata fetch doesn’t balloon into playlist/radio work.
2. **Digest (metadata)** — `POST /api/extract` runs yt-dlp in **off-thread** work with timeouts so the async server doesn’t freeze.
3. **Devour (download)** — `GET /api/download` runs yt-dlp (and FFmpeg for audio transcodes), then streams the finished file to the client with `Content-Disposition: attachment`.

## How this differs from a “tunnel-first” design

Some tools expose a **processing** step that returns **tunnel URLs** or **redirects**, then a **separate** byte stream endpoint that proxies remote CDNs with minimal local storage.

Mediavore intentionally uses a **simpler contract**:

- **Pros:** Straightforward to reason about, easy to deploy behind one origin, works well with “click and save” flows and attachment headers on mobile Safari.
- **Cons:** The server may **materialize a full file on disk** before streaming begins, so very large downloads use disk and time-to-first-byte differs from a pure proxy tunnel.

That tradeoff is a **product decision**, not a copy of another architecture.

## Stack

| Layer    | Choice        | Role                                      |
| -------- | ------------- | ----------------------------------------- |
| API      | FastAPI       | JSON + streaming HTTP                     |
| Extract  | yt-dlp        | Unified extractor for many sites          |
| Transcode| FFmpeg        | Audio formats (e.g. mp3) via post-process |
| UI       | React + Vite  | PWA-capable frontend                      |
| Motion   | Framer Motion | Mediavore-specific interactions           |

## API surface (Mediavore-native)

- `GET /api/instance` — Identity + capabilities (not the same shape as any other project’s “instance info”).
- `GET /api/health` — **Operator-facing** connectivity pulses + engine version.
- `POST /api/extract` — Metadata for UI (title, thumb, duration, rough format list).
- `GET /api/download` — Query-string options for quality/codec/audio; streamed response.

## Roadmap hooks

- **Rate limiting** — Add **our own** limits (e.g. per-IP token bucket) when you expose a public instance; do not copy another API’s header naming unless you intentionally follow an open standard.
- **Structured errors** — Prefer `mediavore.*` style codes in JSON **we define**, not string-for-string parity with other tools.
- **Optional cookies** — For age-gated or account-only media, a **local** cookies file path (env) is a future, explicit operator feature—not “hidden” parity with another app.

## Ethics & responsibility

Mediavore is a tool to fetch media the user can already access. Operators and users are responsible for **copyright, terms of service, and local law**. Run your own instance; don’t hammer public infrastructure.
