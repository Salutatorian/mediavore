import { motion } from "framer-motion";
import { X, Sliders } from "lucide-react";
import type { AppSettings } from "../App";

interface MediaLabProps {
  settings: AppSettings;
  clientProfileLabel: string;
  onSettingsChange: (s: AppSettings) => void;
  onClose: () => void;
}

const QUALITIES = ["8k", "4k", "1080p", "720p", "480p"];
const CODECS = ["av1", "vp9", "h264"];
const AUDIO_FORMATS = ["original", "mp3", "wav", "opus"];

function formatAudioPill(item: string): string {
  if (item === "original") return "ORIGINAL";
  return item.toUpperCase();
}

export default function MediaLab({
  settings,
  clientProfileLabel,
  onSettingsChange,
  onClose,
}: MediaLabProps) {
  const update = <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />

      {/* Slide-over panel */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 overflow-y-auto border-l border-white/[0.06]"
        style={{
          background:
            "linear-gradient(135deg, rgba(10,10,10,0.85) 0%, rgba(5,5,5,0.90) 100%)",
          backdropFilter: "blur(48px) saturate(1.2)",
          WebkitBackdropFilter: "blur(48px) saturate(1.2)",
        }}
      >
        <div className="p-7">
          {/* Header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Sliders className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-display tracking-wider">
                MEDIA LAB
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video defaults */}
          <Section title="Video Defaults">
            <SettingRow label="Preferred Quality">
              <PillSelect
                items={QUALITIES}
                value={settings.videoQuality}
                onChange={(v) => update("videoQuality", v)}
              />
            </SettingRow>
            <SettingRow label="Preferred Codec">
              <PillSelect
                items={CODECS}
                value={settings.videoCodec}
                onChange={(v) => update("videoCodec", v)}
              />
            </SettingRow>
          </Section>

          <div className="border-t border-white/[0.04] my-8" />

          {/* Audio defaults */}
          <Section title="Audio Defaults">
            <SettingRow label="Preferred Format">
              <PillSelect
                items={AUDIO_FORMATS}
                value={settings.audioFormat}
                onChange={(v) => update("audioFormat", v)}
                formatLabel={formatAudioPill}
              />
            </SettingRow>
            {settings.audioFormat !== "original" && (
              <SettingRow label="Default Bitrate">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-white/30">kbps</span>
                    <span className="text-sm text-violet-400 font-medium tabular-nums">
                      {settings.audioBitrate}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={64}
                    max={320}
                    step={32}
                    value={settings.audioBitrate}
                    onChange={(e) =>
                      update("audioBitrate", Number(e.target.value))
                    }
                  />
                  <div className="flex justify-between text-[11px] text-white/10 mt-1.5">
                    <span>64</span>
                    <span>320</span>
                  </div>
                </div>
              </SettingRow>
            )}
          </Section>

          <div className="border-t border-white/[0.04] my-8" />

          {/* Info */}
          <p className="text-violet-400/35 text-[11px] leading-relaxed font-mono mb-3">
            Device profile: {clientProfileLabel} — defaults favor H.264 + MP4-friendly
            outputs for built-in players. Change codecs above anytime.
          </p>
          <p className="text-white/10 text-xs leading-relaxed tracking-wide">
            These defaults pre-populate when you paste a new URL. You can
            override them per-download in the main view. Settings are saved in
            this browser.
          </p>
        </div>
      </motion.aside>
    </>
  );
}

/* ---- Sub-components ---- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[11px] uppercase tracking-[0.2em] text-violet-400/50 mb-5 font-semibold">
        {title}
      </h3>
      <div className="space-y-6">{children}</div>
    </div>
  );
}

function SettingRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-sm text-white/35 mb-2.5 block">{label}</label>
      {children}
    </div>
  );
}

function PillSelect({
  items,
  value,
  onChange,
  formatLabel,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
  formatLabel?: (item: string) => string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <button
          key={item}
          onClick={() => onChange(item)}
          className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
            value === item ? "pill-active" : "pill-idle"
          }`}
        >
          {formatLabel ? formatLabel(item) : item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
