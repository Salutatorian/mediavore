import { useState, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Settings, Heart } from "lucide-react";
import PlanetScene from "./components/PlanetScene";
import type { PlanetSceneHandle } from "./components/PlanetScene";
import URLInput from "./components/URLInput";
import MediaLab from "./components/MediaLab";
import HealthDashboard from "./components/HealthDashboard";
import LegalPage from "./components/LegalPage";
import type { LegalPageType } from "./components/LegalPage";
import DonatePage from "./components/DonatePage";

export interface AppSettings {
  videoQuality: string;
  videoCodec: string;
  audioFormat: string;
  audioBitrate: number;
}

const DEFAULT_SETTINGS: AppSettings = {
  videoQuality: "1080p",
  videoCodec: "h264",
  audioFormat: "original",
  audioBitrate: 192,
};

export default function App() {
  const [showMediaLab, setShowMediaLab] = useState(false);
  const [showHealth, setShowHealth] = useState(false);
  const [showDonate, setShowDonate] = useState(false);
  const [legalPage, setLegalPage] = useState<LegalPageType | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [processing, setProcessing] = useState(false);
  const planetRef = useRef<PlanetSceneHandle>(null);

  const handleConsume = useCallback(() => {
    planetRef.current?.consumeLink();
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white relative overflow-hidden flex flex-col">
      <PlanetScene ref={planetRef} processing={processing} />

      {/* Center — logo + oasis bar as one unit */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 md:px-6">
        <div className="w-full max-w-xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-8 select-none"
          >
            <h1
              className="text-5xl md:text-6xl font-display font-bold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #fff 30%, #a78bfa 70%, #7c3aed 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 0 30px rgba(139,92,246,0.25))",
              }}
            >
              MEDIAVORE
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-white/15 text-[11px] tracking-[0.35em] uppercase font-mono mt-3"
            >
              Feed it a link
            </motion.p>
          </motion.div>

          {/* Oasis bar */}
          <URLInput
            settings={settings}
            onProcessingChange={setProcessing}
            onConsume={handleConsume}
          />
        </div>
      </main>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="relative z-10 flex flex-col items-center gap-4 pb-6"
      >
        {/* Icon row */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowHealth(true)}
            className="p-3 rounded-xl text-white/15 hover:text-violet-400 hover:bg-white/[0.03] transition-all duration-300"
            title="System Vitals"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
          </button>
          <button
            onClick={() => setShowMediaLab(true)}
            className="p-3 rounded-xl text-white/15 hover:text-violet-400 hover:bg-white/[0.03] transition-all duration-300"
            title="Control Panel"
          >
            <Settings className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowDonate(true)}
            className="p-3 rounded-xl text-white/15 hover:text-pink-400 hover:bg-white/[0.03] transition-all duration-300"
            title="Donate"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Legal links */}
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {(
            [
              ["about", "About"],
              ["terms", "Terms"],
              ["privacy", "Privacy"],
              ["dmca", "DMCA"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setLegalPage(key)}
              className="px-2.5 py-1 text-[11px] text-white/[0.12] hover:text-white/30 transition-colors font-mono tracking-wide"
            >
              {label}
            </button>
          ))}
        </div>
      </motion.footer>

      {/* Overlays */}
      <AnimatePresence>
        {showMediaLab && (
          <MediaLab
            settings={settings}
            onSettingsChange={setSettings}
            onClose={() => setShowMediaLab(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showHealth && (
          <HealthDashboard onClose={() => setShowHealth(false)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {legalPage && (
          <LegalPage page={legalPage} onClose={() => setLegalPage(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDonate && (
          <DonatePage onClose={() => setShowDonate(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
