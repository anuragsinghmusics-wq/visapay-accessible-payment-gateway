import { PaymentMethod } from "./PaymentMethod.js";
import { validateLuhn, detectCardNetwork, CardNetwork } from "../utils/luhnValidator.js";

export interface CreditCardProps {
  id?: string;
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  cardholderName: string;
}

/**
 * Concrete Domain Model: CreditCard
 * Demonstrates Inheritance, Encapsulation, and Polymorphism
 */
export class CreditCard extends PaymentMethod {
  readonly #cardNumber: string;
  readonly #expMonth: string;
  readonly #expYear: string;
  readonly #cvv: string;
  readonly #cardholderName: string;
  readonly #network: CardNetwork;

  constructor(props: CreditCardProps) {
    super(props.id || `pm_${Math.random().toString(36).substring(2, 9)}`, "credit_card");
    this.#cardNumber = props.cardNumber.replace(/\D/g, "");
    this.#expMonth = props.expMonth.padStart(2, "0");
    this.#expYear = props.expYear.length === 2 ? `20${props.expYear}` : props.expYear;
    this.#cvv = props.cvv.trim();
    this.#cardholderName = props.cardholderName.trim();
    this.#network = detectCardNetwork(this.#cardNumber);
  }

  public get cardholderName(): string {
    return this.#cardholderName;
  }

  public get expMonth(): string {
    return this.#expMonth;
  }

  public get expYear(): string {
    return this.#expYear;
  }

  public get network(): CardNetwork {
    return this.#network;
  }

  public get last4(): string {
    return this.#cardNumber.slice(-4);
  }

  /**
   * Returns PCI-safe masked representation (e.g. •••• •••• •••• 4242)
   */
  public getMaskedNumber(): string {
    const l4 = this.last4;
    if (this.#network === "amex") {
      return `•••• •••••• •${l4}`;
    }
    return `•••• •••• •••• ${l4}`;
  }

  /**
   * Check if card is currently expired against UTC current date
   */
  public isExpired(): boolean {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1; // 1-12

    const expY = parseInt(this.#expYear, 10);
    const expM = parseInt(this.#expMonth, 10);

    if (isNaN(expY) || isNaN(expM)) return true;
    if (expY < currentYear) return true;
    if (expY === currentYear && expM < currentMonth) return true;

    return false;
  }

  /**
   * Domain validation incorporating Luhn checksum, date verification, and CVV checks
   */
  public override validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.#cardNumber || this.#cardNumber.length < 13 || this.#cardNumber.length > 19) {
      errors.push("Card number length must be between 13 and 19 digits.");
    } else if (!validateLuhn(this.#cardNumber)) {
      errors.push("Card number failed Luhn checksum validation (Mod 10).");
    }

    if (!/^(0[1-9]|1[0-2])$/.test(this.#expMonth)) {
      errors.push("Invalid expiration month (must be 01-12).");
    }

    if (this.isExpired()) {
      errors.push("Card has expired.");
    }

    const expectedCvvLength = this.#network === "amex" ? 4 : 3;
    if (this.#cvv.length !== expectedCvvLength) {
      errors.push(`CVV must be ${expectedCvvLength} digits for ${this.#network.toUpperCase()}.`);
    }

    if (!this.#cardholderName || this.#cardholderName.length < 2) {
      errors.push("Cardholder name is required.");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Generates a simulated PCI-compliant payment token
   */
  public override tokenize(): string {
    const validation = this.validate();
    if (!validation.isValid) {
      throw new Error(`Cannot tokenize invalid card: ${validation.errors.join("; ")}`);
    }
    const tokenSuffix = Math.random().toString(36).substring(2, 10);
    return `tok_${this.#network}_${this.last4}_${tokenSuffix}`;
  }

  public override getSummary(): string {
    return `${this.#network.toUpperCase()} ending in ${this.last4} (exp: ${this.#expMonth}/${this.#expYear})`;
  }
}

