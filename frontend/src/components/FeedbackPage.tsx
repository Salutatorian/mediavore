import { useState } from "react";
import { motion } from "framer-motion";
import { X, ArrowLeft, MessageSquarePlus, Send, CheckCircle } from "lucide-react";

type FeedbackType = "bug" | "feature";

export default function FeedbackPage({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const canSubmit = message.trim().length >= 5 && status === "idle";

  async function handleSubmit() {
    if (!canSubmit) return;
    setStatus("sending");
    setErrorMsg("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || `Error ${res.status}`);
      }
      setStatus("sent");
    } catch (e: unknown) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong.");
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="fixed inset-x-4 top-[12%] mx-auto max-w-md glass rounded-2xl z-50 overflow-hidden"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-violet-500/10">
                  <MessageSquarePlus className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-2xl font-display tracking-wider">FEEDBACK</h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {status === "sent" ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <p className="text-white/60 text-sm text-center">
                Thanks! Your feedback has been submitted.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-white/[0.06] text-white/50 hover:text-white/80 hover:bg-white/[0.1] transition-all text-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-[13px] text-white/35 leading-relaxed mb-5">
                Found a bug or have an idea? Let us know — no account needed.
              </p>

              {/* Type toggle */}
              <div className="flex gap-2 mb-5">
                {(["bug", "feature"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      type === t
                        ? "bg-violet-500/15 border border-violet-500/30 text-violet-300"
                        : "bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/50"
                    }`}
                  >
                    {t === "bug" ? "Bug Report" : "Feature Request"}
                  </button>
                ))}
              </div>

              {/* Message */}
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  type === "bug"
                    ? "Describe what went wrong..."
                    : "Describe your idea..."
                }
                maxLength={2000}
                rows={5}
                className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-white/70 placeholder-white/15 resize-none focus:outline-none focus:border-violet-500/30 transition-colors"
              />

              <div className="flex items-center justify-between mt-2 mb-5">
                <span className="text-[11px] text-white/[0.12] font-mono">
                  {message.length}/2000
                </span>
                {errorMsg && (
                  <span className="text-[12px] text-red-400/70">{errorMsg}</span>
                )}
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  canSubmit
                    ? "bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25"
                    : "bg-white/[0.02] border border-white/[0.04] text-white/15 cursor-not-allowed"
                }`}
              >
                {status === "sending" ? (
                  <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                {status === "sending" ? "Sending..." : "Submit"}
              </button>

              <p className="text-[11px] text-white/[0.12] text-center font-mono tracking-wide mt-4">
                Rate limited to one submission per minute.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
