import { motion } from "framer-motion";
import { X, ArrowLeft, Heart, ExternalLink } from "lucide-react";

// Replace these with your real Stripe Payment Links.
// Create them at: https://dashboard.stripe.com/payment-links
const DONATION_LINKS: { amount: string; url: string }[] = [
  { amount: "$1", url: "https://buy.stripe.com/YOUR_1_LINK" },
  { amount: "$2", url: "https://buy.stripe.com/YOUR_2_LINK" },
  { amount: "$5", url: "https://buy.stripe.com/YOUR_5_LINK" },
  { amount: "$10", url: "https://buy.stripe.com/YOUR_10_LINK" },
];

export default function DonatePage({ onClose }: { onClose: () => void }) {
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
        className="fixed inset-x-4 top-[18%] mx-auto max-w-md glass rounded-2xl z-50 overflow-hidden"
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
                  <Heart className="w-5 h-5 text-violet-400" />
                </div>
                <h2 className="text-2xl font-display tracking-wider">
                  DONATE
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-white/25 hover:text-white/60 hover:bg-white/[0.04] transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Message */}
          <p className="text-[13px] text-white/35 leading-relaxed mb-6">
            Mediavore is free and always will be. If you find it useful,
            a small donation helps keep the servers running and the engine
            updated.
          </p>

          {/* Amount grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {DONATION_LINKS.map(({ amount, url }) => (
              <a
                key={amount}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center justify-center gap-2 py-4 rounded-xl
                  bg-white/[0.03] border border-white/[0.06]
                  hover:border-violet-500/30 hover:bg-violet-500/[0.06]
                  transition-all duration-200"
              >
                <span className="text-xl font-bold text-white/70 group-hover:text-violet-300 transition-colors">
                  {amount}
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-white/15 group-hover:text-violet-400/50 transition-colors" />
              </a>
            ))}
          </div>

          {/* Footer note */}
          <p className="text-[11px] text-white/[0.12] text-center font-mono tracking-wide">
            Powered by Stripe. Opens in a new tab.
          </p>
        </div>
      </motion.div>
    </>
  );
}
