import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { WebhookService } from "../services/WebhookService.js";
import { randomUUID } from "crypto";

export class MerchantController {
  /**
   * GET /api/v1/merchants/dashboard
   * Returns aggregated telemetry, refund totals, and analytics for merchant dashboard
   */
  public static async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.merchant?.merchantId || (req.query.merchantId as string);
      const where: Record<string, unknown> = {};
      if (merchantId) {
        where.merchantId = merchantId;
      }

      const allTransactions = await prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });

      const totalTransactions = allTransactions.length;
      const settledTransactions = allTransactions.filter(
        (t) =>
          t.status === "APPROVED" ||
          t.status === "PARTIALLY_REFUNDED" ||
          t.status === "REFUNDED"
      );
      const approvedCount = allTransactions.filter(
        (t) => t.status === "APPROVED" || t.status === "PARTIALLY_REFUNDED"
      ).length;
      const declinedCount = allTransactions.filter((t) => t.status === "DECLINED").length;
      const refundedCount = allTransactions.filter(
        (t) => t.status === "REFUNDED" || t.status === "PARTIALLY_REFUNDED"
      ).length;

      const totalVolume = settledTransactions.reduce((acc, t) => acc + t.amount, 0);
      const refundedVolume = allTransactions.reduce((acc, t) => acc + (t.refundedAmount || 0), 0);
      const netVolume = Math.max(0, totalVolume - refundedVolume);

      const approvalRate =
        totalTransactions > 0 ? (settledTransactions.length / totalTransactions) * 100 : 100;
      const averageTicketSize =
        settledTransactions.length > 0 ? totalVolume / settledTransactions.length : 0;

      const dayMap = new Map<string, { volume: number; count: number }>();
      for (const t of settledTransactions) {
        const dateKey = t.createdAt.toISOString().split("T")[0];
        const existing = dayMap.get(dateKey) || { volume: 0, count: 0 };
        existing.volume += t.amount;
        existing.count += 1;
        dayMap.set(dateKey, existing);
      }

      const volumeByDay = Array.from(dayMap.entries())
        .map(([date, data]) => ({
          date,
          volume: Math.round(data.volume * 100) / 100,
          count: data.count,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const networkMap = new Map<string, number>();
      for (const t of settledTransactions) {
        const net = t.network.toLowerCase();
        const current = networkMap.get(net) || 0;
        networkMap.set(net, current + t.amount);
      }

      const volumeByNetwork = Array.from(networkMap.entries()).map(([network, volume]) => ({
        network: network.toUpperCase(),
        volume: Math.round(volume * 100) / 100,
        percentage: totalVolume > 0 ? Math.round((volume / totalVolume) * 1000) / 10 : 0,
      }));

      const recentTransactions = allTransactions.slice(0, 50).map((t) => ({
        id: t.id,
        amount: t.amount,
        refundedAmount: t.refundedAmount || 0,
        currency: t.currency,
        status: t.status,
        paymentRail: t.paymentRail || "card",
        network: t.network,
        last4: t.cardLast4,
        authCode: t.authCode,
        threeDsStatus: t.threeDsStatus || "NOT_REQUIRED",
        riskScore: t.riskScore ?? 12,
        customerName: t.customerName,
        customerEmail: t.customerEmail,
        failureReason: t.failureReason,
        latencyMs: t.latencyMs,
        createdAt: t.createdAt.toISOString(),
      }));

      res.status(200).json({
        success: true,
        data: {
          totalVolume: Math.round(totalVolume * 100) / 100,
          refundedVolume: Math.round(refundedVolume * 100) / 100,
          netVolume: Math.round(netVolume * 100) / 100,
          totalTransactions,
          approvedCount,
          declinedCount,
          refundedCount,
          approvalRate: Math.round(approvalRate * 10) / 10,
          averageTicketSize: Math.round(averageTicketSize * 100) / 100,
          currency: "USD",
          volumeByDay,
          volumeByNetwork,
          recentTransactions,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/merchants/webhooks
   */
  public static async getWebhooks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.merchant?.merchantId || (await prisma.merchant.findFirst())?.id;
      const events = await prisma.webhookEvent.findMany({
        where: merchantId ? { merchantId } : {},
        orderBy: { createdAt: "desc" },
        take: 30,
      });

      res.status(200).json({
        success: true,
        data: events,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/merchants/webhooks/:id/replay
   */
  public static async replayWebhook(req: Request, res: Response): Promise<void> {
    try {
      const updated = await WebhookService.replayEvent(req.params.id);
      res.status(200).json({
        success: true,
        data: updated,
        message: "Webhook re-dispatched with fresh HMAC-SHA256 signature.",
      });
    } catch (err: unknown) {
      res.status(404).json({
        success: false,
        error: {
          code: "WEBHOOK_REPLAY_ERROR",
          message: err instanceof Error ? err.message : "Failed to replay webhook.",
        },
      });
    }
  }

  /**
   * POST /api/v1/merchants/api-keys/rotate
   */
  public static async rotateApiKey(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.merchant?.merchantId || (await prisma.merchant.findFirst())?.id;
      if (!merchantId) {
        res.status(404).json({ success: false, error: { code: "NOT_FOUND", message: "Merchant not found." } });
        return;
      }

      const newApiKey = `vpy_live_${randomUUID().replace(/-/g, "").substring(0, 24)}`;
      const updated = await prisma.merchant.update({
        where: { id: merchantId },
        data: { apiKey: newApiKey },
        select: { id: true, name: true, email: true, apiKey: true, webhookUrl: true, webhookSecret: true },
      });

      res.status(200).json({
        success: true,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}
