import {
  CreditCard,
  PaymentMethod,
  PaymentMethodFactory,
  Transaction,
  PaymentStrategyResolver,
  CardNetwork,
  Currency,
  PaymentRail,
  TransactionStatus,
  ThreeDsStatus,
} from "@visapay/shared";
import { prisma } from "../prisma/client.js";
import { TokenService } from "./TokenService.js";
import { RiskEngine } from "./RiskEngine.js";
import { WebhookService } from "./WebhookService.js";
import { randomUUID } from "crypto";

export interface ProcessChargeDTO {
  amount: number;
  currency?: Currency;
  idempotencyKey: string;
  paymentToken?: string;
  cardDetails?: {
    cardNumber: string;
    expMonth: string;
    expYear: string;
    cvv: string;
    cardholderName: string;
  };
  upiDetails?: {
    vpa: string;
  };
  netBankingDetails?: {
    bankCode: string;
  };
  walletDetails?: {
    provider: "apple_pay" | "google_pay" | "visapay_wallet";
    walletAccountEmail?: string;
  };
  emiDetails?: {
    tenureMonths: 3 | 6 | 9 | 12;
    issuerBank?: string;
  };
  billingDetails: {
    name: string;
    email: string;
    postalCode?: string;
    addressLine1?: string;
    city?: string;
    state?: string;
    country?: string;
  };
  merchantId?: string;
  orderId?: string;
  paymentIntentId?: string;
  threeDsVerified?: boolean;
  description?: string;
}

export interface ProcessChargeResult {
  transactionId: string;
  transaction_id: string;
  status: "APPROVED" | "DECLINED" | "FAILED" | "REQUIRES_ACTION";
  paymentRail: string;
  network: string;
  authCode?: string;
  auth_code?: string;
  timestamp: string;
  amount: number;
  currency: string;
  cardLast4: string;
  last4: string;
  threeDsRequired?: boolean;
  threeDsStatus: ThreeDsStatus;
  riskScore: number;
  failureReason?: string;
  latencyMs: number;
  token?: string;
}

export class PaymentProcessor {
  /**
   * Resolves default demo merchant when merchantId isn't supplied on public checkout.
   */
  private static async resolveMerchantId(explicitId?: string): Promise<string> {
    if (explicitId) return explicitId;
    const defaultMerchant = await prisma.merchant.findFirst();
    return defaultMerchant?.id || "mer_demo_1001";
  }

