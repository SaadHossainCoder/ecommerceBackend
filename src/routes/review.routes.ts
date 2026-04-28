import { Router } from "express";
import * as reviewController from "../controllers/review.controller";
import { validateZod } from "../middleware/validate-zod.middleware";
import * as reviewZod from "../validators/review.zod";
import { authGuard } from "../middleware/auth.guard";

const reviewRouter = Router();

// Public routes
reviewRouter.get("/product/:id", reviewController.getReviewsByProduct);

// Authenticated User routes
reviewRouter.get("/me", authGuard(['USER', 'ADMIN', 'MODERATOR']), reviewController.getReviewsByUser);
reviewRouter.post("/product/:id", authGuard(['USER', 'ADMIN', 'MODERATOR']), validateZod(reviewZod.createReviewSchema), reviewController.createReview);
reviewRouter.delete("/:id", authGuard(['USER', 'ADMIN', 'MODERATOR']), reviewController.deleteReview);

// Admin routes
reviewRouter.get("/admin/all", authGuard(['ADMIN']), validateZod(reviewZod.reviewQuerySchema), reviewController.getAllReviews);
reviewRouter.put("/admin/approve/:id", authGuard(['ADMIN']), reviewController.approveReview);

export default reviewRouter;
