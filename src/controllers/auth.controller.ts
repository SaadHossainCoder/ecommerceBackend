import { Request, Response } from "express";
import * as authService from "../Services/auth.service";

// signup controller
export const signup = async (req: Request, res: Response) => {
    try {
        const { user } = await authService.signup(req.body.username, req.body.email, req.body.password, req.body.role);
        return res.status(201).json({ ok: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// login controller
export const login = async (req: Request, res: Response) => {
    try {
        const { user, accessToken, refreshToken } = await authService.login(req.body.email, req.body.password);
        res.cookie(
            process.env.REFRESH_COOKIE_NAME || "jid", refreshToken,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000
            }
        );
        return res.status(200).json({
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
        const cookie = req.cookies[process.env.REFRESH_COOKIE_NAME || "jid"];
        const userId = req.body.userId;
        if (!cookie || !userId) {
            return res.status(400).json({ ok: false, message: "Invalid request" });
        };

        if (cookie && userId) {
            await authService.logout(userId, cookie);
        };

        res.clearCookie(process.env.REFRESH_COOKIE_NAME || "jid", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });
        return res.status(200).json({ ok: true, message: "Logged out successfully" });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// refresh token controller
export const refresh = async (req: Request, res: Response) => {
    try {
        const cookie = req.cookies[process.env.REFRESH_COOKIE_NAME || "jid"];
        const userId = req.body.userId;
        if (!cookie || !userId) {
            return res.status(400).json({ ok: false, message: "Invalid request" });
        };

        const {accessToken , refreshToken} = await authService.refreshTokens(userId, cookie);
        res.cookie(
            process.env.REFRESH_COOKIE_NAME || "jid", refreshToken,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production", sameSite: "lax",
                maxAge: 30 * 24 * 60 * 60 * 1000
            }
        );
        return res.status(200).json({ ok: true, accessToken });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// forgot password controller
export const requestForgotPassword = async (req: Request, res: Response) => {
    try {
        await authService.requestForgotPassword(req.body.email);
        return res.status(200).json({ ok: true, message: "Password reset link sent to your email" });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// reset password controller
export const resetPassword = async (req: Request, res: Response) => {
    try {
        await authService.resetPassword(req.body.token, req.body.password,  req.body.confirmPassword);
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// verify email controller
export const verifyEmail = async (req: Request, res: Response) => {
    try {
        await authService.verifyEmailToken(req.body.userId,req.body.token);
        return res.status(200).json({ ok: true, message: "Email verified successfully" });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// send otp controller
export const sendOtp = async (req: Request, res: Response) => {
    try {
        const otp = await authService.createOtp(req.body.userId);
        return res.status(200).json({ ok: true, otp , message: "OTP sent successfully" });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// verify otp controller
export const verifyOtp = async (req: Request, res: Response) => {
    try {
        await authService.verifyOtp( req.body.uid,  req.body.otp );
        return res.status(200).json({ ok: true, message: "OTP verified successfully" });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// get all users only admin controller
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user.sub;
        if (!adminId) {
            return res.status(400).json({ ok: false, message: "Invalid request" });
        };

        const users = await authService.getAllUsers();
        return res.status(200).json({ ok: true, users , message: "Users fetched successfully" });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// get me controller
export const getMe = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.sub; 
        if (!userId) {
            return res.status(400).json({ ok: false, message: "Invalid request" });
        };
        const user = await authService.getUserById(userId);

        return res.status(200).json({ ok: true, user , message: "User fetched successfully" });
    } catch (error) {
        return res.status(400).json({ ok: false, message: (error as Error).message });
    }
};

// delete user by id only admin controller
export const deleteUserById = async (req: Request, res: Response) => {
    try {
        const adminId = (req as any).user.sub;
        const userId = req.params.id;
        if (!adminId || !userId) {
            return res.status(400).json({ ok: false, message: "Invalid request" });
        };
        await authService.deleteUserById(userId);
        return res.status(200).json({ ok: true, message: "User deleted successfully" });
    } catch (error) {
        
    }
};