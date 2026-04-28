import { Router } from "express";
import * as couponController from "../controllers/coupon.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as couponZod from "../validators/coupon.zod";
import { authGuard } from "../middleware/auth.guard";

const couponRouter = Router();

// User routes
couponRouter.post("/validate", authGuard(['USER', 'ADMIN', 'MODERATOR']), validateZod(couponZod.validateCouponSchema), couponController.validateCoupon);

// Admin routes
couponRouter.get("/admin/stats", authGuard(['ADMIN']), couponController.getCouponStats);
couponRouter.post("/", authGuard(['ADMIN']), validateZod(couponZod.createCouponSchema), couponController.createCoupon);
couponRouter.get("/", authGuard(['ADMIN']), couponController.getAllCoupons);
couponRouter.get("/:id", authGuard(['ADMIN']), couponController.getCouponById);
couponRouter.put("/:id", authGuard(['ADMIN']), validateZod(couponZod.updateCouponSchema), couponController.updateCoupon);
couponRouter.delete("/:id", authGuard(['ADMIN']), couponController.deleteCoupon);

export default couponRouter;
