import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
} from "lucide-react";

export interface TransactionItem {
  id: string;
  amount: number;
  refundedAmount?: number;
  currency: string;
  status: string;
  paymentRail?: string;
  network: string;
  last4: string;
  authCode?: string;
  threeDsStatus?: string;
  riskScore?: number;
  customerEmail: string;
  customerName?: string;
  failureReason?: string | null;
  latencyMs?: number | null;
  createdAt: string;
}

export interface TransactionTableProps {
  transactions: TransactionItem[];
  onRefresh?: () => void;
  onSelectTransaction?: (txn: TransactionItem) => void;
  isLoading?: boolean;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  onRefresh,
  onSelectTransaction,
  isLoading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 7;

  const filteredTransactions = transactions.filter((t) => {
    const matchesStatus =
      statusFilter === "ALL" || t.status.toUpperCase() === statusFilter.toUpperCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      t.id.toLowerCase().includes(query) ||
      t.customerEmail.toLowerCase().includes(query) ||
      (t.customerName && t.customerName.toLowerCase().includes(query)) ||
      t.last4.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleExportCsv = () => {
    const headers = [
      "Transaction ID",
      "Customer Name",
      "Customer Email",
      "Amount",
      "Refunded Amount",
      "Currency",
      "Rail",
      "Network",
      "Reference",
      "Status",
      "Timestamp",
    ];
    const rows = filteredTransactions.map((t) => [
      t.id,
      t.customerName || "Customer",
      t.customerEmail,
      t.amount.toFixed(2),
      (t.refundedAmount || 0).toFixed(2),
      t.currency,
      t.paymentRail || "card",
      t.network,
      t.last4,
      t.status,
      t.createdAt,
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `visapay-ledger-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 mr-1" aria-hidden="true" />
            Approved
          </span>
        );
      case "DECLINED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 mr-1" aria-hidden="true" />
            Declined
          </span>
        );
      case "PARTIALLY_REFUNDED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
            Partial Refund
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <RefreshCw className="w-3 h-3 mr-1" aria-hidden="true" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">Transaction Ledger</h2>
          <p className="text-xs text-slate-500">
            Real-time multi-rail settlement records — select any record to inspect or refund
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ID, email, last 4..."
              aria-label="Filter transactions"
              className="text-xs rounded-lg border border-slate-300 pl-9 pr-3 py-2 w-48 sm:w-56 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            aria-label="Filter by transaction status"
            className="text-xs rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="APPROVED">Approved Only</option>
            <option value="DECLINED">Declined Only</option>
            <option value="PARTIALLY_REFUNDED">Partial Refunds</option>
            <option value="REFUNDED">Refunded Only</option>
          </select>

          <button
            type="button"
            onClick={handleExportCsv}
            aria-label="Export ledger to CSV"
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            <Download className="w-3.5 h-3.5" aria-hidden="true" />
            <span>CSV</span>
          </button>

          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              aria-label="Refresh transaction table data"
              className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs" aria-label="Transactions audit table">
          <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
            <tr>
              <th scope="col" className="px-4 py-3">Transaction ID</th>
              <th scope="col" className="px-4 py-3">Customer</th>
              <th scope="col" className="px-4 py-3">Amount</th>
              <th scope="col" className="px-4 py-3">Rail / Network</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Date</th>
              {onSelectTransaction && <th scope="col" className="px-4 py-3 text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={onSelectTransaction ? 7 : 6} className="px-4 py-8 text-center text-slate-500">
                  No transactions match the selected filter criteria.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-slate-50/90 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-slate-900">{txn.id}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{txn.customerName || "Customer"}</div>
                    <div className="text-[11px] text-slate-400">{txn.customerEmail}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                    {txn.amount.toFixed(2)} {txn.currency}
                    {(txn.refundedAmount || 0) > 0 && (
                      <span className="block text-[10px] text-amber-700">
                        -{txn.refundedAmount?.toFixed(2)} refunded
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-700 uppercase">{txn.network}</span>
                    <span className="text-slate-400 text-[11px] ml-1">•••• {txn.last4}</span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(txn.status)}</td>
                  <td className="px-4 py-3 text-right text-slate-500 font-mono text-[11px]">
                    {new Date(txn.createdAt).toLocaleDateString()}
                  </td>
                  {onSelectTransaction && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectTransaction(txn)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 font-semibold transition"
                      >
                        <span>Inspect</span>
                        <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between pt-2 text-xs text-slate-600">
        <span>
          Showing {paginatedTransactions.length} of {filteredTransactions.length} records
        </span>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            aria-label="Previous Page"
            className="p-1.5 rounded-md border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            aria-label="Next Page"
            className="p-1.5 rounded-md border border-slate-300 disabled:opacity-40 hover:bg-slate-50"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
