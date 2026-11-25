import React, { useState } from "react";
import { X, RefreshCw, ShieldCheck, CheckCircle2, XCircle, Clock } from "lucide-react";
import { FocusTrap } from "../ui/FocusTrap";
import { AccessibleButton } from "../ui/AccessibleButton";
import { TransactionItem } from "./TransactionTable";
import { PaymentApiClient } from "../../services/paymentApi";
import { useAnnouncer } from "../ui/LiveAnnouncer";

export interface TransactionDrawerProps {
  transaction: TransactionItem | null;
  onClose: () => void;
  onRefunded: () => void;
}

export const TransactionDrawer: React.FC<TransactionDrawerProps> = ({
  transaction,
  onClose,
  onRefunded,
}) => {
  const { announce } = useAnnouncer();
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("Customer requested refund");
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundError, setRefundError] = useState<string | null>(null);

  if (!transaction) return null;

  const refundedSoFar = transaction.refundedAmount || 0;
  const remainingRefundable = Math.max(
    0,
    Math.round((transaction.amount - refundedSoFar) * 100) / 100
  );
  const canRefund =
    (transaction.status === "APPROVED" || transaction.status === "PARTIALLY_REFUNDED") &&
    remainingRefundable > 0;

  const handleIssueRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setRefundError(null);
    const amountToRefund = refundAmount ? Number(refundAmount) : remainingRefundable;
    if (isNaN(amountToRefund) || amountToRefund <= 0 || amountToRefund > remainingRefundable) {
      setRefundError(`Enter an amount between 0.01 and ${remainingRefundable.toFixed(2)}.`);
      return;
    }

    setIsRefunding(true);
    try {
      await PaymentApiClient.refundTransaction(transaction.id, amountToRefund, refundReason);
      announce(
        `Refunded ${amountToRefund.toFixed(2)} ${transaction.currency} for ${transaction.id}.`,
        "polite"
      );
      setRefundAmount("");
      onRefunded();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to issue refund.";
      setRefundError(msg);
      announce(`Refund error: ${msg}`, "assertive");
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs animate-fade-in"
    >
      <FocusTrap
        isActive={Boolean(transaction)}
        onEscape={onClose}
        className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col"
      >
        <div role="dialog" aria-modal="true" aria-labelledby="drawer-title" className="flex flex-col h-full">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div>
              <h2 id="drawer-title" className="text-base font-bold text-slate-900">
                Transaction Audit Detail
              </h2>
              <p className="font-mono text-xs text-slate-500">{transaction.id}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close transaction detail drawer"
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-200/70 hover:text-slate-900"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
            {/* Summary Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Gross Amount</span>
                <span className="font-bold uppercase px-2 py-0.5 rounded bg-white/10 text-[11px]">
                  {transaction.status.replace("_", " ")}
                </span>
              </div>
              <div className="text-2xl font-extrabold font-mono">
                {transaction.amount.toFixed(2)} {transaction.currency}
              </div>
              {refundedSoFar > 0 && (
                <div className="text-amber-300 font-mono text-[11px]">
                  Refunded: -{refundedSoFar.toFixed(2)} {transaction.currency} • Remaining:{" "}
                  {remainingRefundable.toFixed(2)}
                </div>
              )}
            </div>

            {/* Technical Metadata */}
            <div className="space-y-2.5 border border-slate-200 rounded-2xl p-4">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Clearing &amp; Risk Telemetry
              </h3>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Customer</span>
                <span className="font-semibold text-slate-800">{transaction.customerName || "Customer"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Email</span>
                <span className="text-slate-700">{transaction.customerEmail}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Payment Rail</span>
                <span className="font-bold uppercase text-slate-800">
                  {transaction.paymentRail || "card"} ({transaction.network})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Method Reference</span>
                <span className="font-mono text-slate-800">•••• {transaction.last4}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Authorization Code</span>
                <span className="font-mono font-semibold text-emerald-700">
                  {transaction.authCode || "N/A"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">3DS2 / Fraud Score</span>
                <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                  {transaction.threeDsStatus || "NOT_REQUIRED"} • {transaction.riskScore ?? 12}/100
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Gateway Latency</span>
                <span className="font-mono text-slate-600">{transaction.latencyMs ?? 85} ms</span>
              </div>
            </div>

            {/* Event Timeline */}
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                Lifecycle Timeline
              </h3>
              <ul className="space-y-2.5 border-l-2 border-slate-200 pl-3.5 ml-1">
                <li className="flex items-start gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Payment Initiated &amp; Tokenized</p>
                    <p className="text-[11px] text-slate-500">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  {transaction.status === "DECLINED" ? (
                    <XCircle className="w-3.5 h-3.5 text-rose-600 mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="font-semibold text-slate-800">
                      {transaction.status === "DECLINED"
                        ? "Issuer Declined"
                        : "Network Authorized & Webhook Dispatched"}
                    </p>
                    {transaction.failureReason && (
                      <p className="text-[11px] text-slate-600">{transaction.failureReason}</p>
                    )}
                  </div>
                </li>
              </ul>
            </div>

            {/* Issue Refund Form */}
            {canRefund && (
              <form
                onSubmit={handleIssueRefund}
                className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3"
              >
                <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                  <RefreshCw className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  <span>Issue Full or Partial Refund</span>
                </div>

                {refundError && (
                  <p role="alert" className="text-rose-700 font-medium">
                    {refundError}
                  </p>
                )}

                <div className="space-y-2">
                  <label htmlFor="refund-amt" className="block font-semibold text-slate-700">
                    Amount ({transaction.currency}, max {remainingRefundable.toFixed(2)})
                  </label>
                  <input
                    id="refund-amt"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={remainingRefundable}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    placeholder={`Full (${remainingRefundable.toFixed(2)})`}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="refund-reason" className="block font-semibold text-slate-700">
                    Reason
                  </label>
                  <input
                    id="refund-reason"
                    type="text"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs"
                  />
                </div>

                <AccessibleButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isRefunding}
                  loadingText="Processing Refund..."
                  className="w-full font-bold"
                >
                  Confirm Refund
                </AccessibleButton>
              </form>
            )}
          </div>
        </div>
      </FocusTrap>
    </div>
  );
};
