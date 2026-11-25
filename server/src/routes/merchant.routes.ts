import { Router } from "express";
import { MerchantController } from "../controllers/merchant.controller.js";

export const merchantRouter = Router();

merchantRouter.get("/dashboard", MerchantController.getDashboardStats);
merchantRouter.get("/webhooks", MerchantController.getWebhooks);
merchantRouter.post("/webhooks/:id/replay", MerchantController.replayWebhook);
merchantRouter.post("/api-keys/rotate", MerchantController.rotateApiKey);
