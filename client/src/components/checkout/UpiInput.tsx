import React, { useState, useEffect, useCallback } from "react";
import QRCode from "qrcode";
import {
  QrCode,
  Smartphone,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldCheck,
  Loader2,
  AlertCircle,
  BellRing,
  XCircle,
} from "lucide-react";
import { AccessibleInput } from "../ui/AccessibleInput";
import { PaymentApiClient } from "../../services/paymentApi";
import { useAnnouncer } from "../ui/LiveAnnouncer";

export interface UpiInputProps {
  vpa: string;
  onChange: (vpa: string, isValid: boolean) => void;
  error?: string;
  amount: number;
  currency?: string;
  onQuickApproveQr?: (overrideVpa?: string) => void;
}

const POPULAR_HANDLES = ["@visapay", "@okhdfc", "@oksbi", "@icici", "@paytm"];

export const UpiInput: React.FC<UpiInputProps> = ({
  vpa,
  onChange,
  error,
  amount,
  currency = "USD",
  onQuickApproveQr,
}) => {
  const { announce } = useAnnouncer();
  const [mode, setMode] = useState<"QR" | "VPA">("QR");
  const [timeLeft, setTimeLeft] = useState(180);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [showPhoneHandshake, setShowPhoneHandshake] = useState(false);
  const [txnRef, setTxnRef] = useState<string>(
    () => `VPY${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  );

  const [isVerifyingVpa, setIsVerifyingVpa] = useState(false);
  const [verifiedBeneficiary, setVerifiedBeneficiary] = useState<{
    accountHolderName: string;
    bankName: string;
  } | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const inrAmount = currency === "INR" ? amount : Math.round(amount * 84.5 * 100) / 100;
  const upiUri = `upi://pay?pa=merchant@visapay&pn=Acme%20Cloud%20Commerce&tr=${txnRef}&tn=VisaPay%20Checkout&am=${inrAmount.toFixed(
    2
  )}&cu=INR`;

  const generateRealQr = useCallback(async () => {
    try {
      const dataUrl = await QRCode.toDataURL(upiUri, {
        width: 240,
        margin: 2,
        errorCorrectionLevel: "M",
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });
      setQrDataUrl(dataUrl);
    } catch (err) {
      console.error("[UpiInput] Failed to generate ISO QR code:", err);
    }
  }, [upiUri]);

  useEffect(() => {
    generateRealQr();
  }, [generateRealQr]);

  useEffect(() => {
    if (mode !== "QR") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [mode]);

  const handleRefreshQr = () => {
    setTxnRef(`VPY${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
    setTimeLeft(180);
    setShowPhoneHandshake(false);
    announce("Generated fresh UPI QR code valid for 3 minutes.", "polite");
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const validateVpa = (val: string): boolean => {
    return /^[\w.-]+@[\w.-]+$/.test(val.trim());
  };

  const handleVpaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value.trim().toLowerCase();
    setVerifiedBeneficiary(null);
    setVerifyError(null);
    onChange(nextVal, validateVpa(nextVal));
  };

  const handleAppendHandle = (handle: string) => {
    const prefix = vpa.includes("@") ? vpa.split("@")[0] : vpa || "alex";
    const nextVal = `${prefix}${handle}`.toLowerCase();
    setVerifiedBeneficiary(null);
    setVerifyError(null);
    onChange(nextVal, validateVpa(nextVal));
  };

  const handleVerifyVpaClick = async () => {
    if (!validateVpa(vpa)) {
      setVerifyError("Enter a valid VPA (e.g. name@okhdfc) before verifying.");
      return;
    }
    setIsVerifyingVpa(true);
    setVerifyError(null);
    try {
      const result = await PaymentApiClient.verifyUpiVpa(vpa);
      setVerifiedBeneficiary({
        accountHolderName: result.accountHolderName,
        bankName: result.bankName,
      });
      announce(`VPA verified for ${result.accountHolderName} on ${result.bankName}.`, "polite");
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : "VPA verification failed.");
    } finally {
      setIsVerifyingVpa(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* UPI Mode Switcher */}
      <div
        role="tablist"
        aria-label="UPI Payment Mode"
        className="grid grid-cols-2 p-1.5 bg-slate-100 rounded-xl border border-slate-200"
      >
        <button
          type="button"
          role="tab"
          id="tab-qr"
          aria-selected={mode === "QR"}
          aria-controls="panel-qr"
          onClick={() => {
            setMode("QR");
            if (!vpa) onChange("qr_scan@visapay", true);
          }}
          className={`flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-lg transition ${
            mode === "QR"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          } focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600`}
        >
          <QrCode className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>Scan UPI QR</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-vpa"
          aria-selected={mode === "VPA"}
          aria-controls="panel-vpa"
          onClick={() => {
            setMode("VPA");
            setShowPhoneHandshake(false);
            if (vpa === "qr_scan@visapay") onChange("", false);
          }}
          className={`flex items-center justify-center space-x-2 py-2.5 text-xs font-bold rounded-lg transition ${
            mode === "VPA"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          } focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600`}
        >
          <Smartphone className="w-4 h-4 text-blue-600" aria-hidden="true" />
          <span>Enter UPI ID / VPA</span>
        </button>
      </div>

      {mode === "QR" ? (
        <div
          id="panel-qr"
          role="tabpanel"
          aria-labelledby="tab-qr"
          className="bg-slate-50/90 rounded-2xl border border-slate-200 p-5 sm:p-6 flex flex-col items-center text-center space-y-4"
        >
          <div className="w-full flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-800">
              Pay <span className="font-mono font-extrabold text-slate-950">₹{inrAmount.toFixed(2)} INR</span>
              {currency !== "INR" && (
                <span className="text-slate-500 font-normal ml-1">
                  (≈ ${amount.toFixed(2)} {currency})
                </span>
              )}
            </span>
            <div className="flex items-center space-x-1.5 font-mono text-xs bg-white px-2.5 py-1 rounded-full border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
              <span className={timeLeft === 0 ? "text-rose-600 font-bold" : "text-amber-700 font-bold"}>
                {timeLeft === 0 ? "EXPIRED" : formatTimer(timeLeft)}
              </span>
            </div>
          </div>

          {/* Genuine Camera-Scannable ISO/IEC 18004 QR Code */}
          <div className="relative p-3.5 bg-white rounded-2xl border-2 border-slate-200 shadow-md">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`Scannable NPCI UPI QR code for ${inrAmount.toFixed(2)} INR, reference ${txnRef}`}
                className={`w-48 h-48 rounded-lg transition-opacity ${
                  timeLeft === 0 ? "opacity-20 blur-[1px]" : "opacity-100"
                }`}
              />
            ) : (
              <div
                className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs"
                role="img"
                aria-label="Generating UPI QR code"
              >
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )}

            {timeLeft === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <button
                  type="button"
                  onClick={handleRefreshQr}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-lg hover:bg-black"
                >
                  <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Regenerate QR</span>
                </button>
              </div>
            )}
          </div>

          {/* Supported UPI Apps Strip */}
          <div className="space-y-2 w-full">
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold">
              <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 shadow-xs">
                GPay
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-purple-200 text-purple-700 shadow-xs">
                PhonePe
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-sky-200 text-sky-700 shadow-xs">
                Paytm
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-white border border-orange-200 text-orange-700 shadow-xs">
                BHIM UPI
              </span>
            </div>

            <p className="text-[11px] text-slate-500 font-mono truncate max-w-full px-2" title={upiUri}>
              Ref: {txnRef} • merchant@visapay
            </p>
          </div>

          {/* Interactive Mobile Collect Handshake */}
          {!showPhoneHandshake ? (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleRefreshQr}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Refresh QR</span>
              </button>

              {onQuickApproveQr && (
                <button
                  type="button"
                  onClick={() => {
                    setShowPhoneHandshake(true);
                    announce("Opened interactive mobile UPI approval prompt.", "polite");
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
                >
                  <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Simulate Mobile Scan</span>
                </button>
              )}
            </div>
          ) : (
            <div
              role="region"
              aria-label="Simulated Mobile UPI Collect Request"
              className="w-full max-w-sm bg-slate-900 text-white rounded-2xl p-4 shadow-xl border border-slate-700 text-left space-y-3 animate-scale-in"
            >
              <div className="flex items-center justify-between text-[11px] text-sky-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <BellRing className="w-3.5 h-3.5 animate-pulse" aria-hidden="true" />
                  UPI App Notification
                </span>
                <span className="font-mono text-slate-400">Ref {txnRef}</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                <strong>Acme Cloud Commerce</strong> requested{" "}
                <strong className="text-white font-mono">₹{inrAmount.toFixed(2)}</strong> via UPI QR.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onChange("qr_scan@visapay", true);
                    onQuickApproveQr?.("qr_scan@visapay");
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Approve &amp; Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onChange("declined@visapay", true);
                    onQuickApproveQr?.("declined@visapay");
                  }}
                  className="px-3 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold inline-flex items-center gap-1 transition"
                >
                  <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div id="panel-vpa" role="tabpanel" aria-labelledby="tab-vpa" className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-end gap-2">
            <div className="flex-1">
              <AccessibleInput
                id="upi-vpa-input"
                label="Virtual Payment Address (VPA)"
                type="text"
                value={vpa}
                onChange={handleVpaChange}
                placeholder="e.g. alex@visapay or name@okhdfc"
                error={error || verifyError || undefined}
                helperText="Verify beneficiary name before dispatching collect request."
                rightIcon={
                  validateVpa(vpa) ? (
                    <span className="inline-flex items-center text-xs text-emerald-600 font-semibold">
                      <CheckCircle2 className="w-4 h-4 mr-1" aria-hidden="true" />
                      Valid
                    </span>
                  ) : undefined
                }
              />
            </div>
            <button
              type="button"
              onClick={handleVerifyVpaClick}
              disabled={isVerifyingVpa || !validateVpa(vpa)}
              className="min-h-[48px] px-4 rounded-lg bg-slate-900 hover:bg-black disabled:opacity-40 text-white text-xs font-bold transition whitespace-nowrap focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {isVerifyingVpa ? "Verifying..." : "Verify VPA"}
            </button>
          </div>

          {verifiedBeneficiary && (
            <div
              role="status"
              aria-live="polite"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs animate-fade-in"
            >
              <div className="flex items-center space-x-2 text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                <span>
                  Verified: <strong className="font-bold">{verifiedBeneficiary.accountHolderName}</strong>
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-700">
                {verifiedBeneficiary.bankName}
              </span>
            </div>
          )}

          {verifyError && (
            <div className="text-xs text-rose-600 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{verifyError}</span>
            </div>
          )}

          {/* Quick Bank Handle Suggestions */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
              Popular Handles:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_HANDLES.map((handle) => (
                <button
                  key={handle}
                  type="button"
                  onClick={() => handleAppendHandle(handle)}
                  className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-800 border border-slate-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 transition"
                >
                  {handle}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
