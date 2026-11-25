import { PaymentMethod } from "./PaymentMethod.js";

export interface UpiPaymentProps {
  vpa: string; // e.g., user@okhdfc, alex@visapay
  customerName?: string;
}

/**
 * Concrete Domain Model: UpiPayment
 * Extends abstract PaymentMethod for UPI (Unified Payments Interface) / Instant VPA rails.
 * Demonstrates Open-Closed Principle (OCP) in Object-Oriented Design.
 */
export class UpiPayment extends PaymentMethod {
  readonly #vpa: string;
  readonly #customerName: string;

  constructor(props: UpiPaymentProps) {
    super(`upi_${Math.random().toString(36).substring(2, 10)}`, "wallet");
    this.#vpa = (props.vpa || "").trim().toLowerCase();
    this.#customerName = props.customerName || "UPI Customer";
  }

  public get vpa(): string {
    return this.#vpa;
  }

  public get customerName(): string {
    return this.#customerName;
  }

  public get handle(): string {
    const parts = this.#vpa.split("@");
    return parts.length > 1 ? `@${parts[1]}` : "";
  }

  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const vpaRegex = /^[\w.-]+@[\w.-]+$/;

    if (!this.#vpa) {
      errors.push("Virtual Payment Address (VPA) is required.");
    } else if (!vpaRegex.test(this.#vpa)) {
      errors.push("Invalid UPI VPA format. Must be like username@bank or id@visapay.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public tokenize(): string {
    const sanitized = this.#vpa.replace(/[@.]/g, "_");
    return `tok_upi_${sanitized}_${Math.random().toString(36).substring(2, 8)}`;
  }

  public getSummary(): string {
    return `UPI: ${this.#vpa}`;
  }
}