  /**
   * Processes a charge request across Card, UPI, NetBanking, Wallet, or EMI rails.
   */
  public static async processCharge(dto: ProcessChargeDTO): Promise<ProcessChargeResult> {
    let network: CardNetwork | PaymentRail = "visa";
    let paymentRail = "card";
    let last4 = "4242";
    let token = dto.paymentToken;
    let paymentMethodInstance: PaymentMethod;

    // 1. Polymorphic rail resolution via Factory Pattern
    if (dto.upiDetails) {
      paymentRail = "upi";
      network = "upi";
      paymentMethodInstance = PaymentMethodFactory.create({
        type: "upi",
        upiDetails: {
          vpa: dto.upiDetails.vpa,
          customerName: dto.billingDetails.name,
        },
      });
      const validation = paymentMethodInstance.validate();
      if (!validation.isValid) {
        throw new Error(`UPI validation error: ${validation.errors.join("; ")}`);
      }
      last4 = dto.upiDetails.vpa.split("@")[1]?.toUpperCase() || "UPI";
      token = paymentMethodInstance.tokenize();
    } else if (dto.netBankingDetails) {
      paymentRail = "netbanking";
      network = "netbanking";
      paymentMethodInstance = PaymentMethodFactory.create({
        type: "netbanking",
        netBankingDetails: {
          bankCode: dto.netBankingDetails.bankCode,
          accountHolderName: dto.billingDetails.name,
        },
      });
      const validation = paymentMethodInstance.validate();
      if (!validation.isValid) {
        throw new Error(`NetBanking validation error: ${validation.errors.join("; ")}`);
      }
      last4 = dto.netBankingDetails.bankCode.toUpperCase();
      token = paymentMethodInstance.tokenize();
    } else if (dto.walletDetails) {
      paymentRail = "wallet";
      network = "wallet";
      paymentMethodInstance = PaymentMethodFactory.create({
        type: "wallet",
        walletDetails: {
          provider: dto.walletDetails.provider,
          walletAccountEmail: dto.walletDetails.walletAccountEmail || dto.billingDetails.email,
        },
      });
      const validation = paymentMethodInstance.validate();
      if (!validation.isValid) {
        throw new Error(`Wallet validation error: ${validation.errors.join("; ")}`);
      }
      last4 = dto.walletDetails.provider === "apple_pay" ? "APAY" : dto.walletDetails.provider === "google_pay" ? "GPAY" : "VPAY";
      token = paymentMethodInstance.tokenize();
    } else if (dto.emiDetails) {
      paymentRail = "emi";
      network = "emi";
      paymentMethodInstance = PaymentMethodFactory.create({
        type: "emi",
        emiDetails: {
          tenureMonths: dto.emiDetails.tenureMonths,
          issuerBank: dto.emiDetails.issuerBank,
        },
      });
      const validation = paymentMethodInstance.validate();
      if (!validation.isValid) {
        throw new Error(`EMI validation error: ${validation.errors.join("; ")}`);
      }
      last4 = `${dto.emiDetails.tenureMonths}M`;
      token = paymentMethodInstance.tokenize();
    } else if (dto.paymentToken) {
      const resolved = TokenService.resolveToken(dto.paymentToken);
      if (!resolved) {
        throw new Error(`Invalid or expired payment token: ${dto.paymentToken}`);
      }
      network = resolved.network;
      last4 = resolved.last4;
      paymentMethodInstance = PaymentMethodFactory.create({
        type: "credit_card",
        cardDetails: {
          cardNumber: `${network === "visa" ? "4" : network === "mastercard" ? "5" : "3"}00000000000${last4}`,
          expMonth: "12",
          expYear: "2028",
          cvv: network === "amex" ? "1234" : "123",
          cardholderName: dto.billingDetails.name,
        },
      });
    } else if (dto.cardDetails) {
      const cardInstance = PaymentMethodFactory.create({
        type: "credit_card",
        cardDetails: dto.cardDetails,
      }) as CreditCard;

      const validation = cardInstance.validate();
      if (!validation.isValid) {
        throw new Error(`Card validation error: ${validation.errors.join("; ")}`);
      }

      network = cardInstance.network;
      last4 = cardInstance.last4;
      token = TokenService.tokenizeCard(cardInstance);
      paymentMethodInstance = cardInstance;
    } else {
      throw new Error("A valid payment method or payment_token must be provided.");
    }

    const targetMerchantId = await this.resolveMerchantId(dto.merchantId);

    // 2. Risk & 3D Secure 2.0 Evaluation
    const risk = RiskEngine.evaluate({
      amount: dto.amount,
      currency: dto.currency || "USD",
      paymentRail,
      cardLast4: last4,
      threeDsVerified: dto.threeDsVerified,
    });

    if (risk.threeDsRequired) {
      await WebhookService.emitEvent({
        merchantId: targetMerchantId,
        eventType: "three_ds.challenged",
        data: {
          amount: dto.amount,
          currency: dto.currency || "USD",
          network,
          last4,
          riskScore: risk.riskScore,
          reason: risk.reason,
        },
      });

      return {
        transactionId: `txn_3ds_${randomUUID().replace(/-/g, "").substring(0, 8)}`,
        transaction_id: `txn_3ds_${randomUUID().replace(/-/g, "").substring(0, 8)}`,
        status: "REQUIRES_ACTION",
        paymentRail,
        network: String(network).toUpperCase(),
        timestamp: new Date().toISOString(),
        amount: dto.amount,
        currency: dto.currency || "USD",
        cardLast4: last4,
        last4,
        threeDsRequired: true,
        threeDsStatus: "CHALLENGED",
        riskScore: risk.riskScore,
        latencyMs: 35,
        token,
      };
    }

    const transactionId = `txn_${network}_${randomUUID().replace(/-/g, "").substring(0, 10)}`;

    // 3. Instantiate OOD Transaction Domain Model
    const domainTransaction = new Transaction({
      id: transactionId,
      merchantId: targetMerchantId,
      amount: dto.amount,
      currency: dto.currency || "USD",
      paymentRail,
      network,
      cardLast4: last4,
      threeDsStatus: risk.threeDsStatus,
      riskScore: risk.riskScore,
      idempotencyKey: dto.idempotencyKey,
      customerName: dto.billingDetails.name,
      customerEmail: dto.billingDetails.email,
      billingDetails: {
        name: dto.billingDetails.name,
        email: dto.billingDetails.email,
        postalCode: dto.billingDetails.postalCode || "00000",
        addressLine1: dto.billingDetails.addressLine1,
        city: dto.billingDetails.city,
        state: dto.billingDetails.state,
        country: dto.billingDetails.country || "US",
      },
    });

    // 4. Execute Settlement Strategy Pattern
    const strategy = PaymentStrategyResolver.resolve(network);
    const authResult = await strategy.process(domainTransaction, paymentMethodInstance);

    if (authResult.isApproved) {
      domainTransaction.approve(authResult.authCode || "AUTH_OK", authResult.latencyMs);
    } else {
      domainTransaction.decline(authResult.declineReason || "Declined by network", authResult.latencyMs);
    }

    const status = authResult.isApproved ? "APPROVED" : "DECLINED";
    const authCode = authResult.authCode || "N/A";
    const failureReason = authResult.declineReason || null;

    // 5. Persist transaction + update PaymentIntent if applicable
    await prisma.transaction.create({
      data: {
        id: transactionId,
        merchantId: targetMerchantId,
        amount: dto.amount,
        refundedAmount: 0,
        currency: dto.currency || "USD",
        status,
        paymentRail,
        network: String(network),
        cardLast4: last4,
        authCode,
        threeDsStatus: risk.threeDsStatus,
        riskScore: risk.riskScore,
        idempotencyKey: dto.idempotencyKey,
        customerName: dto.billingDetails.name,
        customerEmail: dto.billingDetails.email,
        failureReason,
        latencyMs: authResult.latencyMs,
        metadataJson: JSON.stringify({
          orderId: dto.orderId,
          paymentIntentId: dto.paymentIntentId,
          description: dto.description,
        }),
      },
    });

    if (dto.paymentIntentId && status === "APPROVED") {
      await prisma.paymentIntent
        .update({
          where: { id: dto.paymentIntentId },
          data: { status: "SUCCEEDED", transactionId },
        })
        .catch(() => {});
    }

    // 6. Emit cryptographically signed Webhook Event
    await WebhookService.emitEvent({
      merchantId: targetMerchantId,
      eventType: status === "APPROVED" ? "charge.succeeded" : "charge.failed",
      transactionId,
      data: {
        id: transactionId,
        amount: dto.amount,
        currency: dto.currency || "USD",
        status,
        payment_rail: paymentRail,
        network: authResult.network,
        last4,
        three_ds_status: risk.threeDsStatus,
        risk_score: risk.riskScore,
        failure_reason: failureReason,
      },
    });

    return {
      transactionId: domainTransaction.id,
      transaction_id: domainTransaction.id,
      status,
      paymentRail,
      network: authResult.network,
      authCode: authResult.authCode,
      auth_code: authResult.authCode,
      timestamp: domainTransaction.createdAt.toISOString(),
      amount: dto.amount,
      currency: dto.currency || "USD",
      cardLast4: last4,
      last4,
      threeDsRequired: false,
      threeDsStatus: risk.threeDsStatus,
      riskScore: risk.riskScore,
      failureReason: failureReason || undefined,
      latencyMs: authResult.latencyMs,
      token,
    };
  }

