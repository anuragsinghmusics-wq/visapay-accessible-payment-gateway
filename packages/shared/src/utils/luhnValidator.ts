/**
 * Validates a credit card number using Luhn's Algorithm (Mod 10).
 * Ported and enhanced from original VisaPay luhnValidator.
 */
export function validateLuhn(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\D/g, "");
  if (!sanitized || sanitized.length < 13 || sanitized.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export type CardNetwork = "visa" | "mastercard" | "amex" | "discover" | "unknown";

/**
 * Detects card network based on BIN / IIN ranges.
 */
export function detectCardNetwork(cardNumber: string): CardNetwork {
  const sanitized = cardNumber.replace(/\D/g, "");
  if (/^4/.test(sanitized)) {
    return "visa";
  }
  if (/^(5[1-5]|222[1-9]|22[3-9]|2[3-6]|27[01]|2720)/.test(sanitized)) {
    return "mastercard";
  }
  if (/^3[47]/.test(sanitized)) {
    return "amex";
  }
  if (/^6(?:011|5[0-9]{2})/.test(sanitized)) {
    return "discover";
  }
  return "unknown";
}

/**
 * Formats a card number string with accessible 4-digit grouping.
 */
export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19);
  const network = detectCardNetwork(digits);

  // Amex is typically 4-6-5 digits
  if (network === "amex") {
    const p1 = digits.slice(0, 4);
    const p2 = digits.slice(4, 10);
    const p3 = digits.slice(10, 15);
    return [p1, p2, p3].filter(Boolean).join(" ");
  }

  // Standard 4-4-4-4 grouping
  const parts: string[] = [];
  for (let i = 0; i < digits.length; i += 4) {
    parts.push(digits.slice(i, i + 4));
  }
  return parts.join(" ");
}

