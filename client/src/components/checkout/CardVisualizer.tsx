import React from "react";
import { CardNetwork } from "@visapay/shared";
import { Wifi } from "lucide-react";

export interface CardVisualizerProps {
  cardNumber: string;
  cardholderName: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  network: CardNetwork;
  isFlipped: boolean;
}

const NETWORK_THEMES: Record<CardNetwork, { bg: string; label: string }> = {
  visa: {
    bg: "from-slate-900 via-blue-950 to-indigo-900",
    label: "VISA",
  },
  mastercard: {
    bg: "from-zinc-900 via-neutral-900 to-rose-950",
    label: "Mastercard",
  },
  amex: {
    bg: "from-slate-800 via-cyan-950 to-teal-900",
    label: "AMEX",
  },
  discover: {
    bg: "from-stone-900 via-amber-950 to-orange-900",
    label: "DISCOVER",
  },
  unknown: {
    bg: "from-slate-900 via-slate-800 to-slate-900",
    label: "CARD",
  },
};

/**
 * Interactive 3D Physical Card Preview (Decorative mirror of accessible form inputs).
 * Marked aria-hidden="true" so assistive technologies read the accessible form fields directly.
 */
export const CardVisualizer: React.FC<CardVisualizerProps> = ({
  cardNumber,
  cardholderName,
  expMonth,
  expYear,
  cvv,
  network,
  isFlipped,
}) => {
  const theme = NETWORK_THEMES[network] || NETWORK_THEMES.unknown;

  const formattedDisplayNumber = (() => {
    const clean = cardNumber.replace(/\s+/g, "");
    if (!clean) return "••••  ••••  ••••  ••••";
    const padded = clean.padEnd(16, "•").slice(0, 16);
    return padded.replace(/(.{4})/g, "$1  ").trim();
  })();

  const formattedExpiry = `${(expMonth || "MM").padStart(2, "0")}/${
    expYear ? expYear.slice(-2) : "YY"
  }`;

  return (
    <div aria-hidden="true" className="w-full max-w-[340px] mx-auto [perspective:1000px]">
      <div
        className={`relative h-48 w-full transition-transform duration-500 [transform-style:preserve-3d] ${
          isFlipped ? "[transform:rotateY(180deg)]" : ""
        }`}
      >
        {/* Front Side */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${theme.bg} text-white p-5 shadow-xl border border-white/15 flex flex-col justify-between [backface-visibility:hidden] overflow-hidden`}
        >
          {/* Top Row: EMV Chip + Contactless + Network Badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              {/* Metallic EMV Chip */}
              <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-yellow-300 to-amber-500 border border-amber-100/50 relative overflow-hidden">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-900/30" />
                <div className="absolute inset-y-0 left-1/3 w-[1px] bg-amber-900/30" />
                <div className="absolute inset-y-0 right-1/3 w-[1px] bg-amber-900/30" />
              </div>
              <Wifi className="w-4 h-4 rotate-90 text-white/70" />
            </div>

            {network === "mastercard" ? (
              <div className="flex items-center">
                <span className="w-6 h-6 rounded-full bg-rose-500/90" />
                <span className="w-6 h-6 rounded-full bg-amber-400/90 -ml-2.5" />
              </div>
            ) : (
              <span className="text-sm font-black tracking-widest italic text-white/95">
                {theme.label}
              </span>
            )}
          </div>

          {/* Card Number */}
          <div className="font-mono text-base sm:text-lg tracking-[0.14em] text-white/95 drop-shadow">
            {formattedDisplayNumber}
          </div>

          {/* Bottom Row: Cardholder & Expiry */}
          <div className="flex items-end justify-between text-xs">
            <div className="space-y-0.5 max-w-[65%]">
              <span className="block text-[9px] uppercase tracking-widest text-white/60">
                Card Holder
              </span>
              <span className="block font-semibold tracking-wider uppercase truncate">
                {cardholderName.trim() || "FULL NAME"}
              </span>
            </div>
            <div className="space-y-0.5 text-right">
              <span className="block text-[9px] uppercase tracking-widest text-white/60">
                Expires
              </span>
              <span className="block font-mono font-semibold">{formattedExpiry}</span>
            </div>
          </div>
        </div>

        {/* Back Side (Magnetic Stripe + CVV) */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${theme.bg} text-white py-5 shadow-xl border border-white/15 flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)]`}
        >
          {/* Magnetic Stripe */}
          <div className="w-full h-10 bg-zinc-950/95 border-y border-white/10" />

          {/* Signature & CVV Strip */}
          <div className="px-5 space-y-2">
            <div className="flex items-center justify-between bg-slate-100 rounded-md px-3 py-2 text-slate-900">
              <span className="text-[10px] font-serif italic text-slate-500 truncate max-w-[160px]">
                {cardholderName.trim() || "Authorized Signature"}
              </span>
              <div className="flex items-center space-x-1.5 bg-white px-2.5 py-0.5 rounded border border-slate-300">
                <span className="text-[9px] font-bold text-slate-400">CVV</span>
                <span className="font-mono text-xs font-extrabold tracking-widest text-slate-900">
                  {cvv || "•••"}
                </span>
              </div>
            </div>
            <p className="text-[9px] text-white/60 leading-tight">
              Protected by VisaPay PCI-DSS Level 1 tokenization & 3D Secure 2.0 SCA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
