import { PaymentMethod } from "./PaymentMethod.js";

export const SUPPORTED_BANKS = [
  { code: "HDFC", name: "HDFC Bank Retail" },
  { code: "ICICI", name: "ICICI Bank Corporate & Retail" },
  { code: "SBI", name: "State Bank of India" },
  { code: "AXIS", name: "Axis Bank" },
  { code: "CHASE", name: "JPMorgan Chase" },
  { code: "CITI", name: "Citibank Online" },
] as const;

export interface NetBankingPaymentProps {
  bankCode: string;
  accountHolderName?: string;
}

/**
 * Concrete Domain Model: NetBankingPayment
 * Extends abstract PaymentMethod for bank portal redirect / ACS settlement.
 */
export class NetBankingPayment extends PaymentMethod {
  readonly #bankCode: string;
  readonly #accountHolderName: string;

  constructor(props: NetBankingPaymentProps) {
    super(`nb_${Math.random().toString(36).substring(2, 10)}`, "netbanking");
    this.#bankCode = (props.bankCode || "").trim().toUpperCase();
    this.#accountHolderName = props.accountHolderName || "Bank Customer";
  }

  public get bankCode(): string {
    return this.#bankCode;
  }

  public get accountHolderName(): string {
    return this.#accountHolderName;
  }

  public get bankName(): string {
    return SUPPORTED_BANKS.find((b) => b.code === this.#bankCode)?.name || this.#bankCode;
  }

  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!this.#bankCode) {
      errors.push("Bank selection is required for NetBanking.");
    } else if (!SUPPORTED_BANKS.some((b) => b.code === this.#bankCode)) {
      errors.push(`Unsupported NetBanking bank code: '${this.#bankCode}'.`);
    }
    return { isValid: errors.length === 0, errors };
  }

  public tokenize(): string {
    return `tok_nb_${this.#bankCode.toLowerCase()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  public getSummary(): string {
    return `NetBanking: ${this.bankName} (${this.#bankCode})`;
  }
}
