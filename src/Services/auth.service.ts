import { hashPassword, hashToken, randomTokenHex, verifyPassword } from "../utils/hash.utils"
import { sendEmail } from "../utils/emailSend.utils"
import { signAccessToken } from "../utils/token.utils";
import { apiStatusCode } from "../lib/apiCode.lib";
import prisma from "../prisma/client";

// Custom errors
export class AuthError extends Error {
    constructor(message: string, public statusCode: number, public code?: string) {
        super(message);
        this.name = "AuthError";
    }
}

// Signup service
export const signup = async (username: string, email: string, password: string, role: string) => {
    try {
        if (!email || !password || !username || !role) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);

        // Normalize email to lowercase for consistency
        const normalizedEmail = email.toLowerCase();
        const normalizedUsername = username.toLowerCase();

        const existing = await prisma.user.findFirst({
            where: {
                OR: [
                    { email: normalizedEmail },
                    { username: normalizedUsername }
                ]
            }
        })
        if (existing) throw new Error("Email or Username already in use");

        // password hashing
        const passwordHash = await hashPassword(password);


        return await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    username: normalizedUsername,
                    email: normalizedEmail,
                    password: passwordHash,
                    role
                },
                select: { id: true, username: true, email: true, role: true },
            });

            const tokenPlain = randomTokenHex(32);
            await tx.emailToken.create({
                data: {
                    userId: user.id,
                    tokenHash: hashToken(tokenPlain),
                    purpose: "VERIFY_EMAIL",
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                },
            });

            // Async email (fire-and-forget)
            // const link = `${process.env.FRONTEND_URL}/verify?uid=${user.id}&token=${tokenPlain}`;
            // sendEmail(user.email, "Verify your email", `<p>Verify: <a href="${link}">Link</a> or code: ${tokenPlain}</p>`)
            // .catch((err) => logger.error("Email send failed", { userId: user.id, err }));
            return { user, tokenPlain };
        });
    } catch (error: any) {
        // Log the error for debugging
        if (error?.message) {
            console.error("Signup service error:", error.message);
        } else {
            console.error("Signup service error:", error);
        }

        // Re-throw clean errors
        if (error instanceof Error) {
            throw error;
        }

        // Fallback for unknown errors
        throw new Error("An error occurred during signup");
    }
}

// login service
export const login = async (email: string, password: string) => {
    if (!email || !password) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);
    const normalizedEmail = email.toLowerCase();
    try {
        const user = await prisma.user.findFirst({
            where: { email: normalizedEmail, deletedAt: null, lockedUntil: { lt: new Date() } }
        });
        if (!user) throw new Error("User not found");

        // password verification
        const isPasswordValid = await verifyPassword(password, user.password);
        if (!isPasswordValid) throw new Error("Invalid email/username or password");

        // access token
        const accessToken = signAccessToken({ sub: user.id, role: user.role });
        // create refresh token
        const refreshPlain = randomTokenHex(64);
        const refreshHash = hashToken(refreshPlain);
        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refreshHash,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            }
        });

        return { user, accessToken, refreshToken: refreshPlain };
    } catch (error) {
        console.error("Login service error:", error);
        throw error;
    }
};

// logout service
export const logout = async (userId: string, refreshToken: string) => {
    try {
        if (!userId || !refreshToken) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);
        const tokenHash = hashToken(refreshToken);
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                tokenHash,
                revoked: false
            },
            data: {
                revoked: true
            }
        });
    } catch (error) {
        console.error("Logout service error:", error);
        throw error;
    }
};

// refresh token service
export const refreshTokens = async (refreshToken: string) => {
    try {
        if (!refreshToken) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);
        const tokenHash = hashToken(refreshToken);
        const found = await prisma.refreshToken.findFirst({ where: { tokenHash, revoked: false } });
        if (!found) throw new Error("Invalid refresh token");
        const userId = found.userId;
        if (!found || found.revoked || found.expiresAt < new Date()) throw new Error("Invalid refresh token");

        // issue new tokens
        const newplain = randomTokenHex(64);
        const newHash = hashToken(newplain);
        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days


        await prisma.$transaction(async (tx: any) => {
            await tx.refreshToken.update({
                where: {
                    id: found.id
                },
                data: {
                    revoked: true,
                    replacedBy: newHash
                },
            });

            await tx.refreshToken.create({
                data: {
                    userId,
                    tokenHash: newHash,
                    expiresAt: newExpiry
                }
            });
        }
        );


        const accessToken = signAccessToken({ sub: userId });

        return { refreshToken: newplain, accessToken };
    } catch (error) {
        console.error("Refresh token service error:", error);
        throw error;
    }
};

