import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { AccessibleButton } from "./AccessibleButton";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Accessible Error Boundary (WCAG 3.3.1 Error Identification / 2.1.1 Keyboard)
 * Prevents full-application crashes and presents a keyboard-traversable recovery dialog.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public override state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary caught an uncaught exception]:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetToHome = () => {
    window.location.href = "/";
  };

  public override render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-[60vh] flex items-center justify-center p-6"
        >
          <div className="max-w-md w-full bg-white rounded-3xl border border-rose-200 shadow-xl p-8 text-center space-y-6">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <AlertTriangle className="w-7 h-7" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Something went wrong
              </h1>
              <p className="text-xs text-slate-600 leading-relaxed">
                An unexpected interface error occurred during this session. Your payment
                information is completely safe and no charge was processed.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left">
                <p className="text-[11px] font-mono text-slate-600 break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <AccessibleButton
                onClick={this.handleReload}
                variant="primary"
                className="flex-1 justify-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                Reload Page
              </AccessibleButton>

              <AccessibleButton
                onClick={this.handleResetToHome}
                variant="outline"
                className="flex-1 justify-center"
              >
                <Home className="w-4 h-4 mr-2" aria-hidden="true" />
                Return Home
              </AccessibleButton>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

