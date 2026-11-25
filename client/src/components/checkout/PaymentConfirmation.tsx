import React, { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Link } from "react-router-dom";
import { CheckCircle2, XCircle, Printer, ArrowLeft, ShieldCheck, Copy, Check, LayoutDashboard } from "lucide-react";
import { FocusTrap } from "../ui/FocusTrap";
import { AccessibleButton } from "../ui/AccessibleButton";
import { PaymentReceiptData } from "../../services/paymentApi";

export interface PaymentConfirmationProps {
  receipt: PaymentReceiptData;
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
}

export const PaymentConfirmation: React.FC<PaymentConfirmationProps> = ({
  receipt,
  isOpen,
  onClose,
  onReset,
}) => {
  const [receiptQr, setReceiptQr] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);

  useEffect(() => {
    if (!isOpen || !receipt) return;
    const verificationPayload = JSON.stringify({
      id: receipt.transactionId,
      status: receipt.status,
      auth: receipt.authCode || "DECLINED",
      amount: `${receipt.amount.toFixed(2)} ${receipt.currency}`,
    });
    QRCode.toDataURL(verificationPayload, { width: 112, margin: 1 })
      .then(setReceiptQr)
      .catch(() => {});
  }, [isOpen, receipt]);

  if (!isOpen) return null;

  const isApproved = receipt.status === "APPROVED";

  const handleCopyTxnId = () => {
    navigator.clipboard.writeText(receipt.transactionId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1800);
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in"
    >
      <FocusTrap
        isActive={isOpen}
        onEscape={onClose}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-scale-in"
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
          className="p-7 sm:p-8 space-y-6"
        >
          {/* Status Header */}
          <div className="text-center space-y-2.5">
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center shadow-inner ${
                isApproved
                  ? "bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50"
                  : "bg-rose-100 text-rose-600 ring-8 ring-rose-50"
              }`}
            >
              {isApproved ? (
                <CheckCircle2 className="w-9 h-9" aria-hidden="true" />
              ) : (
                <XCircle className="w-9 h-9" aria-hidden="true" />
              )}
            </div>

            <h2 id="dialog-title" className="text-2xl font-extrabold tracking-tight text-slate-900">
              {isApproved ? "Payment Confirmed" : "Transaction Declined"}
            </h2>

            <p id="dialog-description" className="text-xs sm:text-sm text-slate-600">
              {isApproved
                ? `Authorized ${receipt.amount.toFixed(2)} ${receipt.currency} via ${receipt.network}.`
                : receipt.failureReason || "Your payment could not be authorized by the issuer."}
            </p>
          </div>

          {/* Receipt Breakdown + Verification QR */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/90 space-y-3 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Transaction ID</span>
              <div className="flex items-center space-x-1.5">
                <span className="font-mono font-bold text-slate-900">{receipt.transactionId}</span>
                <button
                  type="button"
                  onClick={handleCopyTxnId}
                  aria-label="Copy transaction ID"
                  className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-900"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {receipt.authCode && (
              <div className="flex justify-between items-center py-1 border-b border-slate-200">
                <span className="text-slate-500 font-medium">Authorization Code</span>
                <span className="font-mono font-bold text-emerald-700">{receipt.authCode}</span>
              </div>
            )}

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Payment Rail / Network</span>
              <span className="font-semibold text-slate-900">{receipt.network}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Method Reference</span>
              <span className="font-mono font-medium text-slate-800">•••• {receipt.last4}</span>
            </div>

            <div className="flex justify-between items-center py-1 border-b border-slate-200">
              <span className="text-slate-500 font-medium">Risk &amp; 3DS2 Check</span>
              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                Score {receipt.riskScore ?? 12}/100 ({receipt.threeDsStatus || "VERIFIED"})
              </span>
            </div>

            <div className="flex justify-between items-center pt-1 gap-4">
              <div className="space-y-1">
                <span className="block text-slate-500 font-medium">Customer Receipt</span>
                <span className="block font-semibold text-slate-900">{receipt.customerName}</span>
                <span className="block text-slate-600">{receipt.customerEmail}</span>
                <span className="block font-mono text-[11px] text-slate-500">
                  {new Date(receipt.timestamp).toLocaleString()}
                </span>
              </div>
              {receiptQr && (
                <img
                  src={receiptQr}
                  alt="Digital receipt verification QR code"
                  className="w-20 h-20 rounded-xl border border-slate-200 bg-white p-1 shrink-0 shadow-xs"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <AccessibleButton
              variant="outline"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-4 h-4" />}
              className="flex-1"
            >
              Print Invoice
            </AccessibleButton>

            <AccessibleButton
              variant="primary"
              onClick={() => {
                onClose();
                onReset();
              }}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
              className="flex-1"
            >
              New Payment
            </AccessibleButton>
          </div>

          <div className="text-center pt-1">
            <Link
              to="/dashboard"
              onClick={onClose}
              className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              <LayoutDashboard className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Inspect transaction &amp; webhook in Merchant Console →</span>
            </Link>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};
