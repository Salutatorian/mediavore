# The Mediavore Roadmap

Mediavore is a hungry, aggressive name for a **modern utility**: it *consumes* a link and returns the media you asked for—without pretending to be anyone else’s product.

We’re in the same **category** as other paste-URL downloaders (see `docs/INSPIRATION.md` for how we relate to projects like Cobalt **without** copying code or API design). This roadmap is **Mediavore-native**.

## Phase 1: The "No-Shortcut" Engine

The biggest annoyance with Cobalt on iOS is the reliance on Apple Shortcuts. We'll bypass this by using a Service Worker and Stream-to-Blob logic.

- **Goal**: When a user hits download on an iPhone, the browser handles the stream directly into the "Downloads" folder in the Files app.
- **Tech**: FastAPI `StreamingResponse` + `Content-Disposition: attachment`.

## Phase 2: The "Live Status" UI

When a download fails, “silent failure” is worse than an error message.

- **Feature**: A real-time "Health Dashboard."
- **Design**: A small pulse icon (Green/Yellow/Red) next to supported sites (YouTube, TikTok, etc.) that shows if the scrapers are currently working or being blocked.

## Phase 3: The "Deep Control" Panel

Taking the best of existing settings panels but providing a much better, cleaner look.

- **Feature**: A "Media Lab" slide-out menu.
- **Design**: Use vertical sliders for quality and "pill" toggles for codecs. No bulky boxes.
