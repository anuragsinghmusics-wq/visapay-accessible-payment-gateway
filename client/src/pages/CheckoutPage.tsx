import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckoutForm } from "../components/checkout/CheckoutForm";
import { OrderSummary, OrderItem } from "../components/checkout/OrderSummary";
import { PaymentConfirmation } from "../components/checkout/PaymentConfirmation";
import { PaymentApiClient, PaymentReceiptData } from "../services/paymentApi";
import { ShieldCheck, ArrowLeft, AlertCircle, Check } from "lucide-react";

export interface CheckoutPageProps {
  onBackToLanding?: () => void;
}

const PLAN_PRESETS: Array<{ label: string; tag: string; items: OrderItem[]; price: number }> = [
  {
    label: "Starter ($19)",
    tag: "Instant Auth",
    price: 19.0,
    items: [
      {
        id: "item-starter",
        name: "Acme Cloud Starter Seat",
        description: "Monthly sandbox & API gateway telemetry",
        quantity: 1,
        price: 19.0,
      },
    ],
  },
  {
    label: "Pro License ($49.99)",
    tag: "Recommended",
    price: 49.99,
    items: [
      {
        id: "item-1",
        name: "Acme Cloud Enterprise License",
        description: "Annual production API access with Section 508 telemetry",
        quantity: 1,
        price: 49.99,
      },
      {
        id: "item-2",
        name: "WCAG 2.0 Accessibility Compliance Pack",
        description: "Automated Axe-Core CI guard & live announcer suite",
        quantity: 1,
        price: 0.0,
      },
    ],
  },
  {
    label: "Enterprise ($249)",
    tag: "Triggers 3DS2 OTP",
    price: 249.0,
    items: [
      {
        id: "item-ent",
        name: "Acme Enterprise Multi-Rail Cluster",
        description: "Dedicated PCI vault + high-value 3DS2 SCA workflow",
        quantity: 1,
        price: 249.0,
      },
    ],
  },
];

const STEPS = [
  { id: 1, label: "Review Order" },
  { id: 2, label: "Payment Method" },
  { id: 3, label: "Security & Auth" },
  { id: 4, label: "Receipt" },
] as const;

export const CheckoutPage: React.FC<CheckoutPageProps> = ({ onBackToLanding }) => {
  const { intentId } = useParams<{ intentId?: string }>();
  const [items, setItems] = useState<OrderItem[]>(PLAN_PRESETS[1].items);
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(1);
  const [currency, setCurrency] = useState<string>("USD");
  const [orderAmount, setOrderAmount] = useState<number>(49.99);
  const [intentTitle, setIntentTitle] = useState<string>("Acme Cloud Commerce");
  const [intentError, setIntentError] = useState<string | null>(null);
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);
  const [receipt, setReceipt] = useState<PaymentReceiptData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!intentId) return;
    PaymentApiClient.getPaymentIntent(intentId)
      .then((intent) => {
        setCurrency(intent.currency || "USD");
        setOrderAmount(Number(intent.amount));
        setIntentTitle(intent.title || "Payment Link Invoice");
        if (intent.lineItemsJson) {
          try {
            setItems(JSON.parse(intent.lineItemsJson));
          } catch {
            // fallback
          }
        }
      })
      .catch((err: unknown) => {
        setIntentError(err instanceof Error ? err.message : "Could not load payment link.");
      });
  }, [intentId]);

  const handleSelectPreset = (idx: number) => {
    const preset = PLAN_PRESETS[idx];
    setSelectedPresetIdx(idx);
    setCurrency("USD");
    setItems(preset.items);
    setOrderAmount(preset.price);
  };

  const handlePaymentResult = (receiptData: PaymentReceiptData) => {
    setReceipt(receiptData);
    setActiveStep(4);
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Breadcrumb + Security Pill */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {onBackToLanding ? (
          <button
            onClick={onBackToLanding}
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 rounded p-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
            Back to Platform
          </button>
        ) : (
          <Link
            to="/"
            className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 rounded p-1"
          >
            <ArrowLeft className="w-4 h-4 mr-1" aria-hidden="true" />
            Return to Platform
          </Link>
        )}

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>256-Bit TLS • WCAG 2.0 AA Verified</span>
        </div>
      </div>

      {/* Live 4-Step Journey Progress Bar */}
      <nav aria-label="Checkout progress" className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STEPS.map((step) => {
            const done = activeStep > step.id;
            const current = activeStep === step.id;
            return (
              <li
                key={step.id}
                className={`flex items-center space-x-2.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                  done
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : current
                    ? "bg-slate-900 border-slate-900 text-white"
                    : "bg-slate-50 border-slate-200/70 text-slate-400"
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-extrabold shrink-0 ${
                    done
                      ? "bg-emerald-600 text-white"
                      : current
                      ? "bg-blue-500 text-white"
                      : "bg-slate-200 text-slate-600"
                  }`}
                >
                  {done ? <Check className="w-3.5 h-3.5" aria-hidden="true" /> : step.id}
                </span>
                <span>{step.label}</span>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Interactive Ticket Size Presets (Hidden for locked Payment Links) */}
      {!intentId && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-200 px-5 py-3.5 shadow-xs">
          <span className="text-xs font-bold text-slate-700">Select Product Tier to Checkout:</span>
          <div className="flex flex-wrap gap-2">
            {PLAN_PRESETS.map((p, idx) => {
              const active = selectedPresetIdx === idx;
              return (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleSelectPreset(idx)}
                  className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                    active
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <span>{p.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      active ? "bg-white/20 text-white" : "bg-white text-slate-500 border border-slate-200"
                    }`}
                  >
                    {p.tag}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {intentError && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
        >
          <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>{intentError} — Displaying standard express checkout session.</span>
        </div>
      )}

      {/* Commercial Split-Screen Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
          <OrderSummary
            items={items}
            currency={currency}
            isPaymentLink={Boolean(intentId)}
            merchantName={intentTitle}
            onCurrencyChange={setCurrency}
            onAmountChange={setOrderAmount}
            onItemsChange={setItems}
          />
        </div>

        <div className="lg:col-span-7">
          <CheckoutForm
            amount={orderAmount}
            currency={currency}
            paymentIntentId={intentId}
            onSuccess={handlePaymentResult}
            onDecline={handlePaymentResult}
            onStepChange={setActiveStep}
          />
        </div>
      </div>

      {receipt && (
        <PaymentConfirmation
          receipt={receipt}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onReset={() => {
            setReceipt(null);
            setActiveStep(1);
            setIsModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
