import { Router } from "express";
import userRouter from "./user.routes";
import couponRouter from "./coupon.routes";
import categoryRouter from "./category.routes";
import bannerRouter from "./banner.routes";
import productRouter from "./product.routes";
import vendorRouter from "./vendor.routes";
import reviewRouter from "./review.routes";
import addressRouter from "./address.routes";
import topBarNotificationRouter from "./topBarNotification.routes";

const rootRouter: Router = Router();

rootRouter.use("/auth", userRouter);
rootRouter.use("/coupons", couponRouter);
rootRouter.use("/categories", categoryRouter);
rootRouter.use("/banners", bannerRouter);
rootRouter.use("/products", productRouter);
rootRouter.use("/vendor", vendorRouter);
rootRouter.use("/reviews", reviewRouter);
rootRouter.use("/addresses", addressRouter);
rootRouter.use("/notification-bar", topBarNotificationRouter);

export default rootRouter;