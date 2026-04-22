import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as categoryZod from "../validators/category.zod";
import { authGuard } from "../middleware/auth.guard";

const router = Router();

// ✅ PUBLIC
router.get("/", categoryController.getAllCategories);
router.get("/tree", categoryController.getCategoryTree);
router.get("/slug/:slug", categoryController.getCategoryBySlug);

// ✅ ADMIN
router.get("/admin/stats", authGuard(['ADMIN']), categoryController.getCategoryStatistics);

// ✅ CREATE (IMPORTANT: BEFORE :id)
router.post("/main", authGuard(['ADMIN']), validateZod(categoryZod.createMainCategorySchema), categoryController.createMainCategory);
router.post("/sub", authGuard(['ADMIN']), validateZod(categoryZod.createSubCategorySchema), categoryController.createSubCategory);

// ✅ UPDATE + DELETE
router.put("/:id", authGuard(['ADMIN']), validateZod(categoryZod.updateCategorySchema), categoryController.updateCategory);
router.delete("/:id", authGuard(['ADMIN']), categoryController.hardDeleteCategory);

// ❗ ALWAYS LAST
router.get("/:id/subcategories", categoryController.getSubCategories);
router.get("/:id", categoryController.getCategoryById);

export default router;