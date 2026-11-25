import React, { useEffect, useRef } from "react";

export interface FocusTrapProps {
  children: React.ReactNode;
  isActive?: boolean;
  onEscape?: () => void;
  className?: string;
}

/**
 * FocusTrap
 * Complies with WCAG 2.1.2 (No Keyboard Trap) and WCAG 2.4.3 (Focus Order).
 * Traps Tab cycling within active dialog and closes upon Escape keypress.
 */
export const FocusTrap: React.FC<FocusTrapProps> = ({
  children,
  isActive = true,
  onEscape,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Save current active element to restore later
    previouslyFocusedElementRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Focus first focusable element inside trap
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onEscape) {
        e.preventDefault();
        onEscape();
        return;
      }

      if (e.key !== "Tab") return;

      const currentFocusables = container.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );

      if (currentFocusables.length === 0) return;

      const firstElement = currentFocusables[0];
      const lastElement = currentFocusables[currentFocusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      // Restore focus to original trigger element
      if (previouslyFocusedElementRef.current) {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [isActive, onEscape]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

