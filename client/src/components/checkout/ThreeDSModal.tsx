import React, { useState } from "react";
import { ShieldCheck, Lock, AlertCircle, X } from "lucide-react";
import { FocusTrap } from "../ui/FocusTrap";
import { AccessibleButton } from "../ui/AccessibleButton";
import { AccessibleInput } from "../ui/AccessibleInput";
import { PaymentApiClient } from "../../services/paymentApi";
import { useAnnouncer } from "../ui/LiveAnnouncer";

export interface ThreeDSModalProps {
  isOpen: boolean;
  amount: number;
  currency: string;
  cardLast4: string;
  network: string;
  riskScore: number;
  onCancel: () => void;
  onAuthenticated: () => void;
}

/**
 * 3D Secure 2.0 (Visa Secure / Mastercard Identity Check) ACS Challenge Modal
 * Enforces WCAG 2.1.2 / 2.4.3 modal focus containment and screen reader alerts.
 */
export const ThreeDSModal: React.FC<ThreeDSModalProps> = ({
  isOpen,
  amount,
  currency,
  cardLast4,
  network,
  riskScore,
  onCancel,
  onAuthenticated,
}) => {
  const { announce } = useAnnouncer();
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!otp || otp.length < 6) {
      setError("Enter the 6-digit One-Time Passcode (Demo OTP: 123456).");
      return;
    }

    setIsVerifying(true);
    try {
      await PaymentApiClient.verifyThreeDsOtp(otp);
      announce("3D Secure 2.0 authentication succeeded. Finalizing payment...", "polite");
      onAuthenticated();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invalid OTP.";
      setError(msg);
      announce(`Authentication failed: ${msg}`, "assertive");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <FocusTrap
        isActive={isOpen}
        onEscape={onCancel}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="threeds-title"
          className="divide-y divide-slate-100"
        >
          {/* Bank ACS Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <ShieldCheck className="w-5 h-5 text-sky-400" aria-hidden="true" />
              <div>
                <h2 id="threeds-title" className="text-sm font-bold tracking-wide">
                  3D Secure 2.0 Verification
                </h2>
                <p className="text-[11px] text-slate-400">
                  {network} Identity Check • Risk Score {riskScore}/100
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Cancel 3D Secure verification"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Merchant</span>
                <span className="font-bold text-slate-900">Acme Cloud Commerce</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount</span>
                <span className="font-mono font-bold text-slate-900">
                  {amount.toFixed(2)} {currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Card Number</span>
                <span className="font-mono font-semibold text-slate-700">•••• •••• •••• {cardLast4}</span>
              </div>
            </div>

            <div className="space-y-3">
              <AccessibleInput
                id="threeds-otp-input"
                label="One-Time Passcode (OTP)"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                error={error || undefined}
                helperText="Sent via SMS to +1 •••-•••-8492 (Sandbox code: 123456)"
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500">Sandbox demo passcode:</span>
                <button
                  type="button"
                  onClick={() => setOtp("123456")}
                  className="font-mono font-bold text-blue-600 hover:underline"
                >
                  Fill 123456
                </button>
              </div>
            </div>

            {error && (
              <div role="alert" className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-3 pt-1">
              <AccessibleButton
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1"
              >
                Cancel
              </AccessibleButton>
              <AccessibleButton
                type="submit"
                variant="primary"
                isLoading={isVerifying}
                loadingText="Verifying..."
                className="flex-1 font-bold"
              >
                Confirm &amp; Pay
              </AccessibleButton>
            </div>
          </form>
        </div>
      </FocusTrap>
    </div>
  );
};