  /**
   * Executes full or partial refund through the Transaction state machine.
   */
  public static async processRefund(
    transactionId: string,
    refundAmount?: number,
    reason?: string
  ) {
    const record = await prisma.transaction.findUnique({ where: { id: transactionId } });
    if (!record) {
      throw new Error(`Transaction '${transactionId}' not found.`);
    }

    const domainTxn = new Transaction({
      id: record.id,
      merchantId: record.merchantId,
      amount: record.amount,
      refundedAmount: record.refundedAmount,
      currency: record.currency as Currency,
      status: record.status as TransactionStatus,
      paymentRail: record.paymentRail,
      network: record.network as PaymentRail,
      cardLast4: record.cardLast4,
      authCode: record.authCode,
      threeDsStatus: record.threeDsStatus as ThreeDsStatus,
      riskScore: record.riskScore,
      idempotencyKey: record.idempotencyKey,
      customerName: record.customerName,
      customerEmail: record.customerEmail,
      failureReason: record.failureReason || undefined,
      latencyMs: record.latencyMs || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });

    domainTxn.refund(reason, refundAmount);

    const updated = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: domainTxn.status,
        refundedAmount: domainTxn.refundedAmount,
        failureReason: domainTxn.failureReason,
      },
    });

    await WebhookService.emitEvent({
      merchantId: record.merchantId,
      eventType: "charge.refunded",
      transactionId: record.id,
      data: {
        id: record.id,
        refunded_amount: domainTxn.refundedAmount,
        total_amount: record.amount,
        currency: record.currency,
        status: domainTxn.status,
        reason: domainTxn.failureReason,
      },
    });

    return updated;
  }
}
