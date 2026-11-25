import { PaymentMethod } from "./PaymentMethod.js";

export interface EmiPaymentProps {
  tenureMonths: 3 | 6 | 9 | 12;
  annualInterestRate?: number;
  issuerBank?: string;
}

/**
 * Concrete Domain Model: EmiPayment
 * Extends abstract PaymentMethod for installment / Pay Later credit plans.
 */
export class EmiPayment extends PaymentMethod {
  readonly #tenureMonths: 3 | 6 | 9 | 12;
  readonly #annualInterestRate: number;
  readonly #issuerBank: string;

  constructor(props: EmiPaymentProps) {
    super(`emi_${Math.random().toString(36).substring(2, 10)}`, "emi");
    this.#tenureMonths = props.tenureMonths;
    this.#annualInterestRate = props.annualInterestRate ?? (props.tenureMonths === 3 ? 0 : 13.5);
    this.#issuerBank = props.issuerBank || "VisaPay FlexiCredit";
  }

  public get tenureMonths(): 3 | 6 | 9 | 12 {
    return this.#tenureMonths;
  }

  public get annualInterestRate(): number {
    return this.#annualInterestRate;
  }

  public get issuerBank(): string {
    return this.#issuerBank;
  }

  public calculateMonthlyInstallment(principal: number): number {
    if (this.#annualInterestRate === 0) {
      return Math.round((principal / this.#tenureMonths) * 100) / 100;
    }
    const r = this.#annualInterestRate / 12 / 100;
    const n = this.#tenureMonths;
    const emi = (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    return Math.round(emi * 100) / 100;
  }

  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (![3, 6, 9, 12].includes(this.#tenureMonths)) {
      errors.push("EMI tenure must be 3, 6, 9, or 12 months.");
    }
    return { isValid: errors.length === 0, errors };
  }

  public tokenize(): string {
    return `tok_emi_${this.#tenureMonths}m_${Math.random().toString(36).substring(2, 8)}`;
  }

  public getSummary(): string {
    return `EMI ${this.#tenureMonths} Months (${this.#annualInterestRate}% p.a.)`;
  }
}
