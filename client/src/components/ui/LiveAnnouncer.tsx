import React, { createContext, useContext, useState, useCallback } from "react";

interface AnnouncerContextValue {
  announce: (message: string, politeness?: "polite" | "assertive") => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

/**
 * LiveAnnouncer Provider
 * Enforces WCAG 4.1.3 (Status Messages)
 * Injects invisible polite/assertive aria-live regions into the DOM
 */
export const LiveAnnouncerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [politeMessage, setPoliteMessage] = useState("");
  const [assertiveMessage, setAssertiveMessage] = useState("");

  const announce = useCallback((message: string, politeness: "polite" | "assertive" = "polite") => {
    if (politeness === "assertive") {
      setAssertiveMessage("");
      setTimeout(() => setAssertiveMessage(message), 50);
    } else {
      setPoliteMessage("");
      setTimeout(() => setPoliteMessage(message), 50);
    }
  }, []);

  return (
    <AnnouncerContext.Provider value={{ announce }}>
      {children}
      {/* Polite live region for general updates */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="a11y-live-polite"
      >
        {politeMessage}
      </div>

      {/* Assertive live region for critical errors */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
        id="a11y-live-assertive"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
};

export function useAnnouncer(): AnnouncerContextValue {
  const context = useContext(AnnouncerContext);
  if (!context) {
    // Graceful fallback if used outside provider
    return {
      announce: (msg: string) => console.log(`[A11y Announce]: ${msg}`),
    };
  }
  return context;
}

