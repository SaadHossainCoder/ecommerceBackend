import { Router } from "express";
import * as userController from "../controllers/auth.controller";
import { validateZod } from "../middleware/validate-zod.middleware"
import * as z from "../validators/user.zod"
import { authGuard } from "../middleware/auth.guard"
import rateLimit from "express-rate-limit";



const userRouter = Router();

userRouter.post("/signup", rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), validateZod(z.signupSchema), userController.signup);
userRouter.post("/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }), validateZod(z.loginSchema), userController.login);
userRouter.post("/logout", userController.logout);
userRouter.post("/refresh", userController.refresh);
userRouter.post("/forgot", validateZod(z.forgotSchema), userController.requestForgotPassword);
userRouter.post("/reset", validateZod(z.resetSchema), userController.resetPassword);
userRouter.post("/verify", validateZod(z.verifySchema), userController.verifyEmail);
userRouter.post("/otp/send", validateZod(z.otpSendSchema), userController.sendOtp);
userRouter.post("/otp/verify", validateZod(z.otpVerifySchema), userController.verifyOtp);
userRouter.get("/me", authGuard(), userController.getMe);
userRouter.put("/me", authGuard(), validateZod(z.updateUserSchema), userController.updateMe);

// admin routes
userRouter.get("/users", authGuard(['ADMIN']), userController.getAllUsers);
userRouter.delete("/user/:id", authGuard(['ADMIN']), userController.deleteUserById);
userRouter.put("/user/:id", authGuard(['ADMIN']), validateZod(z.updateUserSchema), userController.updateUserById);
userRouter.post("/user/:id/email", authGuard(['ADMIN']), userController.sendDirectEmail);

// smart guards for frontend routing
// user guard
userRouter.get("/auth-guard", userController.checkUserGuard);
export default userRouter;
