export interface Merchant {
  id: string;
  name: string;
  email: string;
  apiKey: string;
  webhookUrl?: string;
  webhookSecret?: string;
  createdAt: string;
}

export interface WebhookEventDTO {
  id: string;
  eventType: string;
  transactionId?: string | null;
  payloadJson: string;
  hmacSignature: string;
  targetUrl: string;
  statusCode: number;
  deliveryStatus: string;
  attempts: number;
  latencyMs: number;
  createdAt: string;
}

export interface PaymentIntentDTO {
  id: string;
  title: string;
  description?: string | null;
  amount: number;
  currency: string;
  status: string;
  transactionId?: string | null;
  expiresAt: string;
  createdAt: string;
}

export interface MerchantDashboardStats {
  totalVolume: number;
  refundedVolume: number;
  netVolume: number;
  totalTransactions: number;
  approvedCount: number;
  declinedCount: number;
  refundedCount: number;
  approvalRate: number;
  averageTicketSize: number;
  currency: string;
  volumeByDay: Array<{
    date: string;
    volume: number;
    count: number;
  }>;
  volumeByNetwork: Array<{
    network: string;
    volume: number;
    percentage: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    refundedAmount: number;
    currency: string;
    status: string;
    paymentRail: string;
    network: string;
    last4: string;
    authCode: string;
    threeDsStatus: string;
    riskScore: number;
    customerName: string;
    customerEmail: string;
    failureReason?: string | null;
    latencyMs?: number | null;
    createdAt: string;
  }>;
}
