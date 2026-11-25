import { CardNetwork } from "../utils/luhnValidator.js";
export type { CardNetwork };

export type PaymentRail = CardNetwork | "upi" | "netbanking" | "wallet" | "emi";
export type Currency = "USD" | "EUR" | "GBP" | "CAD" | "AUD" | "JPY" | "INR";

export interface BillingDetails {
  name: string;
  email: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  postalCode: string;
  country?: string;
}

export interface CardDetails {
  cardNumber: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  cardholderName: string;
}

export interface UpiDetails {
  vpa: string;
}

export interface NetBankingDetails {
  bankCode: string;
}

export interface WalletDetails {
  provider: "apple_pay" | "google_pay" | "visapay_wallet";
  walletAccountEmail?: string;
}

export interface EmiDetails {
  tenureMonths: 3 | 6 | 9 | 12;
  issuerBank?: string;
}

export interface PaymentToken {
  token: string;
  last4: string;
  expMonth: string;
  expYear: string;
  network: CardNetwork;
  createdAt: string;
}

export interface ChargeRequest {
  amount: number;
  currency: Currency;
  idempotencyKey: string;
  paymentToken?: string;
  cardDetails?: CardDetails;
  upiDetails?: UpiDetails;
  netBankingDetails?: NetBankingDetails;
  walletDetails?: WalletDetails;
  emiDetails?: EmiDetails;
  billingDetails: BillingDetails;
  merchantId?: string;
  orderId?: string;
  paymentIntentId?: string;
  threeDsVerified?: boolean;
  description?: string;
}
