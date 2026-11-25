import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { AccessibleInput } from "../components/ui/AccessibleInput";
import { AccessibleButton } from "../components/ui/AccessibleButton";
import { useAuth } from "../contexts/AuthContext";
import { useAnnouncer } from "../components/ui/LiveAnnouncer";
import { Lock, Mail, ShieldCheck, KeyRound } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const { announce } = useAnnouncer();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const handleFillDemo = () => {
    setEmail("merchant@visapay.demo");
    setPassword("Password123");
    setError(null);
    announce("Filled sandbox merchant credentials.", "polite");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please provide both email and password.");
      announce("Please provide both email and password.", "assertive");
      return;
    }

    setIsLoading(true);
    announce("Authenticating merchant credentials...", "polite");

    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Invalid credentials.");
      }

      announce("Authentication successful! Loading merchant console...", "polite");
      login(data.data.token, data.data.merchant);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Login failed.";
      setError(message);
      announce(`Authentication error: ${message}`, "assertive");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-10 animate-fade-in space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-900 flex items-center justify-center text-sky-400 shadow-md">
          <Lock className="w-6 h-6" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Sign in to Merchant Console
        </h1>
        <p className="text-xs text-slate-500">
          Manage payment settlements, refunds, payment links, and signed webhooks
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/90 p-7 sm:p-8 shadow-sm space-y-5">
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AccessibleInput
            id="login-email"
            label="Work Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="merchant@visapay.demo"
            autoComplete="email"
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />

          <AccessibleInput
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            autoComplete="current-password"
            required
            leftIcon={<Lock className="w-4 h-4" />}
          />

          <AccessibleButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isLoading}
            loadingText="Authenticating..."
            className="w-full font-bold shadow-sm"
          >
            Continue to Console
          </AccessibleButton>
        </form>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5 text-slate-500">
            <KeyRound className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span>Need sandbox access?</span>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="font-semibold text-blue-600 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 rounded px-1.5 py-0.5"
          >
            Use Sandbox Account
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center space-x-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
          JWT HS256 Session
        </span>
        <span>•</span>
        <Link to="/checkout" className="font-medium text-blue-600 hover:underline">
          Go to Express Checkout →
        </Link>
      </div>
    </div>
  );
};