// Forgot password service
export const requestForgotPassword = async (email: string) => {
    try {
        if (!email) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);

        const user = await prisma.user.findUnique({
            where: { email }
        });
        if (!user) throw new Error("User not found");

        // create forgot password token
        const tokenPlain = randomTokenHex(32);
        await prisma.emailToken.create({
            data: {
                userId: user.id,
                tokenHash: hashToken(tokenPlain),
                purpose: "FORGOT_PASSWORD",
                expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 hour
            }
        });

        // send forgot password email
        const link = `${process.env.FRONTEND_URL}/reset-password?uid=${user.id}&token=${tokenPlain}`;
        sendEmail(
            user.email,
            "Reset your password",
            `<p>Please reset your password by clicking on the following link:
            <br>
            <a href="${link}">Reset Password</a>
            </p>`
        ).catch(console.error);
        return { user, tokenPlain };
    } catch (error) {
        console.error("Request forgot password service error:", error);
        throw error;
    }
};

// Reset password service
export const resetPassword = async (userId: string, token: string, newPassword: string) => {
    try {
        if (!userId || !token || !newPassword) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);
        const tokenHash = hashToken(token);
        const entry = await prisma.emailToken.findFirst({
            where: {
                userId,
                tokenHash,
                purpose: "FORGOT_PASSWORD",
                used: false,
            }
        });
        if (!entry || entry.expiresAt < new Date()) throw new Error("Invalid or expired token");

        // update password
        const newPasswordHash = await hashPassword(newPassword);


        await prisma.$transaction(async (tx: any) => {
            await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    password: newPasswordHash
                }
            });
            await tx.emailToken.update({
                where: {
                    id: entry.id
                },
                data: {
                    used: true
                }
            });
        });
    } catch (error) {
        console.error("Reset password service error:", error);
        throw error;
    }
}

// Verify email service
export const verifyEmailToken = async (userId: string, token: string) => {
    try {
        if (!userId || !token) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);
        const tokenHash = hashToken(token);
        const entry = await prisma.emailToken.findFirst({
            where: {
                userId,
                tokenHash,
                purpose: "VERIFY_EMAIL",
                used: false
            }
        });
        if (!entry || entry.expiresAt < new Date()) throw new Error("Invalid or expired token");

        // mark email as verified
        await prisma.$transaction(async (tx: any) => {
            await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    isEmailVerified: true
                }
            });
            await tx.emailToken.update({
                where: {
                    id: entry.id
                },
                data: {
                    used: true
                }
            })
        });
    } catch (error) {
        console.error("Verify email service error:", error);
        throw error;
    }
};

// create OTP service
export const createOtp = async (userId: string) => {
    try {
        if (!userId) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);
        const otp = (Math.floor(100000 + Math.random() * 900000)).toString(); // 6-digit OTP
        const otpHash = hashToken(otp);
        await prisma.emailToken.create({
            data: {
                userId,
                tokenHash: otpHash,
                purpose: "OTP",
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
            }
        });
        return otp;
    } catch (error) {
        console.error("Create OTP service error:", error);
        throw error;
    }
};

// verify OTP service
export const verifyOtp = async (userId: string, otp: string) => {
    try {
        if (!userId || !otp) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);
        const otpHash = hashToken(otp);
        const entry = await prisma.emailToken.findFirst({
            where: {
                userId,
                tokenHash: otpHash,
                purpose: "OTP",
                used: false
            }
        });
        if (!entry || entry.expiresAt < new Date()) throw new Error("Invalid or expired OTP");

        // mark OTP as used
        await prisma.emailToken.update({
            where: {
                id: entry.id
            },
            data: {
                used: true
            }
        });
        return true;
    } catch (error) {
        console.error("Verify OTP service error:", error);
        throw error;
    }
};

// get all user service
export const getAllUsers = async () => {
    try {
        return await prisma.user.findMany(
            {
                select: {
                    id: true,
                    username: true,
                    email: true,
                    role: true,
                    isEmailVerified: true,
                    createdAt: true,
                    updatedAt: true,
                }
            }
        );
    } catch (error) {
        console.error("Get all users service error:", error);
        throw error;
    };
};

// get user by id service
export const getUserById = async (userId: string) => {
    try {
        if (!userId) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);
        return await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                isEmailVerified: true,
                createdAt: true,
                updatedAt: true,
            }
        })
    } catch (error) {
        console.error("Get user by id service error:", error);
        throw error;
    }
};

// delete user by id service
export const deleteUserById = async (userId: string, adminId: string) => {
    try {
        if (!userId || !adminId) throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);

        if (userId === adminId) throw new Error("Admin can't delete himself");

        const [admin, user] = await Promise.all([
            prisma.user.findUnique({ where: { id: adminId } }),
            prisma.user.findUnique({ where: { id: userId } }),
        ]);
        if (!admin || admin.role !== "ADMIN") throw new AuthError("Admin required", 403);
        if (!user) throw new AuthError("User not found", 404);
        if (user.role === "ADMIN") throw new AuthError("Cannot delete admin", 403, "ADMIN_DELETE");

        await prisma.$transaction(async (tx) => {
            await tx.emailToken.deleteMany({ where: { userId } });
            await tx.refreshToken.deleteMany({ where: { userId } });
            await tx.user.update({ where: { id: userId }, data: { deletedAt: new Date() } }); // Soft delete
        });
        return true;
    } catch (error) {
        console.error("Delete user by id service error:", error);
        throw error;
    }
};