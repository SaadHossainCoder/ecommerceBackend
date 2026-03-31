import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as categoryZod from "../validators/category.zod";
import { authGuard } from "../middleware/auth.guard";

const categoryRouter = Router();

// Public routes
categoryRouter.get("/", validateZod(categoryZod.categoryQuerySchema), categoryController.getAllCategories);
categoryRouter.get("/tree", categoryController.getCategoryTree);
categoryRouter.get("/slug/:slug", categoryController.getCategoryBySlug);

// Admin routes (must be before /:id to avoid route conflict)
categoryRouter.get("/admin/stats", authGuard(['ADMIN']), categoryController.getCategoryStatistics);

// Dynamic routes (must be last)
categoryRouter.get("/:id", categoryController.getCategoryById);
categoryRouter.post("/main", authGuard(['ADMIN']), validateZod(categoryZod.createMainCategorySchema), categoryController.createMainCategory);
categoryRouter.post("/sub", authGuard(['ADMIN']), validateZod(categoryZod.createSubCategorySchema), categoryController.createSubCategory);
categoryRouter.put("/:id", authGuard(['ADMIN']), validateZod(categoryZod.updateCategorySchema), categoryController.updateCategory);
categoryRouter.delete("/:id", authGuard(['ADMIN']), categoryController.deleteCategory);
categoryRouter.delete("/hardDelete/:id", authGuard(['ADMIN']), categoryController.hardDeleteCategory);

export default categoryRouter;
