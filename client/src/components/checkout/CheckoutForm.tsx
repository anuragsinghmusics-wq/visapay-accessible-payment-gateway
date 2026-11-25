import React, { useState, useEffect } from "react";
import { AccessibleInput } from "../ui/AccessibleInput";
import { AccessibleButton } from "../ui/AccessibleButton";
import { CardInput } from "./CardInput";
import { CardVisualizer } from "./CardVisualizer";
import { UpiInput } from "./UpiInput";
import { ThreeDSModal } from "./ThreeDSModal";
import { PaymentProcessingOverlay } from "./PaymentProcessingOverlay";
import { SANDBOX_EVENT_NAME, SandboxScenarioEvent } from "../layout/SandboxDrawer";
import {
  Lock,
  CreditCard,
  User,
  Mail,
  MapPin,
  ShieldCheck,
  Smartphone,
  Landmark,
  Wallet,
  CalendarClock,
  HelpCircle,
  CheckCircle2,
} from "lucide-react";
import { CardNetwork, SUPPORTED_BANKS } from "@visapay/shared";
import { PaymentApiClient, PaymentReceiptData, ChargePayload } from "../../services/paymentApi";
import { useAnnouncer } from "../ui/LiveAnnouncer";

export interface CheckoutFormProps {
  amount: number;
  currency?: string;
  paymentIntentId?: string;
  onSuccess: (receipt: PaymentReceiptData) => void;
  onDecline: (receipt: PaymentReceiptData) => void;
  onStepChange?: (step: 1 | 2 | 3 | 4) => void;
}

type PaymentRailTab = "CARD" | "UPI" | "NETBANKING" | "WALLET" | "EMI";

const SAVED_CARD_TOKEN = "tok_visa_4242_vaulted_demo";

const BANK_COLORS: Record<string, string> = {
  HDFC: "bg-blue-900 text-white",
  ICICI: "bg-orange-600 text-white",
  SBI: "bg-sky-600 text-white",
  AXIS: "bg-rose-800 text-white",
  CHASE: "bg-blue-700 text-white",
  CITI: "bg-indigo-700 text-white",
};

