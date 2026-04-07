import { Response } from "express";
import { AuthRequest } from "../types/express";
import * as authService from "../Services/auth.service";
import { CONFIG } from "../config/constants";
import { apiStatusCode } from "../lib/apiCode.lib";

// signup controller
export const signup = async (req: AuthRequest, res: Response) => {
    try {
        const { username, email, password, role } = req.body as any;
        if (!username || !email || !password || !role) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Missing field" });
        };
        const { user } = await authService.signup(username, email, password, role);

        return res.status(apiStatusCode.Created).json({ ok: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error: any) {
        const message = error?.message || "An error occurred during signup";
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message });

    }
};

// login controller
export const login = async (req: AuthRequest, res: Response) => {
    try {
        const { email, password } = req.body as any;
        if (!email || !password) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };

        const { user, accessToken, refreshToken } = await authService.login(email, password);

        if (!refreshToken || !user || !accessToken) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        }

        res.cookie(
            CONFIG.REFRESH_COOKIE_NAME, refreshToken,
            {
                httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 24 * 60 * 60 * 1000
            });

        res.cookie(
            "accessToken", accessToken,
            {
                httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 60 * 1000
            });

        return res.status(apiStatusCode.Success).json({ ok: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// logout controller
export const logout = async (req: AuthRequest, res: Response) => {
    try {
        const cookie = req.cookies[CONFIG.REFRESH_COOKIE_NAME];
        const userId = req.user?.id || req.body?.id;

        // Always clear tokens from the client browser
        res.clearCookie(CONFIG.REFRESH_COOKIE_NAME, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });
        res.clearCookie("accessToken", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/"
        });

        if (!cookie || !userId) {
            return res.status(apiStatusCode.Success).json({ ok: true, message: "Logged out from client" });
        }

        try {
            // Revoke refresh token in database
            await authService.logout(userId, cookie);
        } catch (error) {
            // Ignore errors if token is already revoked or invalid, 
            // since the user's ultimate goal is to be logged out anyway.
            console.warn("Logout DB revocation issue:", (error as Error).message);
        }

        return res.status(apiStatusCode.Success).json({ ok: true, message: "Logged out successfully" });
    } catch (error: any) {
        // Return appropriate status code based on error type
        const statusCode = error?.statusCode || apiStatusCode.BadRequest;
        const message = error?.message || "Failed to logout";
        return res.status(statusCode).json({ ok: false, message });
    }
};

// refresh token controller
export const refresh = async (req: AuthRequest, res: Response) => {
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
                secure: CONFIG.NODE_ENV === "production", sameSite: "lax", path: "/",
                maxAge: 30 * 24 * 60 * 60 * 1000
            }
        );
        res.cookie(
            "accessToken", accessToken,
            {
                httpOnly: true,
                secure: CONFIG.NODE_ENV === "production", sameSite: "lax", path: "/",
                maxAge: 30 * 60 * 1000
            }
        );
        return res.status(apiStatusCode.Success).json({ ok: true });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// forgot password controller
export const requestForgotPassword = async (req: AuthRequest, res: Response) => {
    try {
        const { email } = req.body as any;
        if (!email) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        const { user } = await authService.requestForgotPassword(email);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "OTP sent to your email", uid: user.id });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// reset password controller
export const resetPassword = async (req: AuthRequest, res: Response) => {
    try {
        const { uid, token, password, confirmPassword } = req.body as any;
        if (!uid || !token || !password || !confirmPassword) {
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

        await authService.resetPassword(uid, token, password);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "Password reset successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// verify email controller ......not using any more......
export const verifyEmail = async (req: AuthRequest, res: Response) => {
    try {
        const { uid, token } = req.body as any;
        if (!uid || !token) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        await authService.verifyEmailToken(uid, token);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "Email verified successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// send otp controller
export const sendOtp = async (req: AuthRequest, res: Response) => {
    try {
        const { uid } = req.body as any;
        if (!uid) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        const otp = await authService.createOtp(uid);
        return res.status(apiStatusCode.Success).json({ ok: true, otp, message: "OTP sent successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// verify otp controller
export const verifyOtp = async (req: AuthRequest, res: Response) => {
    try {
        const { uid, otp } = req.body as any;
        if (!uid || !otp) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        if (otp.length < 3) {
            return res.status(apiStatusCode.NotMatched).json({ ok: false, message: "Invalid OTP" });
        };
        await authService.verifyOtp(uid, otp);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "OTP verified successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// get all users only admin controller
export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await authService.getAllUsers();
        return res.status(apiStatusCode.Success).json({ ok: true, users, message: "Users fetched successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// get me controller
export const getMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
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
export const deleteUserById = async (req: AuthRequest, res: Response) => {
    try {
        const adminId = req.user?.id;
        const { id: userId } = req.params;
        if (!adminId || !userId) {
            return res.status(apiStatusCode.NotFound).json({ ok: false, message: "Invalid request" });
        };
        await authService.deleteUserById(userId, adminId);
        return res.status(apiStatusCode.Success).json({ ok: true, message: "User deleted successfully" });
    } catch (error) {
        return res.status(apiStatusCode.BadRequest).json({ ok: false, message: (error as Error).message });
    }
};

// // check user guard controller (Smart frontend verification)
// export const checkUserGuard = async (req: AuthRequest, res: Response) => {
//     try {
//         const accessToken = req.cookies.accessToken;
//         const refreshToken = req.cookies[CONFIG.REFRESH_COOKIE_NAME];

//         if (!refreshToken) {
//             return res.status(400).json({ isAuthorised: false, message: "The user has to login now or register now" });
//         }

//         if (!accessToken) {
//             return res.status(400).json({ isAuthorised: false, message: "There is no access token" });
//         }

//         const data = authService.verifyFrontendSession(accessToken);
//         return res.status(200).json(data);
//     } catch (error) {
//         return res.status(400).json({ isAuthorised: false, message: (error as Error).message });
//     }
// };

// check admin guard controller (Smart frontend verification)
export const checkUserGuard = async (req: AuthRequest, res: Response) => {
    try {
        const accessToken = req.cookies.accessToken;
        const refreshToken = req.cookies[CONFIG.REFRESH_COOKIE_NAME];

        if (!refreshToken) {
            return res.status(400).json({ isAuthorised: false, message: "noRefreshToken" });
        }

        if (!accessToken) {
            return res.status(400).json({ isAuthorised: false, message: "noAccessToken" });
        }

        const data = authService.verifyFrontendSession(accessToken);
        return res.status(200).json(data);
    } catch (error) {
        return res.status(400).json({ isAuthorised: false, message: (error as Error).message });
    }
};