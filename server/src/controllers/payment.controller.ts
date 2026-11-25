import { Request, Response, NextFunction } from "express";
import { PaymentProcessor, ProcessChargeDTO } from "../services/PaymentProcessor.js";
import { TokenService } from "../services/TokenService.js";
import { CreditCard } from "@visapay/shared";
import { prisma } from "../prisma/client.js";
import { randomUUID } from "crypto";

const VPA_BANK_NAMES: Record<string, string> = {
  visapay: "VisaPay Instant Rails",
  okhdfc: "HDFC Bank UPI",
  oksbi: "State Bank of India UPI",
  icici: "ICICI Bank iMobile UPI",
  paytm: "Paytm Payments Bank",
  ybl: "Yes Bank / PhonePe UPI",
};

export class PaymentController {
  /**
   * POST /api/v1/payments/charge
   * Processes a payment charge across Card, UPI, NetBanking, Wallet, or EMI rails.
   */
  public static async charge(req: Request, res: Response, _next: NextFunction): Promise<void> {
    try {
      const b = req.body || {};

      const amount = Number(b.amount);
      const currency = b.currency || "USD";
      const idempotencyKey =
        (req.headers["idempotency-key"] as string) ||
        b.idempotency_key ||
        b.idempotencyKey;

      if (!amount || isNaN(amount) || amount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_AMOUNT",
            message: "Amount must be a positive number.",
          },
        });
        return;
      }

      if (!idempotencyKey) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_IDEMPOTENCY_KEY",
            message: "An idempotency_key (UUIDv4) is required.",
          },
        });
        return;
      }

      const billing = b.billing_details || b.billingDetails || {};
      if (!billing.name || !billing.email) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_BILLING_DETAILS",
            message: "Billing details must include name and email.",
          },
        });
        return;
      }

      const paymentToken = b.payment_token || b.paymentToken;
      const cardDetails = b.card_details || b.cardDetails;
      const upiDetails = b.upi_details || b.upiDetails;
      const netBankingDetails = b.netbanking_details || b.netBankingDetails;
      const walletDetails = b.wallet_details || b.walletDetails;
      const emiDetails = b.emi_details || b.emiDetails;

      if (
        !paymentToken &&
        !cardDetails &&
        !upiDetails &&
        !netBankingDetails &&
        !walletDetails &&
        !emiDetails
      ) {
        res.status(400).json({
          success: false,
          error: {
            code: "MISSING_PAYMENT_METHOD",
            message: "A payment method or payment_token must be provided.",
          },
        });
        return;
      }

      const chargeDTO: ProcessChargeDTO = {
        amount,
        currency,
        idempotencyKey,
        paymentToken,
        cardDetails: cardDetails
          ? {
              cardNumber: cardDetails.card_number || cardDetails.cardNumber,
              expMonth: cardDetails.exp_month || cardDetails.expMonth,
              expYear: cardDetails.exp_year || cardDetails.expYear,
              cvv: cardDetails.cvv,
              cardholderName: cardDetails.cardholder_name || cardDetails.cardholderName || billing.name,
            }
          : undefined,
        upiDetails: upiDetails ? { vpa: upiDetails.vpa } : undefined,
        netBankingDetails: netBankingDetails
          ? { bankCode: netBankingDetails.bank_code || netBankingDetails.bankCode }
          : undefined,
        walletDetails: walletDetails
          ? {
              provider: walletDetails.provider,
              walletAccountEmail: walletDetails.walletAccountEmail || billing.email,
            }
          : undefined,
        emiDetails: emiDetails
          ? {
              tenureMonths: Number(emiDetails.tenure_months || emiDetails.tenureMonths) as 3 | 6 | 9 | 12,
              issuerBank: emiDetails.issuer_bank || emiDetails.issuerBank,
            }
          : undefined,
        billingDetails: {
          name: billing.name,
          email: billing.email,
          postalCode: billing.postal_code || billing.postalCode || "00000",
          addressLine1: billing.address_line_1 || billing.addressLine1,
          city: billing.city,
          state: billing.state,
          country: billing.country || "US",
        },
        merchantId: req.merchant?.merchantId || b.merchant_id || b.merchantId,
        orderId: b.order_id || b.orderId,
        paymentIntentId: b.payment_intent_id || b.paymentIntentId,
        threeDsVerified: Boolean(b.three_ds_verified || b.threeDsVerified),
        description: b.description,
      };

      const result = await PaymentProcessor.processCharge(chargeDTO);

      if (result.status === "REQUIRES_ACTION") {
        res.status(200).json({
          success: true,
          requires_action: true,
          transaction_id: result.transaction_id,
          status: result.status,
          network: result.network,
          timestamp: result.timestamp,
          data: result,
        });
        return;
      }

      const statusCode = result.status === "APPROVED" ? 201 : 402;
      res.status(statusCode).json({
        success: result.status === "APPROVED",
        transaction_id: result.transaction_id,
        status: result.status,
        network: result.network,
        auth_code: result.auth_code,
        timestamp: result.timestamp,
        data: result,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Payment processing failure.";
      res.status(400).json({
        success: false,
        error: {
          code: "CHARGE_ERROR",
          message,
        },
      });
    }
  }

  /**
   * POST /api/v1/payments/upi/verify
   * Simulates NPCI VPA beneficiary verification before collect/intent dispatch.
   */
  public static async verifyUpiVpa(req: Request, res: Response): Promise<void> {
    const vpa = String(req.body?.vpa || "").trim().toLowerCase();
    if (!/^[\w.-]+@[\w.-]+$/.test(vpa)) {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_VPA",
          message: "VPA must follow username@bankhandle format.",
        },
      });
      return;
    }

    const [prefix, handle] = vpa.split("@");
    const bankName = VPA_BANK_NAMES[handle] || `${handle.toUpperCase()} UPI Handle`;

    let verifiedName = prefix
      .split(/[._-]/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    if (prefix === "alex") verifiedName = "Alex Mercer";
    if (prefix === "declined" || prefix === "fail") verifiedName = "Decline Simulator Account";
    if (prefix === "fraud" || prefix === "block") verifiedName = "Risk Review Account";

    res.status(200).json({
      success: true,
      data: {
        vpa,
        verified: true,
        accountHolderName: verifiedName || "Verified Account Holder",
        bankName,
      },
    });
  }

  /**
   * POST /api/v1/payments/3ds/verify
   * Validates 3D Secure 2.0 ACS One-Time Passcode.
   */
  public static async verifyThreeDsOtp(req: Request, res: Response): Promise<void> {
    const otp = String(req.body?.otp || "").trim();
    if (otp !== "123456") {
      res.status(400).json({
        success: false,
        error: {
          code: "INVALID_3DS_OTP",
          message: "Incorrect authentication OTP. Demo 3DS passcode is 123456.",
        },
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        verified: true,
        threeDsToken: `3ds_eci05_${randomUUID().replace(/-/g, "").substring(0, 12)}`,
      },
    });
  }

  /**
   * POST /api/v1/payments/transactions/:id/refund
   * Processes full or partial refund on an approved transaction.
   */
  public static async refundTransaction(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const amount = req.body?.amount !== undefined ? Number(req.body.amount) : undefined;
      const reason = req.body?.reason as string | undefined;

      const updated = await PaymentProcessor.processRefund(id, amount, reason);

      res.status(200).json({
        success: true,
        data: updated,
        message: "Refund processed successfully.",
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Refund processing failed.";
      res.status(400).json({
        success: false,
        error: {
          code: "REFUND_ERROR",
          message,
        },
      });
    }
  }

  /**
   * POST /api/v1/payments/tokenize
   */
  public static async tokenize(req: Request, res: Response): Promise<void> {
    try {
      const b = req.body || {};
      const cardDetails = b.card_details || b.cardDetails || b;

      const card = new CreditCard({
        cardNumber: cardDetails.card_number || cardDetails.cardNumber || "",
        expMonth: cardDetails.exp_month || cardDetails.expMonth || "",
        expYear: cardDetails.exp_year || cardDetails.expYear || "",
        cvv: cardDetails.cvv || "",
        cardholderName: cardDetails.cardholder_name || cardDetails.cardholderName || "",
      });

      const validation = card.validate();
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          error: {
            code: "CARD_VALIDATION_FAILED",
            message: validation.errors.join("; "),
            details: validation.errors,
          },
        });
        return;
      }

      const token = TokenService.tokenizeCard(card);

      res.status(200).json({
        success: true,
        data: {
          payment_token: token,
          paymentToken: token,
          network: card.network,
          last4: card.last4,
          masked_number: card.getMaskedNumber(),
          exp_month: card.expMonth,
          exp_year: card.expYear,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Tokenization failed.";
      res.status(400).json({
        success: false,
        error: {
          code: "TOKENIZATION_ERROR",
          message,
        },
      });
    }
  }

  /**
   * GET /api/v1/payments/transactions
   */
  public static async getTransactions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
      const skip = (page - 1) * limit;

      const status = req.query.status as string;
      const network = req.query.network as string;
      const paymentRail = req.query.paymentRail as string;
      const search = req.query.search as string;

      const where: Record<string, unknown> = {};

      if (req.merchant?.merchantId) {
        where.merchantId = req.merchant.merchantId;
      }
      if (status) {
        where.status = status.toUpperCase();
      }
      if (network) {
        where.network = network.toLowerCase();
      }
      if (paymentRail) {
        where.paymentRail = paymentRail.toLowerCase();
      }
      if (search) {
        where.OR = [
          { customerName: { contains: search } },
          { customerEmail: { contains: search } },
          { cardLast4: { contains: search } },
          { id: { contains: search } },
        ];
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.transaction.count({ where }),
      ]);

      res.status(200).json({
        success: true,
        data: {
          items: transactions,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/payments/transactions/:id
   */
  public static async getTransactionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const transaction = await prisma.transaction.findUnique({
        where: { id },
      });

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: {
            code: "TRANSACTION_NOT_FOUND",
            message: `Transaction '${id}' was not found.`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction,
      });
    } catch (err) {
      next(err);
    }
  }
}
