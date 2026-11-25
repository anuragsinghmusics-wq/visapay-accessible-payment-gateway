import { Router } from "express";
import { IntentController } from "../controllers/intent.controller.js";

export const intentRouter = Router();

intentRouter.post("/", IntentController.createIntent);
intentRouter.get("/", IntentController.listIntents);
intentRouter.get("/:id", IntentController.getIntentById);
