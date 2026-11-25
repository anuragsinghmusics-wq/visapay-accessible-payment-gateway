import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import fs from "fs";
import { authRouter } from "./routes/auth.routes.js";
import { paymentRouter } from "./routes/payment.routes.js";
import { merchantRouter } from "./routes/merchant.routes.js";
import { intentRouter } from "./routes/intent.routes.js";

export const app = express();

// Security Headers Middleware (OWASP / PCI-DSS compliance)
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

// API Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/payments", paymentRouter);
app.use("/api/v1/merchants", merchantRouter);
app.use("/api/v1/payment-intents", intentRouter);

// Healthcheck endpoint
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    service: "VisaPay Payment Gateway API",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Serve frontend static files in production when client/dist exists
const clientDistPath = path.resolve(process.cwd(), "client/dist");
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get("*", (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api")) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, "index.html"));
  });
}

// Global 404 handler for unmatched API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: "The requested endpoint does not exist",
    },
  });
});

// Global Error Handler (Sanitized shield for production)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ServerError]", err.message);
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: process.env.NODE_ENV === "production" ? "An internal server error occurred." : err.message,
    },
  });
});
