import React from "react";
import { Link } from "react-router-dom";
import { Shield, Lock, CheckCircle2 } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 text-xs py-12 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2 space-y-2.5">
            <span className="text-white font-extrabold text-base tracking-tight">
              VisaPay Payments Infrastructure
            </span>
            <p className="text-slate-400 max-w-md leading-relaxed">
              Multi-rail payment processing platform engineered with WCAG 2.0 Level AA & Section 508
              accessibility standards, PCI tokenization, 3D Secure 2.0 risk scoring, and real-time
              merchant telemetry.
            </p>
            <div className="inline-flex items-center space-x-2 text-emerald-400 font-medium pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              <span>All payment rails operational (99.99% uptime SLA)</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              Platform
            </h3>
            <ul className="space-y-1.5">
              <li>
                <Link to="/checkout" className="hover:text-white transition">
                  Express Checkout
                </Link>
              </li>
              <li>
                <Link to="/pay/pi_cloud_pro_2026" className="hover:text-white transition">
                  Hosted Payment Link
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="hover:text-white transition">
                  Merchant Console
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Merchant Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">
              Compliance & Standards
            </h3>
            <div className="flex flex-wrap gap-1.5">
              <span className="px-2.5 py-1 bg-slate-900 text-emerald-400 rounded-md font-medium border border-slate-800 flex items-center gap-1">
                <Shield className="w-3 h-3" aria-hidden="true" />
                WCAG 2.0 AA
              </span>
              <span className="px-2.5 py-1 bg-slate-900 text-sky-400 rounded-md font-medium border border-slate-800">
                Section 508
              </span>
              <span className="px-2.5 py-1 bg-slate-900 text-amber-400 rounded-md font-medium border border-slate-800 flex items-center gap-1">
                <Lock className="w-3 h-3" aria-hidden="true" />
                PCI-DSS Ready
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between text-slate-500 gap-2">
          <p>© {new Date().getFullYear()} VisaPay Payments Inc. MIT Open Source License.</p>
          <p>ISO/IEC 18004 QR • HMAC-SHA256 Webhooks • OOD TypeScript Core</p>
        </div>
      </div>
    </footer>
  );
};
