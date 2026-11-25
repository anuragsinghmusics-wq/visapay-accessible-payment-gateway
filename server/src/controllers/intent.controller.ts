import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { randomUUID } from "crypto";

export class IntentController {
  /**
   * POST /api/v1/payment-intents
   * Creates a shareable payment link / checkout session.
   */
  public static async createIntent(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const b = req.body || {};
      const title = String(b.title || "").trim();
      const description = b.description ? String(b.description).trim() : null;
      const amount = Number(b.amount);
      const currency = String(b.currency || "USD").toUpperCase();

      if (!title || title.length < 3 || !amount || isNaN(amount) || amount <= 0) {
        res.status(400).json({
          success: false,
          error: {
            code: "INVALID_PAYMENT_INTENT",
            message: "Valid title (min 3 chars) and positive amount are required.",
          },
        });
        return;
      }

      const merchantId =
        req.merchant?.merchantId ||
        (await prisma.merchant.findFirst())?.id ||
        "mer_demo_1001";

      const intentId = `pi_${randomUUID().replace(/-/g, "").substring(0, 14)}`;
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      const created = await prisma.paymentIntent.create({
        data: {
          id: intentId,
          merchantId,
          title,
          description,
          amount,
          currency,
          status: "REQUIRES_PAYMENT_METHOD",
          lineItemsJson: JSON.stringify([
            {
              id: `item_${intentId}`,
              name: title,
              description: description || "Direct Payment Link Invoice",
              quantity: 1,
              price: amount,
            },
          ]),
          expiresAt,
        },
      });

      res.status(201).json({
        success: true,
        data: created,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/payment-intents
   */
  public static async listIntents(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.merchant?.merchantId || (await prisma.merchant.findFirst())?.id;
      const intents = await prisma.paymentIntent.findMany({
        where: merchantId ? { merchantId } : {},
        orderBy: { createdAt: "desc" },
        take: 25,
      });

      res.status(200).json({
        success: true,
        data: intents,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/payment-intents/:id
   */
  public static async getIntentById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const intent = await prisma.paymentIntent.findUnique({ where: { id } });

      if (!intent) {
        res.status(404).json({
          success: false,
          error: {
            code: "PAYMENT_INTENT_NOT_FOUND",
            message: `Payment link '${id}' does not exist.`,
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: intent,
      });
    } catch (err) {
      next(err);
    }
  }
}
