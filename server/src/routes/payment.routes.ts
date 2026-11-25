import { Router } from "express";
import { PaymentController } from "../controllers/payment.controller.js";
import { idempotencyFilter } from "../middleware/idempotency.middleware.js";

export const paymentRouter = Router();

// Charge route guarded by idempotency filter
paymentRouter.post("/charge", idempotencyFilter, PaymentController.charge);

// UPI VPA verification
paymentRouter.post("/upi/verify", PaymentController.verifyUpiVpa);

// 3D Secure 2.0 OTP verification
paymentRouter.post("/3ds/verify", PaymentController.verifyThreeDsOtp);

// Card tokenization route (PCI simulation)
paymentRouter.post("/tokenize", PaymentController.tokenize);

// Transaction queries & refunds
paymentRouter.get("/transactions", PaymentController.getTransactions);
paymentRouter.get("/transactions/:id", PaymentController.getTransactionById);
paymentRouter.post("/transactions/:id/refund", PaymentController.refundTransaction);
