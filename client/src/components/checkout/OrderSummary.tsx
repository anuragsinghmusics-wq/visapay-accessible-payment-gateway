import React, { useState } from "react";
import { ShoppingBag, ShieldCheck, Tag, X, Globe, Plus, Minus } from "lucide-react";

export interface OrderItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  price: number;
}

export interface OrderSummaryProps {
  items?: OrderItem[];
  currency?: string;
  shipping?: number;
  taxRate?: number;
  isPaymentLink?: boolean;
  merchantName?: string;
  onCurrencyChange?: (currency: string) => void;
  onAmountChange?: (finalAmount: number) => void;
  onItemsChange?: (items: OrderItem[]) => void;
}

const defaultItems: OrderItem[] = [
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
];

const CURRENCY_RATES: Record<string, { symbol: string; rateFromUsd: number }> = {
  USD: { symbol: "$", rateFromUsd: 1 },
  INR: { symbol: "₹", rateFromUsd: 84.5 },
  EUR: { symbol: "€", rateFromUsd: 0.92 },
  GBP: { symbol: "£", rateFromUsd: 0.79 },
};

export const OrderSummary: React.FC<OrderSummaryProps> = ({
  items: propItems = defaultItems,
  currency = "USD",
  shipping = 0.0,
  taxRate = 0.0,
  isPaymentLink = false,
  merchantName = "Acme Cloud Commerce",
  onCurrencyChange,
  onAmountChange,
  onItemsChange,
}) => {
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discountPct: number; flatUsd: number } | null>(
    null
  );
  const [promoError, setPromoError] = useState<string | null>(null);

  const fx = CURRENCY_RATES[currency] || CURRENCY_RATES.USD;

  const baseSubtotal = propItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const discountBase = appliedPromo
    ? appliedPromo.discountPct > 0
      ? baseSubtotal * appliedPromo.discountPct
      : Math.min(baseSubtotal, appliedPromo.flatUsd)
    : 0;
  const discountedSubtotal = Math.max(0, baseSubtotal - discountBase);
  const tax = discountedSubtotal * taxRate;
  const totalInDisplayCurrency =
    currency === "USD" || isPaymentLink
      ? discountedSubtotal + shipping + tax
      : Math.round((discountedSubtotal + shipping + tax) * fx.rateFromUsd * 100) / 100;

  const formatPrice = (valInDisplay: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(valInDisplay);
  };

  const scaleToDisplay = (usdVal: number) => {
    if (currency === "USD" || isPaymentLink) return usdVal;
    return Math.round(usdVal * fx.rateFromUsd * 100) / 100;
  };

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    const code = promoCode.trim().toUpperCase();
    if (!code) return;

    let promo: { code: string; discountPct: number; flatUsd: number } | null = null;
    if (code === "VISAPAY20") {
      promo = { code, discountPct: 0.2, flatUsd: 0 };
    } else if (code === "DEVFREE") {
      promo = { code, discountPct: 0, flatUsd: 10 };
    } else {
      setPromoError("Invalid promo code. Try VISAPAY20 or DEVFREE.");
      return;
    }

    setAppliedPromo(promo);
    const newDiscount =
      promo.discountPct > 0 ? baseSubtotal * promo.discountPct : Math.min(baseSubtotal, promo.flatUsd);
    const nextTotal = scaleToDisplay(Math.max(0, baseSubtotal - newDiscount) + shipping + tax);
    onAmountChange?.(nextTotal);
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode("");
    const nextTotal = scaleToDisplay(baseSubtotal + shipping + tax);
    onAmountChange?.(nextTotal);
  };

  const handleUpdateQty = (id: string, delta: number) => {
    if (!onItemsChange || isPaymentLink) return;
    const nextItems = propItems.map((it) =>
      it.id === id ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it
    );
    onItemsChange(nextItems);
    const newSub = nextItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
    onAmountChange?.(scaleToDisplay(newSub + shipping));
  };

  return (
    <section
      aria-labelledby="order-summary-heading"
      className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-6"
    >
      {/* Merchant Brand Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {isPaymentLink ? "Hosted Payment Link" : "Checkout"}
            </p>
            <h2 id="order-summary-heading" className="text-base font-bold text-slate-900">
              {merchantName}
            </h2>
          </div>
        </div>

        {/* Currency Selector */}
        {onCurrencyChange && !isPaymentLink && (
          <div className="flex items-center space-x-1.5">
            <Globe className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <select
              value={currency}
              aria-label="Select checkout currency"
              onChange={(e) => {
                const nextCurr = e.target.value;
                onCurrencyChange(nextCurr);
                const nextFx = CURRENCY_RATES[nextCurr] || CURRENCY_RATES.USD;
                const nextAmt =
                  Math.round((discountedSubtotal + shipping + tax) * nextFx.rateFromUsd * 100) / 100;
                onAmountChange?.(nextAmt);
              }}
              className="text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              <option value="USD">USD ($)</option>
              <option value="INR">INR (₹)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </div>
        )}
      </div>

      {/* Line Items */}
      <ul className="divide-y divide-slate-100 space-y-3" role="list">
        {propItems.map((item) => (
          <li key={item.id} className="pt-3 first:pt-0 flex justify-between items-start text-sm gap-3">
            <div className="space-y-1 flex-1">
              <p className="font-semibold text-slate-900">{item.name}</p>
              <p className="text-xs text-slate-500">{item.description}</p>
              {onItemsChange && !isPaymentLink && item.price > 0 ? (
                <div className="inline-flex items-center space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(item.id, -1)}
                    aria-label={`Decrease quantity for ${item.name}`}
                    className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-mono font-semibold text-slate-700">
                    Qty {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleUpdateQty(item.id, 1)}
                    aria-label={`Increase quantity for ${item.name}`}
                    className="w-6 h-6 rounded-md border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <p className="text-xs text-slate-400">Qty: {item.quantity}</p>
              )}
            </div>
            <span className="font-semibold text-slate-900 font-mono whitespace-nowrap">
              {item.price === 0 ? "Included" : formatPrice(scaleToDisplay(item.price * item.quantity))}
            </span>
          </li>
        ))}
      </ul>

      {/* Promo Code Input */}
      {!isPaymentLink && (
        <div className="pt-2">
          {appliedPromo ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
              <span className="inline-flex items-center space-x-1.5 font-semibold text-emerald-800">
                <Tag className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Promo {appliedPromo.code} applied</span>
              </span>
              <button
                type="button"
                onClick={handleRemovePromo}
                aria-label="Remove promo code"
                className="text-emerald-700 hover:text-emerald-950 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyPromo} className="space-y-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Promo code (e.g. VISAPAY20)"
                  aria-label="Enter promotional discount code"
                  className="flex-1 text-xs rounded-xl border border-slate-200 px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition"
                >
                  Apply
                </button>
              </div>
              {promoError && <p className="text-[11px] text-rose-600 font-medium">{promoError}</p>}
            </form>
          )}
        </div>
      )}

      {/* Breakdown */}
      <div className="pt-4 border-t border-slate-100 space-y-2 text-sm text-slate-600">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span className="font-mono font-medium text-slate-800">
            {formatPrice(scaleToDisplay(baseSubtotal))}
          </span>
        </div>
        {discountBase > 0 && (
          <div className="flex justify-between text-emerald-700">
            <span>Promo Discount</span>
            <span className="font-mono font-semibold">-{formatPrice(scaleToDisplay(discountBase))}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Digital Delivery</span>
          <span className="font-medium text-emerald-600">Free</span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between">
            <span>Estimated Tax</span>
            <span className="font-mono font-medium text-slate-800">{formatPrice(scaleToDisplay(tax))}</span>
          </div>
        )}
        <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline text-base font-bold text-slate-900">
          <span>Total Due</span>
          <span className="text-2xl font-extrabold font-mono text-slate-950">
            {formatPrice(totalInDisplayCurrency)}
          </span>
        </div>
      </div>

      {/* Security Guarantee */}
      <div className="bg-slate-50 rounded-2xl p-3.5 flex items-center space-x-3 text-xs text-slate-600 border border-slate-100">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" aria-hidden="true" />
        <span>
          PCI-DSS Level 1 vaulted checkout. Card numbers are tokenized client-side before clearing.
        </span>
      </div>
    </section>
  );
};
