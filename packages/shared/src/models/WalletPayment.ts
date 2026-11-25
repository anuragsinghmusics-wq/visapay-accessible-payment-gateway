import { PaymentMethod } from "./PaymentMethod.js";

export type WalletProvider = "apple_pay" | "google_pay" | "visapay_wallet";

export interface WalletPaymentProps {
  provider: WalletProvider;
  walletAccountEmail?: string;
}

/**
 * Concrete Domain Model: WalletPayment
 * Extends abstract PaymentMethod for tokenized express digital wallets.
 */
export class WalletPayment extends PaymentMethod {
  readonly #provider: WalletProvider;
  readonly #walletAccountEmail: string;

  constructor(props: WalletPaymentProps) {
    super(`wal_${Math.random().toString(36).substring(2, 10)}`, "wallet");
    this.#provider = props.provider;
    this.#walletAccountEmail = (props.walletAccountEmail || "wallet@visapay.demo").trim();
  }

  public get provider(): WalletProvider {
    return this.#provider;
  }

  public get walletAccountEmail(): string {
    return this.#walletAccountEmail;
  }

  public validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allowed: WalletProvider[] = ["apple_pay", "google_pay", "visapay_wallet"];
    if (!allowed.includes(this.#provider)) {
      errors.push(`Unsupported digital wallet provider: '${this.#provider}'.`);
    }
    return { isValid: errors.length === 0, errors };
  }

  public tokenize(): string {
    return `tok_wal_${this.#provider}_${Math.random().toString(36).substring(2, 8)}`;
  }

  public getSummary(): string {
    return `Wallet (${this.#provider.replace("_", " ").toUpperCase()})`;
  }
}
