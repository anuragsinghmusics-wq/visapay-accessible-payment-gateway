import { z } from "zod";
import { validateLuhn } from "../utils/luhnValidator.js";

export const billingDetailsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().min(2, "Postal code required").max(12),
  country: z.string().optional().default("US"),
});

export const cardDetailsSchema = z.object({
  cardNumber: z
    .string()
    .min(13, "Card number must be 13-19 digits")
    .max(23)
    .refine((val) => validateLuhn(val), {
      message: "Card number failed Luhn checksum validation",
    }),
  expMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, "Expiry month must be MM (01-12)"),
  expYear: z.string().regex(/^(20[2-9][0-9]|[2-9][0-9])$/, "Invalid expiry year (YY or YYYY)"),
  cvv: z.string().regex(/^[0-9]{3,4}$/, "CVV must be 3 or 4 digits"),
  cardholderName: z.string().min(2, "Cardholder name is required"),
});

export const upiDetailsSchema = z.object({
  vpa: z
    .string()
    .min(3, "Virtual Payment Address is required")
    .max(50)
    .regex(/^[\w.-]+@[\w.-]+$/, "Invalid UPI VPA (e.g. username@bank or id@visapay)"),
});

export const netBankingDetailsSchema = z.object({
  bankCode: z.string().min(2, "Bank code is required").max(20),
});

export const walletDetailsSchema = z.object({
  provider: z.enum(["apple_pay", "google_pay", "visapay_wallet"]),
  walletAccountEmail: z.string().email().optional(),
});

export const emiDetailsSchema = z.object({
  tenureMonths: z.union([z.literal(3), z.literal(6), z.literal(9), z.literal(12)]),
  issuerBank: z.string().optional(),
});

export const chargeRequestSchema = z
  .object({
    amount: z.number().positive("Amount must be greater than zero"),
    currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"]).default("USD"),
    idempotencyKey: z.string().uuid("Idempotency key must be a valid UUIDv4"),
    paymentToken: z.string().optional(),
    cardDetails: cardDetailsSchema.optional(),
    upiDetails: upiDetailsSchema.optional(),
    netBankingDetails: netBankingDetailsSchema.optional(),
    walletDetails: walletDetailsSchema.optional(),
    emiDetails: emiDetailsSchema.optional(),
    billingDetails: billingDetailsSchema,
    merchantId: z.string().optional(),
    orderId: z.string().optional(),
    paymentIntentId: z.string().optional(),
    threeDsVerified: z.boolean().optional(),
    description: z.string().max(255).optional(),
  })
  .refine(
    (data) =>
      Boolean(
        data.paymentToken ||
          data.cardDetails ||
          data.upiDetails ||
          data.netBankingDetails ||
          data.walletDetails ||
          data.emiDetails
      ),
    {
      message: "At least one valid payment method or token must be provided",
      path: ["cardDetails"],
    }
  );

export const refundRequestSchema = z.object({
  amount: z.number().positive("Refund amount must be positive").optional(),
  reason: z.string().max(200).optional(),
});

export const paymentIntentSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120),
  description: z.string().max(300).optional(),
  amount: z.number().positive("Amount must be greater than zero"),
  currency: z.enum(["USD", "EUR", "GBP", "CAD", "AUD", "JPY", "INR"]).default("USD"),
});

export type ChargeRequestInput = z.infer<typeof chargeRequestSchema>;
export type CardDetailsInput = z.infer<typeof cardDetailsSchema>;
export type UpiDetailsInput = z.infer<typeof upiDetailsSchema>;
export type NetBankingDetailsInput = z.infer<typeof netBankingDetailsSchema>;
export type WalletDetailsInput = z.infer<typeof walletDetailsSchema>;
export type EmiDetailsInput = z.infer<typeof emiDetailsSchema>;
export type BillingDetailsInput = z.infer<typeof billingDetailsSchema>;
export type RefundRequestInput = z.infer<typeof refundRequestSchema>;
export type PaymentIntentInput = z.infer<typeof paymentIntentSchema>;
