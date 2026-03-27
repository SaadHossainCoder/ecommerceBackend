import { Router } from "express";
import * as topBarNotificationController from "../controllers/topBarNotification.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as topBarNotificationZod from "../validators/topBarNotification.zod";
import { authGuard } from "../middleware/auth.guard";

const topBarNotificationRouter = Router();

// Public routes
topBarNotificationRouter.get("/", topBarNotificationController.getAllTopBarNotifications);
topBarNotificationRouter.get("/:id", topBarNotificationController.getTopBarNotificationById);

// Admin routes
topBarNotificationRouter.post("/", authGuard(['ADMIN']), validateZod(topBarNotificationZod.createTopBarNotificationSchema), topBarNotificationController.createTopBarNotification);
topBarNotificationRouter.put("/:id", authGuard(['ADMIN']), validateZod(topBarNotificationZod.updateTopBarNotificationSchema), topBarNotificationController.updateTopBarNotification);
topBarNotificationRouter.delete("/:id", authGuard(['ADMIN']), topBarNotificationController.deleteTopBarNotification);

export default topBarNotificationRouter;
