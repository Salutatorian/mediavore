import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Loader2,
  AlertCircle,
  Video,
  Music,
  X,
} from "lucide-react";
import type { AppSettings } from "../App";

interface MediaInfo {
  title: string;
  thumbnail: string | null;
  duration: number | null;
  uploader: string | null;
  platform: string | null;
}

interface URLInputProps {
  settings: AppSettings;
  onProcessingChange?: (v: boolean) => void;
  onConsume?: () => void;
}

function isValidUrl(str: string): boolean {
  try {
    const u = new URL(str);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0)
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatAudioPillLabel(key: string): string {
  if (key === "original") return "ORIGINAL";
  return key.toUpperCase();
}

const QUALITIES = ["8k", "4k", "1080p", "720p", "480p"];
const CODECS = ["av1", "vp9", "h264"];
const AUDIO_FORMATS = ["original", "mp3", "wav", "opus"];

export default function URLInput({
  settings,
  onProcessingChange,
  onConsume,
}: URLInputProps) {
  const [url, setUrl] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");

  const [mediaType, setMediaType] = useState<"video" | "audio">("video");
  const [quality, setQuality] = useState(settings.videoQuality);
  const [codec, setCodec] = useState(settings.videoCodec);
  const [audioFormat, setAudioFormat] = useState(settings.audioFormat);
  const [bitrate, setBitrate] = useState(settings.audioBitrate);

  useEffect(() => {
    setQuality(settings.videoQuality);
    setCodec(settings.videoCodec);
    setAudioFormat(settings.audioFormat);
    setBitrate(settings.audioBitrate);
  }, [settings]);

  const extractInfo = useCallback(
    async (inputUrl: string) => {
      setIsExtracting(true);
      onProcessingChange?.(true);
      setError("");
      setMediaInfo(null);
      const controller = new AbortController();
      const timeoutMs = 85000;
      const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch("/api/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: inputUrl }),
          signal: controller.signal,
        });
        if (!res.ok) {
          let detail = "Extraction failed";
          try {
            const err = await res.json();
            detail =
              typeof err.detail === "string"
                ? err.detail
                : JSON.stringify(err.detail) || detail;
          } catch {
            detail = res.statusText || detail;
          }
          throw new Error(detail);
        }
        const data = await res.json();
        setMediaInfo(data);
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setError(
            "Timed out waiting for the host. Check your connection or try again.",
          );
        } else {
          const message =
            err instanceof Error ? err.message : "Failed to extract media info";
          setError(message);
        }
      } finally {
        window.clearTimeout(timeoutId);
        setIsExtracting(false);
        onProcessingChange?.(false);
      }
    },
    [onProcessingChange],
  );

  useEffect(() => {
    if (!url || !isValidUrl(url)) {
      setMediaInfo(null);
      setError("");
      return;
    }
    const timer = setTimeout(() => extractInfo(url), 600);
    return () => clearTimeout(timer);
  }, [url, extractInfo]);

  const handleDownload = async () => {
    if (!url) return;
    setIsDownloading(true);
    setError("");
    onConsume?.();

    const params = new URLSearchParams({
      url,
      type: mediaType,
      quality,
      video_codec: codec,
      audio_format: audioFormat,
      audio_bitrate: String(bitrate),
    });

    try {
      const res = await fetch(`/api/download?${params}`);
      if (!res.ok) {
        let detail = "Download failed";
        try {
          const err = await res.json();
          detail =
            typeof err.detail === "string"
              ? err.detail
              : JSON.stringify(err.detail) || detail;
        } catch {
          detail = res.statusText || detail;
        }
        setError(detail);
        return;
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      let filename = "mediavore-download";
      const cd = res.headers.get("Content-Disposition");
      if (cd) {
        const star = /filename\*\s*=\s*UTF-8''([^;\s]+)/i.exec(cd);
        if (star?.[1]) {
          try {
            filename = decodeURIComponent(star[1].replace(/"/g, ""));
          } catch {
            filename = star[1];
          }
        } else {
          const plain = /filename\s*=\s*"([^"]+)"/i.exec(cd);
          const plain2 = plain ?? /filename\s*=\s*([^;\s]+)/i.exec(cd);
          if (plain2?.[1]) filename = plain2[1].replace(/"/g, "");
        }
      }

      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Network error while downloading",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const clearInput = () => {
    setUrl("");
    setMediaInfo(null);
    setError("");
  };

  const glowIntensity =
    isFocused || mediaInfo
      ? "0 0 40px rgba(139,92,246,0.10), 0 0 80px rgba(139,92,246,0.04)"
      : "none";

  return (
    <motion.div
      layout
      className="w-full max-w-xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ===== The Oasis — single horizontal bar ===== */}
      <motion.div
        layout
        className="relative rounded-2xl overflow-hidden oasis"
        style={{ boxShadow: glowIntensity }}
        transition={{
          layout: { type: "spring", damping: 30, stiffness: 300 },
        }}
      >
        {/* ---- Input row ---- */}
        <motion.div layout className="flex items-center px-5 py-4 gap-3">
          {isExtracting ? (
            <Loader2 className="w-5 h-5 text-violet-400 animate-spin shrink-0" />
          ) : (
            <span className="text-white/20 text-sm font-mono shrink-0 select-none">
              &gt;
            </span>
          )}

          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Paste a link..."
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-white/20 font-mono min-w-0"
          />

          <AnimatePresence mode="wait">
            {url && !mediaInfo && !isExtracting && (
              <motion.button
                key="clear"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={clearInput}
                className="shrink-0 p-1.5 rounded-lg text-white/20 hover:text-white/50 transition-all"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
            {mediaInfo && !isDownloading && (
              <motion.button
                key="devour"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleDownload}
                className="shrink-0 p-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-all"
                title="Devour"
              >
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            )}
            {isDownloading && (
              <motion.div
                key="downloading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="shrink-0 p-2"
              >
                <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ---- Extracting hint ---- */}
        {isExtracting && url && !mediaInfo && (
          <div className="px-5 pb-3">
            <p className="text-[12px] text-violet-400/50 font-mono">
              Pulling metadata…
            </p>
          </div>
        )}

        {/* ---- Error ---- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 flex items-start gap-2 text-red-400/80 text-[13px] font-mono">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="whitespace-pre-wrap break-words">{error}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ---- Media card — minimal expansion ---- */}
        <AnimatePresence>
          {mediaInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/[0.06]">
                {/* Title + meta */}
                <div className="px-5 pt-4 pb-3 flex gap-3 items-start">
                  {mediaInfo.thumbnail && (
                    <motion.img
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      src={mediaInfo.thumbnail}
                      alt=""
                      className="w-20 h-[52px] object-cover rounded-md shrink-0 bg-white/[0.03]"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-white/90 text-sm font-medium leading-snug line-clamp-2">
                      {mediaInfo.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-[12px] text-white/30 font-mono">
                      {mediaInfo.uploader && <span>{mediaInfo.uploader}</span>}
                      {mediaInfo.duration != null && (
                        <span>{formatDuration(mediaInfo.duration)}</span>
                      )}
                      {mediaInfo.platform && (
                        <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400/80 text-[10px] uppercase tracking-wider font-bold">
                          {mediaInfo.platform}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={clearInput}
                    className="shrink-0 p-1 rounded text-white/15 hover:text-white/40 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Type toggle + quick format */}
                <div className="px-5 pb-4 flex items-center gap-2 flex-wrap">
                  {(["video", "audio"] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setMediaType(type)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold font-mono transition-all border ${
                        mediaType === type
                          ? "pill-active"
                          : "pill-idle border-white/[0.06]"
                      }`}
                    >
                      {type === "video" ? (
                        <Video className="w-3.5 h-3.5" />
                      ) : (
                        <Music className="w-3.5 h-3.5" />
                      )}
                      {type.toUpperCase()}
                    </button>
                  ))}

                  <span className="text-white/10 font-mono text-[10px] mx-1">|</span>

                  {/* Inline format pills */}
                  {mediaType === "video" ? (
                    <>
                      {QUALITIES.slice(0, 4).map((q) => (
                        <button
                          key={q}
                          onClick={() => setQuality(q)}
                          className={`px-2 py-1 rounded text-[11px] font-bold font-mono border transition-all ${
                            quality === q ? "pill-active" : "pill-idle"
                          }`}
                        >
                          {q.toUpperCase()}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {AUDIO_FORMATS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setAudioFormat(f)}
                          className={`px-2 py-1 rounded text-[11px] font-bold font-mono border transition-all ${
                            audioFormat === f ? "pill-active" : "pill-idle"
                          }`}
                        >
                          {formatAudioPillLabel(f)}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
