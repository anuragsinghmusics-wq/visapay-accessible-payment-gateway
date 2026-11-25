import React, { useState, useEffect } from "react";
import { Webhook, RefreshCw, Key, Copy, Check, ShieldCheck } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useAnnouncer } from "../ui/LiveAnnouncer";

interface WebhookEventItem {
  id: string;
  eventType: string;
  transactionId?: string | null;
  payloadJson: string;
  hmacSignature: string;
  targetUrl: string;
  statusCode: number;
  deliveryStatus: string;
  attempts: number;
  latencyMs: number;
  createdAt: string;
}

export const DevelopersTab: React.FC = () => {
  const { merchant } = useAuth();
  const { announce } = useAnnouncer();
  const [events, setEvents] = useState<WebhookEventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<WebhookEventItem | null>(null);
  const [apiKey, setApiKey] = useState(merchant?.apiKey || "vpy_live_test_apikey_2026");
  const [isRotating, setIsRotating] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  const loadWebhooks = async () => {
    try {
      const res = await fetch("/api/v1/merchants/webhooks");
      const json = await res.json();
      if (res.ok) {
        const list = json.data || [];
        setEvents(list);
        if (list.length > 0 && !selectedEvent) {
          setSelectedEvent(list[0]);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadWebhooks();
  }, []);

  const handleRotateKey = async () => {
    setIsRotating(true);
    try {
      const res = await fetch("/api/v1/merchants/api-keys/rotate", { method: "POST" });
      const json = await res.json();
      if (res.ok && json.data?.apiKey) {
        setApiKey(json.data.apiKey);
        announce("Live API key rotated securely.", "polite");
      }
    } finally {
      setIsRotating(false);
    }
  };

  const handleReplay = async (id: string) => {
    const res = await fetch(`/api/v1/merchants/webhooks/${encodeURIComponent(id)}/replay`, {
      method: "POST",
    });
    const json = await res.json();
    if (res.ok) {
      announce("Webhook event re-dispatched with fresh HMAC signature.", "polite");
      setSelectedEvent(json.data);
      await loadWebhooks();
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* API Keys Panel */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Key className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">Production API Credentials</h2>
          </div>
          <p className="text-xs text-slate-500">
            Secret key used to sign checkout intents and authenticate server-side requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <code className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 font-mono text-xs text-slate-800">
            {apiKey}
          </code>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(apiKey);
              setCopiedKey(true);
              setTimeout(() => setCopiedKey(false), 1500);
            }}
            className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold inline-flex items-center gap-1"
          >
            {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedKey ? "Copied" : "Copy"}</span>
          </button>
          <button
            type="button"
            onClick={handleRotateKey}
            disabled={isRotating}
            className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? "animate-spin" : ""}`} aria-hidden="true" />
            <span>Rotate Key</span>
          </button>
        </div>
      </div>

      {/* Signed Webhook Event Log & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Webhook className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <h3 className="text-sm font-bold text-slate-900">Signed Webhook Deliveries</h3>
            </div>
            <button
              type="button"
              onClick={loadWebhooks}
              className="text-xs font-semibold text-blue-600 hover:underline"
            >
              Refresh
            </button>
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {events.map((ev) => {
              const active = selectedEvent?.id === ev.id;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedEvent(ev)}
                  className={`w-full text-left p-3 rounded-xl border transition text-xs ${
                    active
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-slate-50/60 hover:bg-slate-100 border-slate-200 text-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{ev.eventType}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        active
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      }`}
                    >
                      {ev.statusCode} OK • {ev.latencyMs}ms
                    </span>
                  </div>
                  <div className={`text-[11px] font-mono mt-1 ${active ? "text-slate-400" : "text-slate-500"}`}>
                    {ev.id} • Attempts: {ev.attempts}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payload & Signature Inspector */}
        <div className="lg:col-span-7 bg-slate-950 text-slate-200 rounded-2xl border border-slate-800 p-5 shadow-xl space-y-4">
          {selectedEvent ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-mono font-bold text-sky-400">
                    {selectedEvent.eventType}
                  </span>
                  <p className="text-[11px] text-slate-400 font-mono">
                    POST {selectedEvent.targetUrl}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleReplay(selectedEvent.id)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Replay Event</span>
                </button>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Header: X-VisaPay-Signature (HMAC-SHA256)</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] break-all text-slate-300">
                  {selectedEvent.hmacSignature}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">JSON Event Body</span>
                <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 font-mono text-[11px] overflow-x-auto max-h-64 text-slate-300">
                  <code>{selectedEvent.payloadJson}</code>
                </pre>
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-400 py-16 text-center">
              Select a webhook delivery event to inspect its HMAC signature and JSON body.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
