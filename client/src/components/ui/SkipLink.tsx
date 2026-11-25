import React from "react";

export interface SkipLinkProps {
  targetId?: string;
  label?: string;
}

/**
 * SkipLink
 * Complies with WCAG 2.4.1 (Bypass Blocks).
 * Allows screen reader and keyboard users to skip directly to main content.
 */
export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId = "main-content",
  label = "Skip to main content",
}) => {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-blue-700 focus:text-white focus:text-sm focus:font-semibold focus:rounded-md focus:shadow-lg focus:outline focus:outline-3 focus:outline-offset-2 focus:outline-blue-500 transition"
    >
      {label}
    </a>
  );
};

