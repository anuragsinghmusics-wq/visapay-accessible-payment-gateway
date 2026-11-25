import React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { PieChart as PieIcon } from "lucide-react";

export interface NetworkVolumeItem {
  network: string;
  volume: number;
  percentage: number;
}

export interface SettlementBreakdownProps {
  data: NetworkVolumeItem[];
}

const NETWORK_COLORS: Record<string, string> = {
  VISA: "#1434cb",
  MASTERCARD: "#ea580c",
  AMEX: "#0284c7",
  DISCOVER: "#d97706",
};

export const SettlementBreakdown: React.FC<SettlementBreakdownProps> = ({ data }) => {
  const chartData = data.length > 0 ? data : [
    { network: "VISA", volume: 280, percentage: 65 },
    { network: "MASTERCARD", volume: 110, percentage: 25 },
    { network: "AMEX", volume: 45, percentage: 10 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="space-y-0.5">
        <div className="flex items-center space-x-2">
          <PieIcon className="w-5 h-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900">
            Card Network Distribution
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Share of volume processed by card brand
        </p>
      </div>

      <div
        role="img"
        aria-label="Pie chart illustrating payment share across Visa, Mastercard, and American Express networks."
        className="h-64 w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              dataKey="volume"
              nameKey="network"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={4}
            >
              {chartData.map((entry) => (
                <Cell
                  key={entry.network}
                  fill={NETWORK_COLORS[entry.network.toUpperCase()] || "#64748b"}
                />
              ))}
            </Pie>
            <Tooltip
              formatter={(val: number) => [`$${val.toFixed(2)}`, "Volume"]}
              contentStyle={{
                backgroundColor: "#ffffff",
                borderColor: "#e2e8f0",
                borderRadius: "0.75rem",
                fontSize: "12px",
              }}
            />
            <Legend
              formatter={(value) => (
                <span className="text-xs font-semibold text-slate-700">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

