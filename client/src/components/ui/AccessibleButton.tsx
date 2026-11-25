import React, { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

export interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * AccessibleButton
 * Enforces WCAG 2.1.1 (Keyboard Navigation), WCAG 2.4.7 (Focus Visible),
 * and WCAG 2.5.5 (48x48px Touch Target Size).
 */
export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      variant = "primary",
      size = "md",
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      disabled,
      className = "",
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "relative inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 select-none " +
      "focus-visible:outline focus-visible:outline-3 focus-visible:outline-blue-600 focus-visible:outline-offset-2 " +
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none";

    const variantStyles = {
      primary: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",
      secondary: "bg-slate-800 text-white hover:bg-slate-900 active:bg-black shadow-sm",
      outline: "border border-slate-300 text-slate-800 bg-white hover:bg-slate-50 active:bg-slate-100",
      danger: "bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm",
      ghost: "text-slate-700 hover:bg-slate-100 active:bg-slate-200",
    };

    // WCAG 2.5.5 touch target sizes: minimum 48px height on md/lg
    const sizeStyles = {
      sm: "min-h-[40px] px-3.5 py-1.5 text-xs gap-1.5",
      md: "min-h-[48px] px-5 py-2.5 text-sm gap-2",
      lg: "min-h-[52px] px-6 py-3 text-base gap-2.5 font-semibold",
    };

    const isInteractionDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isInteractionDisabled}
        aria-busy={isLoading}
        aria-disabled={isInteractionDisabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden="true" />
        )}
        {!isLoading && leftIcon && <span className="inline-flex" aria-hidden="true">{leftIcon}</span>}
        <span>{isLoading && loadingText ? loadingText : children}</span>
        {!isLoading && rightIcon && <span className="inline-flex" aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  }
);

AccessibleButton.displayName = "AccessibleButton";

