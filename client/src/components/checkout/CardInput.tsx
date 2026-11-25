import React, { useId, useState, useEffect } from "react";
import { CreditCard as CardIcon, ShieldCheck, AlertCircle } from "lucide-react";
import {
  detectCardNetwork,
  formatCardNumber,
  validateLuhn,
  CardNetwork,
} from "@visapay/shared";
import { useAnnouncer } from "../ui/LiveAnnouncer";

export interface CardInputProps {
  value: string;
  onChange: (formattedValue: string, network: CardNetwork, isValidLuhn: boolean) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  id?: string;
}

export const CardInput: React.FC<CardInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  required = true,
  id: customId,
}) => {
  const autoId = useId();
  const inputId = customId || `card-number-${autoId}`;
  const statusId = `${inputId}-status`;
  const errorId = `${inputId}-error`;

  const { announce } = useAnnouncer();
  const [prevNetwork, setPrevNetwork] = useState<CardNetwork>("unknown");

  const digits = value.replace(/\D/g, "");
  const network = detectCardNetwork(digits);
  const isValidLuhn = digits.length >= 13 && validateLuhn(digits);

  // Announce card network change to screen readers
  useEffect(() => {
    if (network !== prevNetwork) {
      if (network !== "unknown") {
        announce(`${network.toUpperCase()} card detected.`);
      }
      setPrevNetwork(network);
    }
  }, [network, prevNetwork, announce]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    const newDigits = formatted.replace(/\D/g, "");
    const newNetwork = detectCardNetwork(newDigits);
    const valid = newDigits.length >= 13 && validateLuhn(newDigits);
    onChange(formatted, newNetwork, valid);
  };

  const getNetworkBadge = () => {
    switch (network) {
      case "visa":
        return <span className="text-xs font-bold text-blue-700 tracking-wider">VISA</span>;
      case "mastercard":
        return <span className="text-xs font-bold text-amber-600 tracking-wider">MC</span>;
      case "amex":
        return <span className="text-xs font-bold text-sky-600 tracking-wider">AMEX</span>;
      case "discover":
        return <span className="text-xs font-bold text-orange-600 tracking-wider">DISC</span>;
      default:
        return <CardIcon className="w-5 h-5 text-slate-400" aria-hidden="true" />;
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold tracking-wide text-slate-800 uppercase"
        >
          Card Number
          {required && (
            <span className="text-rose-600 ml-1" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>

        {/* Live Checksum Badge */}
        {digits.length >= 13 && (
          <span
            id={statusId}
            aria-live="polite"
            className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
              isValidLuhn
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-rose-50 text-rose-700 border border-rose-200"
            }`}
          >
            {isValidLuhn ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Checksum Valid
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 mr-1" aria-hidden="true" />
                Invalid Checksum
              </>
            )}
          </span>
        )}
      </div>

      <div className="relative rounded-lg shadow-sm">
        <div
          className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none"
          aria-hidden="true"
        >
          {getNetworkBadge()}
        </div>

        <input
          id={inputId}
          type="text"
          inputMode="numeric"
          autoComplete="cc-number"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="4242  ••••  ••••  4242"
          aria-invalid={Boolean(error || (digits.length >= 16 && !isValidLuhn))}
          aria-describedby={`${statusId} ${error ? errorId : ""}`}
          maxLength={network === "amex" ? 17 : 19}
          className={`w-full min-h-[48px] pl-12 pr-4 rounded-lg border font-mono tracking-wider text-sm transition-colors duration-150 ${
            error
              ? "border-rose-500 focus-visible:outline-rose-600"
              : "border-slate-300 focus-visible:outline-blue-600"
          } focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 disabled:bg-slate-50 disabled:text-slate-400`}
        />
      </div>

      {error && (
        <p
          id={errorId}
          role="alert"
          aria-live="polite"
          className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-1"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

