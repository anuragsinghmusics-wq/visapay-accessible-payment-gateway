import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Link2, Plus, Copy, Check, ExternalLink } from "lucide-react";
import { AccessibleButton } from "../ui/AccessibleButton";
import { useAnnouncer } from "../ui/LiveAnnouncer";

interface PaymentLinkItem {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

export const PaymentLinksTab: React.FC = () => {
  const { announce } = useAnnouncer();
  const [links, setLinks] = useState<PaymentLinkItem[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("99.00");
  const [currency, setCurrency] = useState("USD");
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLinks = async () => {
    try {
      const res = await fetch("/api/v1/payment-intents");
      const json = await res.json();
      if (res.ok) setLinks(json.data || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim() || Number(amount) <= 0) {
      setError("Enter a title (min 3 characters) and positive amount.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch("/api/v1/payment-intents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          amount: Number(amount),
          currency,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || "Failed to create link.");

      setTitle("");
      setDescription("");
      announce(`Created payment link ${json.data.id}.`, "polite");
      await loadLinks();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Creation failed.");
    } finally {
      setIsCreating(false);
    }
  };

  const copyLink = (id: string) => {
    const fullUrl = `${window.location.origin}/pay/${id}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(id);
    announce("Payment link copied to clipboard.", "polite");
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      {/* Create Form */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <div className="flex items-center space-x-2">
          <Link2 className="w-5 h-5 text-blue-600" aria-hidden="true" />
          <h2 className="text-base font-bold text-slate-900">Create Hosted Payment Link</h2>
        </div>
        <p className="text-xs text-slate-500">
          Generate shareable invoice URLs accepting all 5 VisaPay payment rails.
        </p>

        {error && (
          <p role="alert" className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
            {error}
          </p>
        )}

        <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
          <div>
            <label htmlFor="pl-title" className="block font-semibold text-slate-700 mb-1">
              Invoice / Product Title
            </label>
            <input
              id="pl-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Q4 Cloud API Retainer"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              required
            />
          </div>

          <div>
            <label htmlFor="pl-desc" className="block font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <input
              id="pl-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Includes SLA & priority settlement"
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="pl-amt" className="block font-semibold text-slate-700 mb-1">
                Amount
              </label>
              <input
                id="pl-amt"
                type="number"
                step="0.01"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 font-mono"
                required
              />
            </div>

            <div>
              <label htmlFor="pl-curr" className="block font-semibold text-slate-700 mb-1">
                Currency
              </label>
              <select
                id="pl-curr"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5 bg-white font-semibold"
              >
                <option value="USD">USD ($)</option>
                <option value="INR">INR (₹)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>

          <AccessibleButton
            type="submit"
            variant="primary"
            isLoading={isCreating}
            loadingText="Generating Link..."
            leftIcon={<Plus className="w-4 h-4" />}
            className="w-full font-bold"
          >
            Generate Payment Link
          </AccessibleButton>
        </form>
      </div>

      {/* Active Links List */}
      <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Active Hosted Links</h2>
        <div className="space-y-3">
          {links.length === 0 ? (
            <p className="text-xs text-slate-500 py-8 text-center">No payment links created yet.</p>
          ) : (
            links.map((link) => (
              <div
                key={link.id}
                className="p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-sm text-slate-900">{link.title}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        link.status === "SUCCEEDED"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {link.status}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-slate-600">
                    {link.amount.toFixed(2)} {link.currency} • <span className="text-slate-400">/pay/{link.id}</span>
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => copyLink(link.id)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700"
                  >
                    {copiedId === link.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <Link
                    to={`/pay/${link.id}`}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-semibold"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
