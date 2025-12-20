import { Request, Response, NextFunction } from "express";
import * as AuthService from "../services/auth.service";
import { signupSchema, loginSchema /* etc. */ } from "../validators/auth.schema";
import { PaginationQuery } from "../types/auth.types";
import { CONFIG } from "../config/constants";
import { apiStatusCode } from "../lib/apiCode.lib";

interface TypedRequest<T = any> extends Request {
  body: T;
  user?: { sub: string; role: string }; // From auth middleware
}

const sendResponse = (res: Response, status: number, success: boolean, data?: any, message?: string, errors?: any) => {
  res.status(status).json({ success, data, message, errors });
};

export const signup = async (req: TypedRequest<z.infer<typeof signupSchema>>, res: Response, next: NextFunction) => {
  try {
    const parsed = signupSchema.parse(req.body);
    const { user, tokenPlain } = await AuthService.signup(parsed);
    // res.cookie(CONFIG.REFRESH_COOKIE_NAME, tokenPlain, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });
    sendResponse(res, apiStatusCode.Created, true, { user: { id: user.id, username: user.username, email: user.email, role: user.role } }, "Signup successful. Check email for verification.");
  } catch (error) {
    next(error);
  }
};
 
export const login = async (req: TypedRequest<z.infer<typeof loginSchema>>, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.parse(req.body);
    const { user, accessToken, refreshToken } = await AuthService.login(parsed);
    res.cookie(CONFIG.REFRESH_COOKIE_NAME, refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 30 * 24 * 60 * 60 * 1000 });
    sendResponse(res, apiStatusCode.Created, true, { user, accessToken }, "Login successful");
  } catch (error) {
    next(error);
  } 
};

export const logout = async (req: TypedRequest, res: Response, next: NextFunction) => {
  try {
    const cookie = req.cookies[CONFIG.REFRESH_COOKIE_NAME];
    const userId = req.user?.sub;
    if (!cookie || !userId) return sendResponse(res, apiStatusCode.NotFound, false, undefined, "Missing auth");

    await AuthService.logout(userId, cookie);
    res.clearCookie(CONFIG.REFRESH_COOKIE_NAME, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" });
    sendResponse(res, apiStatusCode.Success, true, undefined, "Logged out");
  } catch (error) {
    next(error);
  }
};

// Similar for refresh, requestForgotPassword (no return tokenPlain for security), resetPassword, verifyEmail, sendOtp/verifyOtp.

// For getAllUsers (admin only)
export const getAllUsers = async (req: TypedRequest<{}, {}, {}, PaginationQuery>, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "ADMIN") return sendResponse(res, 403, false, undefined, "Admin required");
    const query = req.query;
    const result = await AuthService.getAllUsers(query);
    sendResponse(res, apiStatusCode.Success, true, result, "Users fetched");
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: TypedRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return sendResponse(res, apiStatusCode.NotFound, false, undefined, "Unauthorized");
    const user = await AuthService.getUserById(userId);
    sendResponse(res, apiStatusCode.Success, true, { user }, "Profile fetched");
  } catch (error) {
    next(error);
  }
};

export const deleteUserById = async (req: TypedRequest, res: Response, next: NextFunction) => {
  try {
    if (req.user?.role !== "ADMIN") return sendResponse(res, 403, false, undefined, "Admin required");
    const { id: userId } = req.params;
    const adminId = req.user.sub;
    await AuthService.deleteUserById(userId, adminId);
    sendResponse(res, apiStatusCode.Success, true, undefined, "User deleted");
  } catch (error) {
    next(error);
  }
};

// Global error handler (app.ts)
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof AuthService.AuthError) {
    return sendResponse(res, err.statusCode, false, undefined, err.message, { code: (err as any).code });
  }
  logger.error("Auth error", { error: err.message, path: req.path });
  sendResponse(res, 500, false, undefined, "Internal server error");
};