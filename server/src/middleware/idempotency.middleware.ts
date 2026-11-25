import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";

/**
 * Idempotency Middleware
 * Prevents double-charging and duplicate transactions using UUID idempotency keys.
 */
export async function idempotencyFilter(req: Request, res: Response, next: NextFunction): Promise<void> {
  // Only apply to state-changing operations
  if (req.method !== "POST" && req.method !== "PUT" && req.method !== "PATCH") {
    next();
    return;
  }

  const idempotencyKey =
    (req.headers["idempotency-key"] as string) ||
    req.body?.idempotencyKey ||
    req.body?.idempotency_key;

  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    next();
    return;
  }

  try {
    const existing = await prisma.idempotencyRecord.findUnique({
      where: { idempotencyKey },
    });

    if (existing) {
      res.setHeader("X-Cache-Lookup", "HIT");
      res.setHeader("X-Idempotent-Replay", "true");
      res.status(existing.statusCode).json(JSON.parse(existing.responseJson));
      return;
    }

    res.setHeader("X-Cache-Lookup", "MISS");

    // Intercept response to cache upon completion
    const originalJson = res.json.bind(res);

    res.json = function (body: unknown): Response {
      const status = (body as { status?: string } | null)?.status;
      // Store final terminal responses in cache; skip intermediate 3DS challenges
      if (res.statusCode >= 200 && res.statusCode < 500 && status !== "REQUIRES_ACTION") {
        prisma.idempotencyRecord
          .create({
            data: {
              idempotencyKey,
              statusCode: res.statusCode,
              responseJson: JSON.stringify(body),
            },
          })
          .catch((err) => {
            console.error("[Idempotency] Failed to persist idempotency record:", err);
          });
      }
      return originalJson(body);
    };

    next();
  } catch (err) {
    console.error("[Idempotency Middleware Error]", err);
    next(err);
  }
}
