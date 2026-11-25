import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  CreditCard,
  LayoutDashboard,
  ArrowRight,
  Lock,
  Layers,
  Zap,
  QrCode,
  Webhook,
  RefreshCw,
  Copy,
  Check,
  Globe,
  CheckCircle2,
  Play,
} from "lucide-react";

const CODE_SNIPPETS = {
  node: `import { VisaPay } from "@visapay/sdk";

const visapay = new VisaPay(process.env.VISAPAY_SECRET_KEY);

const intent = await visapay.paymentIntents.create({
  amount: 249.00,
  currency: "USD",
  rails: ["card", "upi_qr", "netbanking", "wallet"],
  three_ds_mode: "risk_based",
  idempotency_key: crypto.randomUUID(),
});`,
  curl: `curl -X POST http://localhost:3001/api/v1/payments/charge \\
  -H "Content-Type: application/json" \\
  -H "Idempotency-Key: 9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d" \\
  -d '{
    "amount": 249.00,
    "currency": "USD",
    "upi_details": { "vpa": "alex@visapay" },
    "billing_details": { "name": "Alex Mercer", "email": "alex@acmecorp.io" }
  }'`,
};

const RAIL_SIMULATIONS = [
  {
    id: "card",
    label: "Cards + 3DS2",
    endpoint: "POST /api/v1/payments/charge",
    status: "201 CREATED • 82ms",
    summary: "Luhn Mod 10 verified, PCI vaulted (tok_visa_*), Risk Score 14/100, 3DS2 OTP AUTHENTICATED.",
    sampleJson: `{ "transaction_id": "txn_visa_90210a", "status": "APPROVED", "threeDsStatus": "AUTHENTICATED", "auth_code": "VISA_AUTH_902104" }`,
  },
  {
    id: "upi",
    label: "Real UPI QR",
    endpoint: "POST /api/v1/payments/upi/verify",
    status: "200 OK • 54ms",
    summary: "ISO/IEC 18004 camera-scannable QR deep link + beneficiary VPA resolution before collect.",
    sampleJson: `{ "vpa": "alex@visapay", "verified": true, "accountHolderName": "Alex Mercer", "network": "UPI Instant Rails" }`,
  },
  {
    id: "webhook",
    label: "HMAC Webhooks",
    endpoint: "GET /api/v1/merchants/webhooks",
    status: "200 DELIVERED • 36ms",
    summary: "Every charge, decline, 3DS2 challenge, and refund signs an HMAC-SHA256 delivery envelope.",
    sampleJson: `{ "header": "X-VisaPay-Signature: t=17956,v1=9f4e81...", "type": "charge.succeeded", "attempts": 1 }`,
  },
];

