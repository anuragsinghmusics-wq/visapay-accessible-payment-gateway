import React, { useEffect, useState } from "react";
import { ShieldCheck, Lock, Cpu, Webhook, CheckCircle2, Loader2 } from "lucide-react";

export interface PaymentProcessingOverlayProps {
  isOpen: boolean;
  railLabel: string;
}

const STAGES = [
  { icon: Lock, label: "Tokenizing sensitive credentials in PCI-DSS Level 1 Vault" },
  { icon: ShieldCheck, label: "Scoring transaction velocity & 3D Secure 2.0 policy" },
  { icon: Cpu, label: "Clearing authorization with settlement rail switch" },
  { icon: Webhook, label: "Signing HMAC-SHA256 webhook & committing ledger" },
];

/**
 * Interactive 4-stage authorization pipeline modal.
 * Keeps users engaged with real-time step progression during clearing.
 */
export const PaymentProcessingOverlay: React.FC<PaymentProcessingOverlayProps> = ({
  isOpen,
  railLabel,
}) => {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setActiveStage(0);
      return;
    }
    const timers = [
      setTimeout(() => setActiveStage(1), 220),
      setTimeout(() => setActiveStage(2), 480),
      setTimeout(() => setActiveStage(3), 750),
    ];
    return () => timers.forEach(clearTimeout);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Authorizing payment transaction"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-7 space-y-6 animate-scale-in">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              Securing Your Payment
            </h2>
            <p className="text-xs text-slate-500">
              Routing via <strong className="text-slate-800">{railLabel}</strong>
            </p>
          </div>
        </div>

        <ol className="space-y-3">
          {STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const completed = idx < activeStage;
            const current = idx === activeStage;
            return (
              <li
                key={idx}
                className={`flex items-center space-x-3 p-3 rounded-xl border text-xs transition-all duration-200 ${
                  completed
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-900"
                    : current
                    ? "bg-blue-50 border-blue-300 text-blue-950 font-semibold shadow-xs"
                    : "bg-slate-50 border-slate-200/60 text-slate-400"
                }`}
              >
                <div className="shrink-0">
                  {completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  ) : current ? (
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" aria-hidden="true" />
                  ) : (
                    <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
                  )}
                </div>
                <span>{stage.label}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};
