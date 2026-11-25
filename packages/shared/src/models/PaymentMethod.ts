export type PaymentMethodKind =
  | "credit_card"
  | "debit_card"
  | "upi"
  | "netbanking"
  | "wallet"
  | "emi"
  | "bank_transfer";

/**
 * Abstract Domain Model: PaymentMethod
 * Demonstrates Object-Oriented Design (OOD): Encapsulation & Abstraction
 */
export abstract class PaymentMethod {
  readonly #id: string;
  readonly #type: PaymentMethodKind;
  readonly #createdAt: Date;

  constructor(id: string, type: PaymentMethodKind) {
    this.#id = id;
    this.#type = type;
    this.#createdAt = new Date();
  }

  public get id(): string {
    return this.#id;
  }

  public get type(): PaymentMethodKind {
    return this.#type;
  }

  public get createdAt(): Date {
    return this.#createdAt;
  }

  public abstract validate(): { isValid: boolean; errors: string[] };
  public abstract tokenize(): string;
  public abstract getSummary(): string;
}
