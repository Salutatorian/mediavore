import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Activity, RefreshCw, Cookie, Shield } from "lucide-react";

interface PlatformStatus {
  name: string;
  status: "online" | "degraded" | "offline";
  latency_ms: number | null;
  last_checked: number;
}

interface HealthData {
  platforms: PlatformStatus[];
  ytdlp_version: string;
}

interface InstanceDiag {
  cookies_file: string | null;
}

const STATUS_THEME = {
  online: {
    dot: "bg-emerald-400",
    glow: "shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    text: "text-emerald-400",
    label: "Online",
  },
  degraded: {
    dot: "bg-amber-400",
    glow: "shadow-[0_0_8px_rgba(251,191,36,0.5)]",
    text: "text-amber-400",
    label: "Degraded",
  },
  offline: {
    dot: "bg-red-400",
    glow: "shadow-[0_0_8px_rgba(248,113,113,0.5)]",
    text: "text-red-400",
    label: "Offline",
  },
} as const;

const PLATFORM_CATEGORIES: Record<string, string[]> = {
  Video: ["YouTube", "TikTok", "Twitch", "Vimeo", "Dailymotion", "Bilibili"],
  Social: ["Instagram", "Twitter/X", "Reddit", "Facebook", "Pinterest"],
  Audio: ["SoundCloud", "Bandcamp"],
};

const NEEDS_COOKIES = new Set(["Instagram", "Twitter/X"]);

export default function HealthDashboard({ onClose }: { onClose: () => void }) {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [diag, setDiag] = useState<InstanceDiag | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const [healthRes, instanceRes] = await Promise.all([
        fetch("/api/health"),
        fetch("/api/instance"),
      ]);
      const healthData = await healthRes.json();
      const instanceData = await instanceRes.json();
      setHealth(healthData);
      setDiag(instanceData.diagnostics ?? null);
    } catch {
      /* backend not running */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const platformMap = new Map<string, PlatformStatus>();
  if (health) {
    for (const p of health.platforms) {
      platformMap.set(p.name, p);
    }
  }

  const hasCookies = !!diag?.cookies_file;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-4 top-[8%] mx-auto max-w-lg glass rounded-2xl z-50 overflow-hidden max-h-[80vh] flex flex-col"
      >
        <div className="p-6 overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Activity className="w-5 h-5 text-violet-400" />
              </div>
              <h2 className="text-2xl font-display tracking-wider">
                SYSTEM VITALS
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={fetchHealth}
                className="p-2.5 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={onClose}
                className="p-2.5 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {loading && !health ? (
            <div className="text-center py-10 text-white/20 text-sm tracking-wide">
              Checking connections...
            </div>
          ) : health ? (
            <div className="space-y-5">
              {Object.entries(PLATFORM_CATEGORIES).map(
                ([category, platforms]) => (
                  <div key={category}>
                    <p className="text-[10px] uppercase tracking-[0.2em] text-white/20 font-bold mb-2 pl-1">
                      {category}
                    </p>
                    <div className="space-y-1.5">
                      {platforms.map((name, i) => {
                        const p = platformMap.get(name);
                        const status = p?.status ?? "offline";
                        const theme = STATUS_THEME[status];
                        const needsCookie = NEEDS_COOKIES.has(name);

                        return (
                          <motion.div
                            key={name}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                            className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${theme.dot} ${theme.glow} animate-pulse-dot`}
                              />
                              <span className="text-white/60 font-medium text-[14px]">
                                {name}
                              </span>
                              {needsCookie && (
                                <span
                                  className={`flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded ${
                                    hasCookies
                                      ? "bg-emerald-500/10 text-emerald-400/70"
                                      : "bg-amber-500/10 text-amber-400/70"
                                  }`}
                                  title={
                                    hasCookies
                                      ? "Cookies loaded"
                                      : "Needs cookies.txt for full access"
                                  }
                                >
                                  {hasCookies ? (
                                    <Shield className="w-2.5 h-2.5" />
                                  ) : (
                                    <Cookie className="w-2.5 h-2.5" />
                                  )}
                                  {hasCookies ? "AUTH" : "COOKIES"}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3">
                              {p?.latency_ms != null && (
                                <span className="text-[11px] text-white/15 tabular-nums">
                                  {p.latency_ms}ms
                                </span>
                              )}
                              <span
                                className={`text-[10px] uppercase tracking-[0.15em] font-semibold ${theme.text}`}
                              >
                                {theme.label}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ),
              )}

              {/* Cookie status banner */}
              {!hasCookies && (
                <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-3">
                  <div className="flex items-start gap-2">
                    <Cookie className="w-3.5 h-3.5 text-amber-400/60 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-400/50 leading-relaxed">
                      Twitter/X and Instagram require login cookies. Export your
                      browser cookies as{" "}
                      <code className="text-amber-400/70 font-mono">
                        cookies.txt
                      </code>{" "}
                      and place it in the{" "}
                      <code className="text-amber-400/70 font-mono">
                        backend/
                      </code>{" "}
                      folder.
                    </p>
                  </div>
                </div>
              )}

              {/* yt-dlp version */}
              <div className="border-t border-white/[0.04] pt-4 flex justify-between items-center">
                <span className="text-white/15 text-sm">yt-dlp</span>
                <span className="text-violet-400/50 font-mono text-xs">
                  v{health.ytdlp_version}
                </span>
              </div>
              <p className="text-white/[0.08] text-[11px] tracking-wide pt-1">
                Auto-updates every 12 hours to stay ahead of platform changes.
              </p>
            </div>
          ) : (
            <div className="text-center py-10 space-y-2">
              <p className="text-white/20 text-sm">Backend not available.</p>
              <p className="text-white/10 text-xs">
                Start the API server first:{" "}
                <code className="text-violet-400/40">
                  uvicorn main:app --reload
                </code>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
