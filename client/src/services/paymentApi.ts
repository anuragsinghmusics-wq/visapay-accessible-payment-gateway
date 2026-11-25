export interface BillingDetailsPayload {
  name: string;
  email: string;
  postalCode?: string;
  postal_code?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface CardDetailsPayload {
  cardNumber: string;
  card_number?: string;
  expMonth: string;
  exp_month?: string;
  expYear: string;
  exp_year?: string;
  cvv: string;
  cardholderName: string;
  cardholder_name?: string;
}

export interface UpiDetailsPayload {
  vpa: string;
}

export interface NetBankingDetailsPayload {
  bankCode: string;
  bank_code?: string;
}

export interface WalletDetailsPayload {
  provider: "apple_pay" | "google_pay" | "visapay_wallet";
  walletAccountEmail?: string;
}

export interface EmiDetailsPayload {
  tenureMonths: 3 | 6 | 9 | 12;
  tenure_months?: number;
  issuerBank?: string;
}

export interface ChargePayload {
  amount: number;
  currency?: string;
  idempotency_key?: string;
  idempotencyKey?: string;
  payment_token?: string;
  paymentToken?: string;
  card_details?: CardDetailsPayload;
  cardDetails?: CardDetailsPayload;
  upi_details?: UpiDetailsPayload;
  upiDetails?: UpiDetailsPayload;
  netbanking_details?: NetBankingDetailsPayload;
  netBankingDetails?: NetBankingDetailsPayload;
  wallet_details?: WalletDetailsPayload;
  walletDetails?: WalletDetailsPayload;
  emi_details?: EmiDetailsPayload;
  emiDetails?: EmiDetailsPayload;
  billing_details: BillingDetailsPayload;
  billingDetails?: BillingDetailsPayload;
  payment_intent_id?: string;
  three_ds_verified?: boolean;
}

export interface PaymentReceiptData {
  transactionId: string;
  status: "APPROVED" | "DECLINED" | "FAILED" | "REQUIRES_ACTION";
  paymentRail?: string;
  network: string;
  authCode?: string;
  amount: number;
  currency: string;
  last4: string;
  timestamp: string;
  customerName: string;
  customerEmail: string;
  threeDsStatus?: string;
  riskScore?: number;
  latencyMs?: number;
  failureReason?: string;
}

export interface ChargeApiResponse {
  success: boolean;
  requires_action?: boolean;
  transaction_id?: string;
  status: "APPROVED" | "DECLINED" | "FAILED" | "REQUIRES_ACTION";
  network?: string;
  auth_code?: string;
  timestamp?: string;
  data?: {
    transactionId: string;
    status: string;
    paymentRail?: string;
    network: string;
    authCode?: string;
    timestamp: string;
    amount: number;
    currency: string;
    last4: string;
    threeDsRequired?: boolean;
    threeDsStatus?: string;
    riskScore?: number;
    failureReason?: string;
    latencyMs: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

export class PaymentApiClient {
  public static generateUUID(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  public static async charge(payload: ChargePayload): Promise<ChargeApiResponse> {
    const idempotencyKey = payload.idempotency_key || payload.idempotencyKey || this.generateUUID();

    const response = await fetch("/api/v1/payments/charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify({
        ...payload,
        idempotency_key: idempotencyKey,
      }),
    });

    const data: ChargeApiResponse = await response.json();

    if (!response.ok && response.status !== 402) {
      throw new Error(data.error?.message || "Payment gateway processing failure");
    }

    return data;
  }

  public static async verifyUpiVpa(vpa: string): Promise<{
    vpa: string;
    verified: boolean;
    accountHolderName: string;
    bankName: string;
  }> {
    const res = await fetch("/api/v1/payments/upi/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vpa }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || "Could not verify UPI VPA.");
    }
    return json.data;
  }

  public static async verifyThreeDsOtp(otp: string): Promise<{ verified: boolean; threeDsToken: string }> {
    const res = await fetch("/api/v1/payments/3ds/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || "3DS OTP verification failed.");
    }
    return json.data;
  }

  public static async getPaymentIntent(intentId: string) {
    const res = await fetch(`/api/v1/payment-intents/${encodeURIComponent(intentId)}`);
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || "Payment link not found.");
    }
    return json.data;
  }

  public static async refundTransaction(transactionId: string, amount?: number, reason?: string) {
    const res = await fetch(`/api/v1/payments/transactions/${encodeURIComponent(transactionId)}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, reason }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error?.message || "Refund request failed.");
    }
    return json.data;
  }
}
