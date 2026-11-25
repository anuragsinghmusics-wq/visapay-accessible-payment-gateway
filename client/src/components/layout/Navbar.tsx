import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  CreditCard,
  LayoutDashboard,
  Home,
  LogIn,
  LogOut,
  Contrast,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";

export interface NavbarProps {
  highContrast: boolean;
  onToggleHighContrast: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ highContrast, onToggleHighContrast }) => {
  const { merchant, isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { path: "/", label: "Platform", icon: Home },
    { path: "/checkout", label: "Checkout", icon: CreditCard },
    { path: "/dashboard", label: "Merchant Console", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link
            to="/"
            className="flex items-center space-x-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 p-1 group"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-900 group-hover:bg-blue-700 transition-colors flex items-center justify-center text-white shadow-sm">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M4 7L10.5 18L17 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 13.5L20 6"
                  stroke="#38BDF8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div className="flex items-center space-x-2.5">
              <span className="text-lg font-extrabold tracking-tight text-slate-900">
                VisaPay
              </span>
              <span className="hidden lg:inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Gateway
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav aria-label="Primary Navigation" className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  aria-current={isActive ? "page" : undefined}
                  className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 ${
                    isActive
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  } focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={onToggleHighContrast}
              aria-pressed={highContrast}
              aria-label="Toggle High Contrast Accessibility Mode"
              title="Toggle High Contrast (WCAG 1.4.3)"
              className={`inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-lg border transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600 ${
                highContrast
                  ? "bg-amber-400 text-black border-amber-500"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Contrast className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="hidden sm:inline">{highContrast ? "Standard" : "Contrast"}</span>
            </button>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-2.5 pl-2 border-l border-slate-200">
                <div className="flex items-center space-x-1.5 text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                  <span className="max-w-[130px] truncate">{merchant?.name}</span>
                </div>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center space-x-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-rose-600 transition"
                >
                  <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:inline-flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
              >
                <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Merchant Portal</span>
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              className="md:hidden p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="md:hidden py-3 border-t border-slate-100 space-y-1.5 animate-fade-in"
          >
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-semibold ${
                    isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-rose-700 hover:bg-rose-50"
                >
                  <LogOut className="w-4 h-4" aria-hidden="true" />
                  <span>Sign Out ({merchant?.name})</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white"
                >
                  <LogIn className="w-4 h-4" aria-hidden="true" />
                  <span>Merchant Portal Login</span>
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