export const CheckoutForm: React.FC<CheckoutFormProps> = ({
  amount,
  currency = "USD",
  paymentIntentId,
  onSuccess,
  onDecline,
  onStepChange,
}) => {
  const { announce } = useAnnouncer();

  const [paymentRail, setPaymentRail] = useState<PaymentRailTab>("CARD");

  // Billing Details
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [postalCode, setPostalCode] = useState("");

  // Card State
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>("unknown");
  const [isLuhnValid, setIsLuhnValid] = useState(false);
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [isCvvFocused, setIsCvvFocused] = useState(false);

  // UPI State
  const [upiVpa, setUpiVpa] = useState("qr_scan@visapay");
  const [isUpiValid, setIsUpiValid] = useState(true);

  // NetBanking / Wallet / EMI State
  const [selectedBank, setSelectedBank] = useState<string>("HDFC");
  const [selectedWallet, setSelectedWallet] = useState<"apple_pay" | "google_pay" | "visapay_wallet">("apple_pay");
  const [selectedEmiTenure, setSelectedEmiTenure] = useState<3 | 6 | 9 | 12>(3);

  // 3D Secure Modal State
  const [threeDsState, setThreeDsState] = useState<{
    isOpen: boolean;
    riskScore: number;
    network: string;
    last4: string;
    pendingPayload: ChargePayload | null;
  }>({
    isOpen: false,
    riskScore: 0,
    network: "VisaNet",
    last4: "4242",
    pendingPayload: null,
  });

  // UI Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (name.trim().length >= 2 && email.includes("@")) {
      onStepChange?.(2);
    }
  }, [name, email, onStepChange]);

  useEffect(() => {
    const handler = (ev: Event) => {
      const detail = (ev as CustomEvent<SandboxScenarioEvent>).detail;
      if (!detail?.type) return;

      setName("Alex Mercer");
      setEmail("alex.mercer@acmecorp.io");
      setPostalCode("94107");
      setUseSavedCard(false);
      setErrors({});
      setGeneralError(null);

      if (detail.type.startsWith("UPI")) {
        setPaymentRail("UPI");
        const vpa = detail.type === "UPI_APPROVED" ? "alex@visapay" : "declined@visapay";
        setUpiVpa(vpa);
        setIsUpiValid(true);
      } else {
        setPaymentRail("CARD");
        setExpMonth("12");
        setExpYear("2029");
        setCvv("842");
        setCardNetwork("visa");
        setIsLuhnValid(true);

        if (detail.type === "APPROVED") setCardNumber("4242 4242 4242 4242");
        if (detail.type === "3DS_CHALLENGE") setCardNumber("4111 1111 1111 3333");
        if (detail.type === "DECLINE_FUNDS") setCardNumber("4111 1111 1115 0002");
        if (detail.type === "DECLINE_FRAUD") setCardNumber("4111 1111 1113 0004");
      }
      onStepChange?.(2);
      announce("Sandbox scenario loaded into checkout form.", "polite");
    };

    window.addEventListener(SANDBOX_EVENT_NAME, handler);
    return () => window.removeEventListener(SANDBOX_EVENT_NAME, handler);
  }, [announce, onStepChange]);

  const validateForm = (skipUpiInputCheck = false): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = "Full name is required (minimum 2 characters).";
    }

    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      errs.email = "Please enter a valid email address.";
    }

    if (!postalCode.trim() || postalCode.trim().length < 3) {
      errs.postalCode = "Valid postal or ZIP code required.";
    }

    if (paymentRail === "CARD" && !useSavedCard) {
      const cleanCard = cardNumber.replace(/\D/g, "");
      if (!cleanCard || cleanCard.length < 13) {
        errs.cardNumber = "Please enter a valid card number.";
      } else if (!isLuhnValid) {
        errs.cardNumber = "Card number failed Luhn checksum validation.";
      }

      if (!expMonth || !/^(0[1-9]|1[0-2])$/.test(expMonth)) {
        errs.expMonth = "MM (01-12)";
      }

      if (!expYear || !/^(20[2-9][0-9]|[2-9][0-9])$/.test(expYear)) {
        errs.expYear = "YY or YYYY";
      }

      const expectedCvvLength = cardNetwork === "amex" ? 4 : 3;
      if (!cvv || cvv.length !== expectedCvvLength) {
        errs.cvv = `${expectedCvvLength} digits`;
      }
    }

    if (paymentRail === "UPI" && !skipUpiInputCheck) {
      if (!upiVpa || !isUpiValid) {
        errs.upiVpa = "Please enter a valid UPI VPA (e.g. alex@visapay).";
      }
    }

    setErrors(errs);

    if (Object.keys(errs).length > 0) {
      const firstError = Object.values(errs)[0];
      announce(`Validation error: ${firstError}`, "assertive");
      return false;
    }

    return true;
  };

  const buildPayload = (threeDsVerified = false): ChargePayload => {
    const payload: ChargePayload = {
      amount,
      currency,
      payment_intent_id: paymentIntentId,
      three_ds_verified: threeDsVerified,
      billing_details: {
        name: name.trim(),
        email: email.trim(),
        postalCode: postalCode.trim(),
      },
    };

    if (paymentRail === "CARD") {
      if (useSavedCard) {
        payload.payment_token = SAVED_CARD_TOKEN;
      } else {
        payload.card_details = {
          cardNumber: cardNumber.replace(/\D/g, ""),
          expMonth: expMonth.padStart(2, "0"),
          expYear: expYear.length === 2 ? `20${expYear}` : expYear,
          cvv,
          cardholderName: name.trim(),
        };
      }
    } else if (paymentRail === "UPI") {
      payload.upi_details = { vpa: upiVpa.trim().toLowerCase() };
    } else if (paymentRail === "NETBANKING") {
      payload.netbanking_details = { bankCode: selectedBank };
    } else if (paymentRail === "WALLET") {
      payload.wallet_details = { provider: selectedWallet, walletAccountEmail: email.trim() };
    } else if (paymentRail === "EMI") {
      payload.emi_details = { tenureMonths: selectedEmiTenure };
    }

    return payload;
  };

  const executeCharge = async (payload: ChargePayload) => {
    setIsSubmitting(true);
    setGeneralError(null);
    onStepChange?.(3);
    announce("Authorizing payment with network processor...", "polite");

    try {
      // Run API call alongside minimum 900ms visual pipeline progression for clear feedback
      const [res] = await Promise.all([
        PaymentApiClient.charge(payload),
        new Promise((resolve) => setTimeout(resolve, 920)),
      ]);

      if (res.requires_action || res.status === "REQUIRES_ACTION") {
        announce("3D Secure 2.0 OTP verification required to authorize this transaction.", "assertive");
        setThreeDsState({
          isOpen: true,
          riskScore: res.data?.riskScore || 44,
          network: res.network || "VisaNet",
          last4: res.data?.last4 || "4242",
          pendingPayload: payload,
        });
        setIsSubmitting(false);
        return;
      }

      const receiptData: PaymentReceiptData = {
        transactionId: res.transaction_id || res.data?.transactionId || "txn_unknown",
        status: res.status,
        paymentRail: res.data?.paymentRail || paymentRail.toLowerCase(),
        network: res.network || res.data?.network || paymentRail,
        authCode: res.auth_code || res.data?.authCode,
        amount,
        currency,
        last4: res.data?.last4 || cardNumber.slice(-4) || "4242",
        timestamp: res.timestamp || res.data?.timestamp || new Date().toISOString(),
        customerName: name.trim() || "Express Customer",
        customerEmail: email.trim() || "customer@visapay.demo",
        threeDsStatus: res.data?.threeDsStatus,
        riskScore: res.data?.riskScore,
        latencyMs: res.data?.latencyMs,
        failureReason: res.data?.failureReason,
      };

      onStepChange?.(4);
      if (res.status === "APPROVED") {
        announce("Payment approved. Generating official transaction receipt.", "polite");
        onSuccess(receiptData);
      } else {
        announce(`Payment declined: ${receiptData.failureReason || "Transaction declined."}`, "assertive");
        onDecline(receiptData);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Network error processing payment.";
      setGeneralError(message);
      onStepChange?.(2);
      announce(`Transaction error: ${message}`, "assertive");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    await executeCharge(buildPayload(false));
  };

  const handleQrQuickPay = async (overrideVpa?: string) => {
    if (!name.trim()) setName("QR Express Customer");
    if (!email.trim()) setEmail("customer@visapay.demo");
    if (!postalCode.trim()) setPostalCode("400001");

    const payload: ChargePayload = {
      amount,
      currency,
      payment_intent_id: paymentIntentId,
      upi_details: { vpa: overrideVpa || "qr_scan@visapay" },
      billing_details: {
        name: name.trim() || "QR Express Customer",
        email: email.trim() || "customer@visapay.demo",
        postalCode: postalCode.trim() || "400001",
      },
    };
    await executeCharge(payload);
  };

  const railTabs: Array<{ id: PaymentRailTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "CARD", label: "Card", icon: CreditCard },
    { id: "UPI", label: "UPI / QR", icon: Smartphone },
    { id: "NETBANKING", label: "NetBanking", icon: Landmark },
    { id: "WALLET", label: "Wallets", icon: Wallet },
    { id: "EMI", label: "EMI", icon: CalendarClock },
  ];

  const calculateMonthlyEmi = (months: number, rate: number) => {
    if (rate === 0) return amount / months;
    const r = rate / 12 / 100;
    return (amount * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 text-slate-900"
        aria-label="Accessible Payment Checkout Form"
      >
        {generalError && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Section 1: Customer Information */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-bold text-slate-600 flex items-center gap-2 pb-2 border-b border-slate-100 w-full uppercase tracking-wider">
            <User className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>1. Customer &amp; Billing Information</span>
          </legend>

          <div className="space-y-4 pt-1">
            <AccessibleInput
              id="checkout-name"
              label="Full Name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              placeholder="Alex Mercer"
              autoComplete="name"
              required
              leftIcon={<User className="w-4 h-4 text-slate-400" />}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <AccessibleInput
                id="checkout-email"
                label="Email Receipt Destination"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={errors.email}
                placeholder="alex@acmecorp.io"
                autoComplete="email"
                required
                leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
              />

              <AccessibleInput
                id="checkout-postal-code"
                label="Postal / ZIP Code"
                type="text"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                error={errors.postalCode}
                placeholder="94107"
                autoComplete="postal-code"
                required
                leftIcon={<MapPin className="w-4 h-4 text-slate-400" />}
              />
            </div>
          </div>
        </fieldset>

        {/* Section 2: Payment Rail Switcher */}
        <fieldset className="space-y-4">
          <legend className="text-xs font-bold text-slate-600 flex items-center justify-between pb-2 border-b border-slate-100 w-full uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span>2. Select Payment Rail</span>
            </span>
            <span className="font-normal normal-case text-slate-500">256-Bit TLS Encrypted</span>
          </legend>

          {/* 5-Rail Tab Bar */}
          <div
            role="tablist"
            aria-label="Payment method rails"
            className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 p-1.5 bg-slate-100 rounded-2xl border border-slate-200"
          >
            {railTabs.map((tab) => {
              const Icon = tab.icon;
              const isSelected = paymentRail === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setPaymentRail(tab.id)}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-white text-slate-950 shadow-sm border border-slate-300/80 ring-2 ring-blue-600/15"
                      : "text-slate-600 hover:text-slate-950 hover:bg-white/50"
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600`}
                >
                  <Icon className={`w-4 h-4 ${isSelected ? "text-blue-600" : "text-slate-500"}`} aria-hidden="true" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Rail 1: Cards + 3D Visualizer + Saved Card Token */}
          {paymentRail === "CARD" && (
            <div className="space-y-5 pt-2 animate-fade-in">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <label className="flex items-center space-x-2.5 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={useSavedCard}
                    onChange={(e) => setUseSavedCard(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span>
                    Pay with vaulted Visa ending in <strong className="font-mono">•••• 4242</strong>
                  </span>
                </label>
                <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Saved Token
                </span>
              </div>

              {!useSavedCard && (
                <>
                  <CardVisualizer
                    cardNumber={cardNumber}
                    cardholderName={name}
                    expMonth={expMonth}
                    expYear={expYear}
                    cvv={cvv}
                    network={cardNetwork}
                    isFlipped={isCvvFocused}
                  />

                  <CardInput
                    id="checkout-card-number"
                    value={cardNumber}
                    onChange={(val, net, valid) => {
                      setCardNumber(val);
                      setCardNetwork(net);
                      setIsLuhnValid(valid);
                      if (errors.cardNumber) {
                        setErrors((prev) => ({ ...prev, cardNumber: "" }));
                      }
                    }}
                    error={errors.cardNumber}
                    required
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <AccessibleInput
                      id="checkout-exp-month"
                      label="Month (MM)"
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      value={expMonth}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        setExpMonth(val);
                        if (val.length === 2) {
                          document.getElementById("checkout-exp-year")?.focus();
                        }
                      }}
                      error={errors.expMonth}
                      placeholder="12"
                      autoComplete="cc-exp-month"
                      required
                    />

                    <AccessibleInput
                      id="checkout-exp-year"
                      label="Year (YY)"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value.replace(/\D/g, ""))}
                      error={errors.expYear}
                      placeholder="29"
                      autoComplete="cc-exp-year"
                      required
                    />

                    <AccessibleInput
                      id="checkout-cvv"
                      label={cardNetwork === "amex" ? "CVV (4 digits)" : "CVV (3 digits)"}
                      type="password"
                      inputMode="numeric"
                      maxLength={cardNetwork === "amex" ? 4 : 3}
                      value={cvv}
                      onFocus={() => setIsCvvFocused(true)}
                      onBlur={() => setIsCvvFocused(false)}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                      error={errors.cvv}
                      placeholder="•••"
                      autoComplete="cc-csc"
                      required
                      rightIcon={
                        <span
                          title="Card Verification Value on back of card"
                          className="text-slate-400 hover:text-slate-600 cursor-help"
                        >
                          <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      }
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Rail 2: Real ISO/IEC 18004 QR & VPA Verify */}
          {paymentRail === "UPI" && (
            <div className="pt-2 animate-fade-in">
              <UpiInput
                vpa={upiVpa}
                onChange={(val, valid) => {
                  setUpiVpa(val);
                  setIsUpiValid(valid);
                  if (errors.upiVpa) {
                    setErrors((prev) => ({ ...prev, upiVpa: "" }));
                  }
                }}
                error={errors.upiVpa}
                amount={amount}
                currency={currency}
                onQuickApproveQr={handleQrQuickPay}
              />
            </div>
          )}

          {/* Rail 3: NetBanking */}
          {paymentRail === "NETBANKING" && (
            <div className="space-y-3 pt-2 animate-fade-in" role="radiogroup" aria-label="Select Bank">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {SUPPORTED_BANKS.map((bank) => {
                  const active = selectedBank === bank.code;
                  return (
                    <button
                      key={bank.code}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setSelectedBank(bank.code)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        active
                          ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-xs"
                          : "border-slate-200 hover:border-slate-300 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                            BANK_COLORS[bank.code] || "bg-slate-800 text-white"
                          }`}
                        >
                          {bank.code}
                        </span>
                        {active && <CheckCircle2 className="w-4 h-4 text-blue-600" aria-hidden="true" />}
                      </div>
                      <span className="block text-xs font-semibold text-slate-800 mt-2 truncate">
                        {bank.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-slate-500">
                Routes via encrypted ACS Clearing Switch for instant bank debit confirmation.
              </p>
            </div>
          )}

          {/* Rail 4: Digital Wallets */}
          {paymentRail === "WALLET" && (
            <div className="space-y-3 pt-2 animate-fade-in" role="radiogroup" aria-label="Select Digital Wallet">
              {[
                {
                  id: "apple_pay" as const,
                  name: "Apple Pay",
                  badge: " Pay",
                  badgeClass: "bg-black text-white",
                  desc: "Biometric Touch ID / Face ID express token",
                },
                {
                  id: "google_pay" as const,
                  name: "Google Pay",
                  badge: "G Pay",
                  badgeClass: "bg-blue-600 text-white",
                  desc: "Saved Google Wallet encrypted credentials",
                },
                {
                  id: "visapay_wallet" as const,
                  name: "VisaPay One-Click Wallet",
                  badge: "VPay",
                  badgeClass: "bg-indigo-700 text-white",
                  desc: "Instant stored-value ledger balance",
                },
              ].map((wal) => {
                const active = selectedWallet === wal.id;
                return (
                  <button
                    key={wal.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedWallet(wal.id)}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all ${
                      active
                        ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-extrabold ${wal.badgeClass}`}>
                        {wal.badge}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{wal.name}</div>
                        <div className="text-xs text-slate-500">{wal.desc}</div>
                      </div>
                    </div>
                    {active && <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Rail 5: EMI / Pay Later */}
          {paymentRail === "EMI" && (
            <div className="space-y-3 pt-2 animate-fade-in" role="radiogroup" aria-label="Select EMI Installment Plan">
              {[
                { months: 3 as const, rate: 0, badge: "No-Cost EMI" },
                { months: 6 as const, rate: 13.5, badge: "13.5% p.a." },
                { months: 9 as const, rate: 13.5, badge: "13.5% p.a." },
                { months: 12 as const, rate: 14.0, badge: "14.0% p.a." },
              ].map((plan) => {
                const active = selectedEmiTenure === plan.months;
                const monthly = calculateMonthlyEmi(plan.months, plan.rate);
                return (
                  <button
                    key={plan.months}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setSelectedEmiTenure(plan.months)}
                    className={`w-full p-4 rounded-2xl border flex items-center justify-between text-left transition-all ${
                      active
                        ? "border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20 shadow-xs"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {plan.months} Monthly Installments{" "}
                        <span className="ml-1.5 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {plan.badge}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Total payable: {(monthly * plan.months).toFixed(2)} {currency}
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <span className="text-base font-extrabold text-slate-900">
                        {monthly.toFixed(2)} {currency}
                      </span>
                      <span className="block text-[11px] text-slate-500">/month</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>

        {/* Submit Button */}
        <div className="space-y-4 pt-2">
          <AccessibleButton
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            loadingText="Authorizing Transaction..."
            leftIcon={<Lock className="w-4 h-4" />}
            className="w-full text-base font-bold shadow-md hover:shadow-lg transition-all"
          >
            Pay {amount.toFixed(2)} {currency}
          </AccessibleButton>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              PCI-DSS Level 1
            </span>
            <span className="text-slate-300">•</span>
            <span>3D Secure 2.0 SCA</span>
            <span className="text-slate-300">•</span>
            <span>WCAG 2.0 AA Compliant</span>
          </div>
        </div>
      </form>

      {/* Live 4-Stage Gateway Authorization Pipeline */}
      <PaymentProcessingOverlay isOpen={isSubmitting} railLabel={paymentRail} />

      {/* 3D Secure 2.0 Challenge Modal */}
      <ThreeDSModal
        isOpen={threeDsState.isOpen}
        amount={amount}
        currency={currency}
        cardLast4={threeDsState.last4}
        network={threeDsState.network}
        riskScore={threeDsState.riskScore}
        onCancel={() => {
          onStepChange?.(2);
          setThreeDsState((s) => ({ ...s, isOpen: false, pendingPayload: null }));
        }}
        onAuthenticated={() => {
          const pending = threeDsState.pendingPayload;
          setThreeDsState((s) => ({ ...s, isOpen: false, pendingPayload: null }));
          if (pending) {
            executeCharge({ ...pending, three_ds_verified: true });
          }
        }}
      />
    </>
  );
};
