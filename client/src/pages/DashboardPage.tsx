import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { StatsCards } from "../components/dashboard/StatsCards";
import { RevenueChart, DayVolumeItem } from "../components/dashboard/RevenueChart";
import { SettlementBreakdown, NetworkVolumeItem } from "../components/dashboard/SettlementBreakdown";
import { TransactionTable, TransactionItem } from "../components/dashboard/TransactionTable";
import { TransactionDrawer } from "../components/dashboard/TransactionDrawer";
import { PaymentLinksTab } from "../components/dashboard/PaymentLinksTab";
import { DevelopersTab } from "../components/dashboard/DevelopersTab";
import { AlertCircle, BarChart3, Receipt, Link2, Code2, CreditCard } from "lucide-react";
import { useAnnouncer } from "../components/ui/LiveAnnouncer";

interface DashboardStatsData {
  totalVolume: number;
  refundedVolume: number;
  netVolume: number;
  totalTransactions: number;
  approvedCount: number;
  declinedCount: number;
  refundedCount: number;
  approvalRate: number;
  averageTicketSize: number;
  currency: string;
  volumeByDay: DayVolumeItem[];
  volumeByNetwork: NetworkVolumeItem[];
  recentTransactions: TransactionItem[];
}

type ConsoleTab = "OVERVIEW" | "TRANSACTIONS" | "LINKS" | "DEVELOPERS";

export const DashboardPage: React.FC = () => {
  const { merchant, token } = useAuth();
  const { announce } = useAnnouncer();

  const [activeTab, setActiveTab] = useState<ConsoleTab>("OVERVIEW");
  const [stats, setStats] = useState<DashboardStatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<TransactionItem | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/merchants/dashboard", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to load dashboard metrics.");
      }

      setStats(json.data);
      announce("Merchant console telemetry loaded.", "polite");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error fetching metrics.";
      setError(message);
      announce(`Dashboard error: ${message}`, "assertive");
    } finally {
      setIsLoading(false);
    }
  }, [token, announce]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const tabs: Array<{ id: ConsoleTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: "OVERVIEW", label: "Overview & Telemetry", icon: BarChart3 },
    { id: "TRANSACTIONS", label: "Transactions & Refunds", icon: Receipt },
    { id: "LINKS", label: "Payment Links", icon: Link2 },
    { id: "DEVELOPERS", label: "Webhooks & Keys", icon: Code2 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Console Header & Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                {merchant?.name || "Acme Cloud Commerce"} Console
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Settlement
              </span>
            </div>
            <p className="text-xs text-slate-600">
              {merchant?.email} • Net Settled:{" "}
              <strong className="font-mono text-slate-900">${(stats?.netVolume ?? 0).toFixed(2)}</strong> •
              Refunded:{" "}
              <strong className="font-mono text-amber-700">${(stats?.refundedVolume ?? 0).toFixed(2)}</strong>
            </p>
          </div>

          <Link
            to="/checkout"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition self-start md:self-auto"
          >
            <CreditCard className="w-4 h-4" aria-hidden="true" />
            <span>Run Live Test Payment</span>
          </Link>
        </div>

        <div
          role="tablist"
          aria-label="Merchant Console Sections"
          className="flex flex-wrap gap-2 pt-2 border-t border-slate-100"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition ${
                  selected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                } focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {activeTab === "OVERVIEW" && (
        <div className="space-y-6">
          <StatsCards
            totalVolume={stats?.totalVolume || 0}
            totalTransactions={stats?.totalTransactions || 0}
            approvalRate={stats?.approvalRate || 100}
            averageTicketSize={stats?.averageTicketSize || 0}
            currency={stats?.currency || "USD"}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart data={stats?.volumeByDay || []} currency={stats?.currency || "USD"} />
            </div>
            <div>
              <SettlementBreakdown data={stats?.volumeByNetwork || []} />
            </div>
          </div>

          <TransactionTable
            transactions={stats?.recentTransactions || []}
            onRefresh={fetchDashboardData}
            onSelectTransaction={setSelectedTxn}
            isLoading={isLoading}
          />
        </div>
      )}

      {activeTab === "TRANSACTIONS" && (
        <TransactionTable
          transactions={stats?.recentTransactions || []}
          onRefresh={fetchDashboardData}
          onSelectTransaction={setSelectedTxn}
          isLoading={isLoading}
        />
      )}

      {activeTab === "LINKS" && <PaymentLinksTab />}

      {activeTab === "DEVELOPERS" && <DevelopersTab />}

      <TransactionDrawer
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
        onRefunded={fetchDashboardData}
      />
    </div>
  );
};
