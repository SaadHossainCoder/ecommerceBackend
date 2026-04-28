import { Router } from "express";
import * as vendorController from "../controllers/vendor.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as vendorZod from "../validators/vendor.zod";
import { authGuard } from "../middleware/auth.guard";

const vendorRouter = Router();

// Public routes
vendorRouter.get("/", vendorController.getAllVendors);
vendorRouter.get("/short-data", vendorController.getVendorByShortData);
vendorRouter.get("/:id", vendorController.getVendorById);
vendorRouter.get("/slug/:slug", vendorController.getVendorBySlug);

// Admin routes
vendorRouter.post("/", authGuard(['ADMIN']), validateZod(vendorZod.createVendorSchema), vendorController.createVendor);
vendorRouter.put("/:id", authGuard(['ADMIN']), validateZod(vendorZod.updateVendorSchema), vendorController.updateVendor);
vendorRouter.delete("/:id", authGuard(['ADMIN']), vendorController.deleteVendor);

export default vendorRouter;
