import React, { useState } from "react";
import { Terminal, X, Copy, Check, CreditCard, Smartphone, Key } from "lucide-react";

export interface SandboxScenarioEvent {
  type: "APPROVED" | "3DS_CHALLENGE" | "DECLINE_FUNDS" | "DECLINE_FRAUD" | "UPI_APPROVED" | "UPI_DECLINE";
}

export const SANDBOX_EVENT_NAME = "visapay:sandbox-scenario";

export const SandboxDrawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyValue = (id: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const dispatchScenario = (type: SandboxScenarioEvent["type"]) => {
    window.dispatchEvent(new CustomEvent(SANDBOX_EVENT_NAME, { detail: { type } }));
    setIsOpen(false);
  };

  const testCards = [
    { id: "c-ok", label: "Visa Approved", number: "4242 4242 4242 4242", scenario: "APPROVED" as const, tag: "201 OK", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
    { id: "c-3ds", label: "3DS2 OTP Challenge", number: "4111 1111 1111 3333", scenario: "3DS_CHALLENGE" as const, tag: "OTP: 123456", color: "text-blue-700 bg-blue-50 border-blue-200" },
    { id: "c-funds", label: "Insufficient Funds", number: "4111 1111 1115 0002", scenario: "DECLINE_FUNDS" as const, tag: "Code 05", color: "text-amber-700 bg-amber-50 border-amber-200" },
    { id: "c-fraud", label: "Fraud Risk Block", number: "4111 1111 1113 0004", scenario: "DECLINE_FRAUD" as const, tag: "Code 59", color: "text-rose-700 bg-rose-50 border-rose-200" },
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {isOpen ? (
        <aside
          aria-label="Developer Sandbox Reference Drawer"
          className="w-80 sm:w-96 bg-slate-900 text-slate-100 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-fade-in"
        >
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950 border-b border-slate-800">
            <div className="flex items-center space-x-2 text-xs font-bold tracking-wide text-sky-400">
              <Terminal className="w-4 h-4" aria-hidden="true" />
              <span>SANDBOX TEST TOOLS</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close Sandbox Drawer"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
            {/* Cards */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <CreditCard className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Test Card Numbers (Click to Auto-Fill Checkout)</span>
              </div>
              <div className="space-y-1.5">
                {testCards.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-800/80 border border-slate-700/80"
                  >
                    <button
                      type="button"
                      onClick={() => dispatchScenario(c.scenario)}
                      className="text-left flex-1 hover:text-sky-300 transition"
                    >
                      <div className="font-semibold flex items-center gap-1.5">
                        <span>{c.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border ${c.color}`}>{c.tag}</span>
                      </div>
                      <div className="font-mono text-[11px] text-slate-400">{c.number}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => copyValue(c.id, c.number.replace(/\s/g, ""))}
                      aria-label={`Copy ${c.label} card number`}
                      className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                    >
                      {copiedId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* UPI & Promo */}
            <div className="space-y-2">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                <span>UPI & Promo Codes</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => dispatchScenario("UPI_APPROVED")}
                  className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-sky-500 text-left"
                >
                  <div className="font-semibold text-emerald-400">UPI Approved</div>
                  <div className="font-mono text-[10px] text-slate-400">alex@visapay</div>
                </button>
                <button
                  type="button"
                  onClick={() => dispatchScenario("UPI_DECLINE")}
                  className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 hover:border-rose-500 text-left"
                >
                  <div className="font-semibold text-rose-400">UPI Declined</div>
                  <div className="font-mono text-[10px] text-slate-400">declined@visapay</div>
                </button>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/60 border border-slate-700 flex items-center justify-between">
                <span className="text-slate-300">
                  Promo Codes: <code className="text-amber-300 font-bold">VISAPAY20</code> • <code className="text-amber-300 font-bold">DEVFREE</code>
                </span>
              </div>
            </div>

            {/* Merchant Auth */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <div className="flex items-center space-x-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <Key className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Merchant Console Demo</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700 font-mono text-[11px] flex items-center justify-between">
                <div>
                  <div>merchant@visapay.demo</div>
                  <div className="text-slate-400">Password123</div>
                </div>
                <button
                  type="button"
                  onClick={() => copyValue("cred", "merchant@visapay.demo")}
                  aria-label="Copy demo email"
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
                >
                  {copiedId === "cred" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </aside>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Open Developer Sandbox Test Tools"
          className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-lg border border-slate-700 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
        >
          <Terminal className="w-3.5 h-3.5 text-sky-400" aria-hidden="true" />
          <span>Sandbox Tools</span>
        </button>
      )}
    </div>
  );
};
