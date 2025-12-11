import { Request, Response } from "express";
import * as authService from "../Services/auth.service";
import { CONFIG } from "../config/constants";
import {apiStatusCode} from "../lib/apiCode.lib";

// signup controller
export const signup = async (req: Request, res: Response) => {
    try {
        const { username, email, password, role } = req.body;
        if (!username || !email || !password || !role) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: " Missing field" });
        };
        const { user } = await authService.signup(username, email, password, role);
        return res.status(apiStatusCode.Created).json({ ok: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// login controller
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        const { user, accessToken, refreshToken } = await authService.login(email, password);
        res.cookie(
            CONFIG.REFRESH_COOKIE_NAME, refreshToken,
            {
                httpOnly: true,
                secure: CONFIG.NODE_ENV === "production", sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000
            }
        );
        return res.status(apiStatusCode.Created).json({
            ok: true,
            user: { id: user.id, username: user.username, email: user.email, role: user.role },
            accessToken
        });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// logout controller
export const logout = async (req: Request, res: Response) => {
    try {
        const cookie = req.cookies[CONFIG.REFRESH_COOKIE_NAME];
        const userId = (req.user as any)?.sub; // Secured: get from token

        if (!cookie) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request: No cookie" });
        }

        if (userId) {
            await authService.logout(userId, cookie);
        }

        res.clearCookie(CONFIG.REFRESH_COOKIE_NAME, {
            httpOnly: true,
            secure: CONFIG.NODE_ENV === "production",
            sameSite: "lax"
        });
        return res.status(apiStatusCode.Success).json({ ok: true, message: "Logged out successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// refresh token controller
export const refresh = async (req: Request, res: Response) => {
    try {
        const cookie = req.cookies[CONFIG.REFRESH_COOKIE_NAME];

        if (!cookie) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };

        const { accessToken, refreshToken } = await authService.refreshTokens(cookie);
        res.cookie(
            CONFIG.REFRESH_COOKIE_NAME, refreshToken,
            {
                httpOnly: true,
                secure: CONFIG.NODE_ENV === "production", sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000
            }
        );
        return res.status(apiStatusCode.Success).json({ ok: true, accessToken });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// forgot password controller
export const requestForgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        await authService.requestForgotPassword(email);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "Password reset link sent to your email" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// reset password controller
export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { token, password, confirmPassword } = req.body;
        if (!token || !password || !confirmPassword) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        if (password !== confirmPassword) {
            return res.status(apiStatusCode.NotMatched).json({ ok: false, message: "Passwords do not match" });
        };
        if (password.length < 6) {
            return res.status(apiStatusCode.NotMatched).json({ ok: false, message: "Password must be at least 6 characters long" });
        };
        if (confirmPassword.length < 6) {
            return res.status(apiStatusCode.NotMatched).json({ ok: false, message: "Confirm password must be at least 6 characters long" });
        };

        await authService.resetPassword(token, password, confirmPassword);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "Password reset successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// verify email controller
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        const { userId, token } = req.body;
        if (!userId || !token) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        await authService.verifyEmailToken(userId, token);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "Email verified successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// send otp controller
export const sendOtp = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        const otp = await authService.createOtp(userId);
        return res.status(apiStatusCode.Success).json({ ok: true, otp, message: "OTP sent successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// verify otp controller
export const verifyOtp = async (req: Request, res: Response) => {
    try {
        const { uid, otp } = req.body;
        if (!uid || !otp) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        if (otp.length !== 6) {
            return res.status(apiStatusCode.NotMatched).json({ ok: false, message: "Invalid OTP" });
        };
        if (isNaN(parseInt(otp))) {
            return res.status(apiStatusCode.NotMatched).json({ ok: false, message: "Invalid OTP" });
        };
        await authService.verifyOtp(uid, otp);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "OTP verified successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// get all users only admin controller
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const { adminId } = req.body;
        if (!adminId) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };

        const users = await authService.getAllUsers();
        return res.status(apiStatusCode.Success).json({ ok: true, users, message: "Users fetched successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// get me controller
export const getMe = async (req: Request, res: Response) => {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        const user = await authService.getUserById(userId);

        return res.status(apiStatusCode.Success).json({ ok: true, user, message: "User fetched successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// delete user by id only admin controller
export const deleteUserById = async (req: Request, res: Response) => {
    try {
        const { adminId, userId } = req.body;
        if (!adminId || !userId) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        await authService.deleteUserById(userId, adminId);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "User deleted successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};