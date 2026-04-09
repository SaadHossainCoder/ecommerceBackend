import { Router } from "express";
import * as productController from "../controllers/product.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as productZod from "../validators/product.zod";
import { authGuard } from "../middleware/auth.guard";

const productRouter = Router();

// ====================== PUBLIC ROUTES ======================
productRouter.get("/", productController.getAllProducts);
productRouter.get("/featured", productController.getFeaturedProducts);
productRouter.get("/search", productController.searchProducts);
productRouter.get("/slug/:slug", productController.getProductBySlug);
productRouter.get("/:id", productController.getProductById);

// ====================== AUTHENTICATED USER ROUTES ======================
productRouter.post("/:id/review", authGuard(["USER"]), validateZod(productZod.addReviewSchema), productController.addReview);

// ====================== ADMIN ROUTES ======================
productRouter.post("/", authGuard(["ADMIN"]), validateZod(productZod.createProductSchema), productController.createProduct);
productRouter.put("/:id", authGuard(["ADMIN"]), validateZod(productZod.updateProductSchema), productController.updateProduct);
productRouter.delete("/:id", authGuard(["ADMIN"]), productController.deleteProduct);

export default productRouter;