export const LandingPage: React.FC = () => {
  const [codeTab, setCodeTab] = useState<"node" | "curl">("node");
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeRailIdx, setActiveRailIdx] = useState(0);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(CODE_SNIPPETS[codeTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 1800);
  };

  const capabilities = [
    {
      icon: QrCode,
      title: "Real ISO/IEC 18004 UPI QR",
      description:
        "Camera-scannable dynamic NPCI UPI deep links with live beneficiary VPA verification and interactive mobile app handshake.",
    },
    {
      icon: Lock,
      title: "3D Secure 2.0 & Risk Engine",
      description:
        "Real-time fraud risk scoring triggers dynamic SCA/OTP verification challenges on high-value or flagged transactions.",
    },
    {
      icon: Layers,
      title: "5 Unified Payment Rails",
      description:
        "Cards with interactive 3D card visualizer, UPI Instant, NetBanking ACS, Digital Wallets, and FlexiCredit EMI.",
    },
    {
      icon: RefreshCw,
      title: "Full & Partial Refunds",
      description:
        "State-machine enforced refund workflows from the merchant audit drawer with automatic balance reconciliation.",
    },
    {
      icon: Webhook,
      title: "HMAC-SHA256 Webhooks",
      description:
        "Cryptographically signed event envelopes (charge.succeeded, charge.refunded) with inspectable logs and replay.",
    },
    {
      icon: Zap,
      title: "WCAG 2.0 AA & Idempotency",
      description:
        "Zero Axe-core accessibility violations, 48px touch targets, tabular chart fallbacks, and UUID retry deduplication.",
    },
  ];

  const activeSim = RAIL_SIMULATIONS[activeRailIdx];

  return (
    <div className="space-y-16 py-4 animate-fade-in max-w-7xl mx-auto">
      {/* Split Enterprise Hero */}
      <section
        aria-labelledby="hero-title"
        className="relative overflow-hidden rounded-3xl bg-slate-950 text-white p-8 sm:p-12 lg:p-14 border border-slate-800 shadow-2xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-slate-900 rounded-full text-xs font-semibold text-sky-300 border border-slate-700/80">
              <ShieldCheck className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>PCI-DSS Level 1 • WCAG 2.0 AA • Multi-Rail Core</span>
            </div>

            <h1 id="hero-title" className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.12]">
              Payment infrastructure engineered for{" "}
              <span className="text-sky-400">real-world scale &amp; universal access.</span>
            </h1>

            <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
              Accept Cards with interactive 3D visualization &amp; 3DS2 OTP, camera-scannable UPI QR
              codes, NetBanking, Digital Wallets, and EMI plans—backed by Prisma persistence,
              HMAC-SHA256 webhooks, and automated Axe-core verification.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              <Link
                to="/checkout"
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <CreditCard className="w-5 h-5" aria-hidden="true" />
                <span>Start Interactive Checkout</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>

              <Link
                to="/dashboard"
                className="inline-flex items-center space-x-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-slate-100 font-semibold rounded-xl border border-slate-700 transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              >
                <LayoutDashboard className="w-5 h-5 text-sky-400" aria-hidden="true" />
                <span>Merchant Console</span>
              </Link>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Multi-Currency FX (USD, INR, EUR, GBP)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>UUID Idempotency Guard</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>Full &amp; Partial Refunds</span>
              </div>
            </div>
          </div>

          {/* Right: Developer SDK & Telemetry Preview */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl bg-slate-900/95 border border-slate-700/90 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950 border-b border-slate-800">
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setCodeTab("node")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      codeTab === "node"
                        ? "bg-slate-800 text-sky-300"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    TypeScript SDK
                  </button>
                  <button
                    type="button"
                    onClick={() => setCodeTab("curl")}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      codeTab === "curl"
                        ? "bg-slate-800 text-sky-300"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    REST cURL
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyCode}
                  aria-label="Copy API code snippet"
                  className="inline-flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 text-[11px] sm:text-xs font-mono text-slate-300 overflow-x-auto leading-relaxed">
                <code>{CODE_SNIPPETS[codeTab]}</code>
              </pre>

              <div className="px-4 py-2.5 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  POST /api/v1/payments/charge
                </span>
                <span className="text-emerald-400 font-semibold">201 CREATED • 48ms</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Rail Explorer */}
      <section aria-label="Interactive Rail Architecture Explorer" className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Interactive Flow Preview
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 mt-0.5">
              Inspect How Each Payment Rail Clears
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {RAIL_SIMULATIONS.map((sim, idx) => (
              <button
                key={sim.id}
                type="button"
                onClick={() => setActiveRailIdx(idx)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  activeRailIdx === idx
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                }`}
              >
                {sim.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-950 text-slate-200 p-5 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-sky-400 font-bold">{activeSim.endpoint}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              {activeSim.status}
            </span>
          </div>
          <p className="text-xs text-slate-300">{activeSim.summary}</p>
          <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
            <code>{activeSim.sampleJson}</code>
          </pre>
          <div className="pt-1 flex justify-end">
            <Link
              to="/checkout"
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Try {activeSim.label} Live</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section aria-labelledby="features-title" className="space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1.5 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Complete Payments Suite
            </span>
            <h2 id="features-title" className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Built like a commercial payment processor, verified like critical software.
            </h2>
          </div>
          <Link
            to="/pay/pi_cloud_pro_2026"
            className="inline-flex items-center space-x-1.5 text-sm font-bold text-blue-600 hover:text-blue-700"
          >
            <span>Open Hosted Invoice Link</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => {
            const Icon = cap.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center">
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-slate-900">{cap.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{cap.description}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
