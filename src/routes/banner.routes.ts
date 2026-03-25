import { Router } from "express";
import * as bannerController from "../controllers/banner.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as bannerZod from "../validators/banner.zod";
import { authGuard } from "../middleware/auth.guard";

const bannerRouter = Router();

// Public routes
bannerRouter.get("/", bannerController.getAllBanners);
bannerRouter.get("/:id", bannerController.getBannerById);

// Admin routes
bannerRouter.post("/", authGuard(['ADMIN']), validateZod(bannerZod.createBannerSchema), bannerController.createBanner);
bannerRouter.put("/:id", authGuard(['ADMIN']), validateZod(bannerZod.updateBannerSchema), bannerController.updateBanner);
bannerRouter.delete("/:id", authGuard(['ADMIN']), bannerController.deleteBanner);

export default bannerRouter;
