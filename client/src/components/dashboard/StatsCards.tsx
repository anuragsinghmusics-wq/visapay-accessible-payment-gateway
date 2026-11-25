import React from "react";
import { DollarSign, CheckCircle2, TrendingUp, CreditCard } from "lucide-react";

export interface StatsCardsProps {
  totalVolume: number;
  totalTransactions: number;
  approvalRate: number;
  averageTicketSize: number;
  currency?: string;
}

export const StatsCards: React.FC<StatsCardsProps> = ({
  totalVolume,
  totalTransactions,
  approvalRate,
  averageTicketSize,
  currency = "USD",
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(val);
  };

  const cards = [
    {
      id: "stat-volume",
      label: "Total Gross Volume",
      value: formatCurrency(totalVolume),
      detail: "Settled payment volume",
      icon: DollarSign,
      color: "text-blue-600 bg-blue-50 border-blue-200",
    },
    {
      id: "stat-txns",
      label: "Total Transactions",
      value: totalTransactions.toLocaleString(),
      detail: "All payment attempts",
      icon: CreditCard,
      color: "text-indigo-600 bg-indigo-50 border-indigo-200",
    },
    {
      id: "stat-approval",
      label: "Network Approval Rate",
      value: `${approvalRate.toFixed(1)}%`,
      detail: "Zero fraud authorization rate",
      icon: CheckCircle2,
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
    },
    {
      id: "stat-ticket",
      label: "Average Ticket Size",
      value: formatCurrency(averageTicketSize),
      detail: "Per approved checkout",
      icon: TrendingUp,
      color: "text-amber-600 bg-amber-50 border-amber-200",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl border ${card.color}`}>
                <Icon className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>

            <div>
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {card.value}
              </div>
              <p className="text-xs text-slate-500 mt-1">{card.detail}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

