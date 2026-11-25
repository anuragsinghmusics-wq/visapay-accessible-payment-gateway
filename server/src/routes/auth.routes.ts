import { Router } from "express";
import { AuthController } from "../controllers/auth.controller.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { registerSchema, loginSchema } from "@visapay/shared";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), AuthController.register);
authRouter.post("/login", validateBody(loginSchema), AuthController.login);
authRouter.get("/me", requireAuth, AuthController.getCurrentMerchant);

