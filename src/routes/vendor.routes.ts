import { Router } from "express";
import * as vendorController from "../controllers/vendor.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as vendorZod from "../validators/vendor.zod";
import { authGuard } from "../middleware/auth.guard";
import { publicReadLimiter, adminWriteLimiter } from "../middleware/rateLimiter.middleware";

const vendorRouter = Router();

// ====================== PUBLIC ROUTES ======================
vendorRouter.get("/",           publicReadLimiter, vendorController.getAllVendors);
vendorRouter.get("/short-data", publicReadLimiter, vendorController.getVendorByShortData);
vendorRouter.get("/slug/:slug", publicReadLimiter, vendorController.getVendorBySlug);
vendorRouter.get("/:id",        publicReadLimiter, vendorController.getVendorById);

// ====================== ADMIN ROUTES ======================
vendorRouter.post("/",    authGuard(['ADMIN']), adminWriteLimiter, validateZod(vendorZod.createVendorSchema), vendorController.createVendor);
vendorRouter.put("/:id",  authGuard(['ADMIN']), adminWriteLimiter, validateZod(vendorZod.updateVendorSchema), vendorController.updateVendor);
vendorRouter.delete("/:id", authGuard(['ADMIN']), adminWriteLimiter,                                          vendorController.deleteVendor);

export default vendorRouter;
