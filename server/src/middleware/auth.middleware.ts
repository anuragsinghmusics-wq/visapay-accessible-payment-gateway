import { Request, Response, NextFunction } from "express";
import { AuthService, AuthTokenPayload } from "../services/AuthService.js";

// Extend Express Request declaration to include authenticated merchant
declare global {
  namespace Express {
    interface Request {
      merchant?: AuthTokenPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Missing or invalid Bearer authentication token.",
      },
    });
    return;
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = AuthService.verifyToken(token);
    req.merchant = payload;
    next();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Authentication failed.";
    res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message,
      },
    });
  }
}

