import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { LiveAnnouncerProvider } from "./components/ui/LiveAnnouncer";
import { SkipLink } from "./components/ui/SkipLink";
import { Navbar } from "./components/layout/Navbar";
import { Footer } from "./components/layout/Footer";
import { SandboxDrawer } from "./components/layout/SandboxDrawer";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { ErrorBoundary } from "./components/ui/ErrorBoundary";

import { LandingPage } from "./pages/LandingPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";

export const App: React.FC = () => {
  const [highContrast, setHighContrast] = useState(false);

  return (
    <BrowserRouter>
      <AuthProvider>
        <LiveAnnouncerProvider>
          <ErrorBoundary>
            <div
              className={`min-h-screen flex flex-col ${
                highContrast ? "bg-black text-white" : "bg-slate-50 text-slate-900"
              }`}
            >
              {/* WCAG 2.4.1 Skip-to-content Link */}
              <SkipLink targetId="main-content" />

              {/* Enterprise Navigation Header */}
              <Navbar
                highContrast={highContrast}
                onToggleHighContrast={() => setHighContrast(!highContrast)}
              />

              {/* Main Application Landmark */}
              <main id="main-content" className="flex-1 px-4 sm:px-6 lg:px-8 py-8 max-w-7xl w-full mx-auto">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/checkout" element={<CheckoutPage />} />
                  <Route path="/pay/:intentId" element={<CheckoutPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>

              {/* Accessible Footer */}
              <Footer />

              {/* Collapsible Developer Sandbox Tools */}
              <SandboxDrawer />
            </div>
          </ErrorBoundary>
        </LiveAnnouncerProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
