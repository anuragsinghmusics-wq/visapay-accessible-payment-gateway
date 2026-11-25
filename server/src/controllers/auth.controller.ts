import { Request, Response, NextFunction } from "express";
import { prisma } from "../prisma/client.js";
import { AuthService } from "../services/AuthService.js";
import { RegisterInput, LoginInput } from "@visapay/shared";
import { randomUUID } from "crypto";

export class AuthController {
  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as RegisterInput;

      // Check if email already exists
      const existing = await prisma.merchant.findUnique({
        where: { email: input.email.toLowerCase().trim() },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: {
            code: "EMAIL_ALREADY_EXISTS",
            message: "A merchant with this email address already exists.",
          },
        });
        return;
      }

      // Hash password & generate API key
      const passwordHash = await AuthService.hashPassword(input.password);
      const apiKey = `vpy_live_${randomUUID().replace(/-/g, "")}`;

      const merchant = await prisma.merchant.create({
        data: {
          name: input.name.trim(),
          email: input.email.toLowerCase().trim(),
          passwordHash,
          apiKey,
        },
      });

      const token = AuthService.generateToken({
        merchantId: merchant.id,
        email: merchant.email,
      });

      res.status(201).json({
        success: true,
        data: {
          token,
          merchant: {
            id: merchant.id,
            name: merchant.name,
            email: merchant.email,
            apiKey: merchant.apiKey,
            createdAt: merchant.createdAt.toISOString(),
          },
        },
        message: "Merchant account registered successfully.",
      });
    } catch (err) {
      next(err);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = req.body as LoginInput;

      const merchant = await prisma.merchant.findUnique({
        where: { email: input.email.toLowerCase().trim() },
      });

      if (!merchant) {
        res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        });
        return;
      }

      const isValid = await AuthService.comparePassword(input.password, merchant.passwordHash);

      if (!isValid) {
        res.status(401).json({
          success: false,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password.",
          },
        });
        return;
      }

      const token = AuthService.generateToken({
        merchantId: merchant.id,
        email: merchant.email,
      });

      res.status(200).json({
        success: true,
        data: {
          token,
          merchant: {
            id: merchant.id,
            name: merchant.name,
            email: merchant.email,
            apiKey: merchant.apiKey,
            createdAt: merchant.createdAt.toISOString(),
          },
        },
        message: "Login successful.",
      });
    } catch (err) {
      next(err);
    }
  }

  public static async getCurrentMerchant(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const merchantId = req.merchant?.merchantId;

      if (!merchantId) {
        res.status(401).json({
          success: false,
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required.",
          },
        });
        return;
      }

      const merchant = await prisma.merchant.findUnique({
        where: { id: merchantId },
        select: {
          id: true,
          name: true,
          email: true,
          apiKey: true,
          createdAt: true,
        },
      });

      if (!merchant) {
        res.status(404).json({
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Merchant account no longer exists.",
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          merchant: {
            ...merchant,
            createdAt: merchant.createdAt.toISOString(),
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

