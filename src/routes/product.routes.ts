import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as productZod from "../validators/product.zod";
import { authGuard } from "../middleware/auth.guard";

const productRouter = Router();

// ====================== PUBLIC ROUTES ======================
productRouter.get("/", productController.getAllProducts);
productRouter.get("/featured", productController.getFeaturedProducts);
productRouter.get("/featured/:slug", productController.getFeaturedProductsBySlug);
productRouter.get("/search", productController.searchProducts);
productRouter.get("/slug/:slug", productController.getProductBySlug);

// ====================== ADMIN ROUTES ======================
productRouter.get("/reviews", authGuard(["ADMIN"]), productController.getAllReviews);
productRouter.get("/admin", authGuard(["ADMIN"]), productController.getAllProductsByAdmin);
productRouter.post("/", authGuard(["ADMIN"]), validateZod(productZod.createProductSchema), productController.createProduct);
productRouter.put("/review/:reviewId", authGuard(["ADMIN"]), productController.updateReview);
productRouter.delete("/review/:reviewId", authGuard(["ADMIN"]), productController.deleteReview);

// ====================== AUTHENTICATED USER ROUTES ======================
productRouter.post("/:id/review", authGuard(["USER", "ADMIN"]), validateZod(productZod.addReviewSchema), productController.addReview);

// ====================== DYNAMIC PUBLIC ROUTES (MUST BE LAST) ======================
productRouter.get("/:id/reviews", productController.getProductReviews);
productRouter.get("/:id", productController.getProductById);

// ====================== DYNAMIC ADMIN ROUTES (MUST BE LAST) ======================
productRouter.put("/:id", authGuard(["ADMIN"]), validateZod(productZod.updateProductSchema), productController.updateProduct);
productRouter.delete("/:id", authGuard(["ADMIN"]), productController.deleteProduct);

export default productRouter;