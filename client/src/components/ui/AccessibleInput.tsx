import React, { InputHTMLAttributes, forwardRef, useId } from "react";
import { AlertCircle } from "lucide-react";

export interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

/**
 * AccessibleInput
 * Enforces WCAG 1.3.1, WCAG 3.3.1 (Error Identification),
 * and WCAG 3.3.2 (Labels/Instructions) using aria-describedby and aria-invalid.
 */
export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      id: customId,
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName = "",
      className = "",
      required,
      disabled,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = customId || `input-${autoId}`;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const describedBy = [
      error ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={`space-y-1.5 ${containerClassName}`}>
        {/* Semantic Label */}
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold tracking-wide text-slate-800 uppercase"
        >
          {label}
          {required && (
            <span className="text-rose-600 ml-1" aria-hidden="true">
              *
            </span>
          )}
          {required && <span className="sr-only"> (required)</span>}
        </label>

        {/* Input Wrapper */}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div
              className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400"
              aria-hidden="true"
            >
              {leftIcon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={describedBy || undefined}
            aria-required={required}
            className={`w-full min-h-[48px] rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 text-sm transition-colors duration-150 ${
              leftIcon ? "pl-11" : "pl-3.5"
            } ${rightIcon || error ? "pr-11" : "pr-3.5"} ${
              error
                ? "border-rose-500 focus-visible:outline-rose-600 focus-visible:outline-3"
                : "border-slate-300 focus-visible:outline-blue-600 focus-visible:outline-3"
            } focus-visible:outline-offset-2 disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${className}`}
            {...props}
          />

          {error && !rightIcon && (
            <div
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-rose-500"
              aria-hidden="true"
            >
              <AlertCircle className="w-5 h-5" />
            </div>
          )}

          {rightIcon && !error && (
            <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {/* Helper Text */}
        {helperText && !error && (
          <p id={helperId} className="text-xs text-slate-500">
            {helperText}
          </p>
        )}

        {/* Inline Error Announced Live */}
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
  }
);

AccessibleInput.displayName = "AccessibleInput";

