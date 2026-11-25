import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, Table, BarChart3 } from "lucide-react";

export interface DayVolumeItem {
  date: string;
  volume: number;
  count: number;
}

export interface RevenueChartProps {
  data: DayVolumeItem[];
  currency?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, currency = "USD" }) => {
  const [showTable, setShowTable] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const chartData = data.length > 0 ? data : [
    { date: "Day 1", volume: 180, count: 2 },
    { date: "Day 2", volume: 320, count: 4 },
    { date: "Day 3", volume: 490, count: 5 },
    { date: "Day 4", volume: 610, count: 7 },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-base font-bold text-slate-900">
              Settlement Volume Trends
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Daily approved transaction volume across all payment channels
          </p>
        </div>

        {/* Accessible View Toggle (Chart vs Data Table) */}
        <button
          onClick={() => setShowTable(!showTable)}
          aria-pressed={showTable}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 self-start sm:self-auto"
        >
          {showTable ? (
            <>
              <BarChart3 className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>Show Visual Chart</span>
            </>
          ) : (
            <>
              <Table className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              <span>Accessible Table View</span>
            </>
          )}
        </button>
      </div>

      {showTable ? (
        /* Accessible Table Alternative (WCAG 1.1.1 Non-text Content) */
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="px-4 py-3">Date</th>
                <th scope="col" className="px-4 py-3 text-right">Transactions Count</th>
                <th scope="col" className="px-4 py-3 text-right">Gross Settlement Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {chartData.map((d) => (
                <tr key={d.date} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-medium text-slate-800">{d.date}</td>
                  <td className="px-4 py-2.5 text-right text-slate-600">{d.count}</td>
                  <td className="px-4 py-2.5 text-right font-semibold text-emerald-700">
                    {formatCurrency(d.volume)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Recharts Visual Canvas */
        <div
          role="img"
          aria-label={`Settlement volume chart displaying daily trends across ${chartData.length} recorded dates.`}
          className="h-64 w-full pt-2"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1434cb" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#1434cb" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={{ stroke: "#e2e8f0" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#64748b" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), "Settled Volume"]}
                labelFormatter={(label) => `Date: ${label}`}
                contentStyle={{
                  backgroundColor: "#ffffff",
                  borderColor: "#e2e8f0",
                  borderRadius: "0.75rem",
                  fontSize: "12px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Area
                type="monotone"
                dataKey="volume"
                stroke="#1434cb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#volumeGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

