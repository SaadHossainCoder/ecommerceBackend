import { Router } from "express";
import * as userController from "../controllers/auth.controller";
import {validateZod} from "../middleware/validate-zod.middlewere"
import* as z from "../validators/user.zod"
import {authGuard} from "../middleware/auth.guard"



const router = Router();

router.post("/signup", validateZod(z.signupSchema), userController.signup);
router.post("/login", validateZod(z.loginSchema), userController.login);
router.post("/logout", authGuard, userController.logout);
router.post("/refresh", userController.refresh);
router.post("/forgot", validateZod(z.forgotSchema), userController.requestForgotPassword);
router.post("/reset", validateZod(z.resetSchema), userController.resetPassword);
router.post("/verify", validateZod(z.verifySchema), userController.verifyEmail);
router.post("/otp/send", validateZod(z.otpSendSchema), userController.sendOtp);
router.post("/otp/verify", validateZod(z.otpVerifySchema), userController.verifyOtp);
router.get("/me", authGuard, userController.getMe);

// admin routes
router.get("/users", authGuard(['ADMIN']), userController.getAllUsers);
router.delete("/user/:id", authGuard(['ADMIN']), userController.deleteUserById);

export default router;
