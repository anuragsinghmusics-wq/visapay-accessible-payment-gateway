import { CardNetwork, PaymentRail, Currency, BillingDetails } from "./payment.types.js";

export type TransactionStatus =
  | "APPROVED"
  | "DECLINED"
  | "PENDING"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED"
  | "FAILED";

export type ThreeDsStatus = "NOT_REQUIRED" | "CHALLENGED" | "AUTHENTICATED" | "FAILED";

export interface TransactionRecord {
  id: string;
  merchantId: string;
  amount: number;
  refundedAmount: number;
  currency: Currency;
  status: TransactionStatus;
  paymentRail: string;
  network: CardNetwork | PaymentRail;
  cardLast4: string;
  authCode: string;
  threeDsStatus: ThreeDsStatus;
  riskScore: number;
  idempotencyKey: string;
  customerName: string;
  customerEmail: string;
  billingDetails?: BillingDetails;
  failureReason?: string;
  latencyMs?: number;
  createdAt: string;
  updatedAt: string;
}

export type TransactionDTO = TransactionRecord;

export interface ChargeResponse {
  transactionId: string;
  status: TransactionStatus;
  network: string;
  authCode?: string;
  timestamp: string;
  amount: number;
  currency: Currency;
  last4: string;
  message: string;
  receiptUrl?: string;
  threeDsRequired?: boolean;
  riskScore?: number;
}
