import { hashPassword, hashToken, randomTokenHex, verifyPassword } from "../utils/hash.utils"
import { sendEmail } from "../utils/emailSend.utils"
import { signAccessToken } from "../utils/token.utils";
import { apiStatusCode } from "../lib/apiCode.lib";
import prisma from "../prisma/client";
import logger from "../lib/logger";

// Custom errors
export class AuthError extends Error {
    constructor(message: string, public statusCode: number, public code?: string) {
        super(message);
        this.name = "AuthError";
    }
}

// Signup service
export const signup = async (username: string, email: string, password: string, role: string) => {
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();
    try {
        if (!email || !password || !username || role !== "USER") throw new Error(`Invalid request status code: ${apiStatusCode.NotFound}`);


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
                    username: normalizedUsername.trim(),
                    email: normalizedEmail.trim(),
                    password: passwordHash.trim(),
                    role,
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
            // const accessToken = signAccessToken({ sub: user.id, role: user.role });

            logger.info("User signed up", { userId: user.id, role });
            return { user, tokenPlain};
        });
    } catch (error: any) {
        // Log the error for debugging
        logger.error("Signup failed", { email: normalizedEmail, error: (error as Error).message });
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
    if (!email || !password) throw new AuthError("Email and password are required", apiStatusCode.BadRequest);
    const normalizedEmail = email.toLowerCase();
    try {
        console.log(email, password);

        const user = await prisma.user.findFirst({
            where: {
                email: normalizedEmail
            }
        });

        // password verification
        // To prevent user enumeration, we check for user existence and password validity
        // in a way that doesn't reveal which one failed.
        const isPasswordValid = user ? await verifyPassword(password, user.password) : false;
        console.log("isPasswordValid", isPasswordValid);
        // console.log("user", user);
        if (!user || !isPasswordValid) throw new AuthError("Invalid email or password", apiStatusCode.Unauthorized, "INVALID_CREDENTIALS");

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

        logger.info("User logged in", { userId: user.id });
        return { user, accessToken, refreshToken: refreshPlain };
    } catch (error: any) {
        logger.error("Login failed", { email, error: error.message });
        if (!(error instanceof AuthError)) {
            console.error("Login service error:", error);
        }
        throw error;
    }
};

// logout service
export const logout = async (userId: string, refreshToken: string) => {
    try {
        if (!userId || !refreshToken) throw new AuthError("Missing userId or refreshToken", apiStatusCode.BadRequest);
        
        const tokenHash = hashToken(refreshToken);
        
        // Verify token exists and belongs to user
        const tokenExists = await prisma.refreshToken.findFirst({
            where: {
                userId,
                tokenHash,
                revoked: false
            }
        });
        
        if (!tokenExists) {
            throw new AuthError("Invalid or already revoked refresh token", apiStatusCode.Unauthorized, "INVALID_TOKEN");
        }
        
        // Revoke the token
        const result = await prisma.refreshToken.update({
            where: { id: tokenExists.id },
            data: { revoked: true }
        });
        
        logger.info("User logged out", { userId, tokenId: result.id });
        return true;
    } catch (error) {
        if (error instanceof AuthError) {
            logger.warn("Logout failed", { userId, error: (error as Error).message });
            throw error;
        }
        console.error("Logout service error:", error);
        logger.error("Logout service error:", error);
        throw new AuthError("Failed to logout", apiStatusCode.BadRequest);
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

        // Verify user still exists in the database
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user || user.deletedAt) {
            // Revoke the orphaned refresh token
            await prisma.refreshToken.update({
                where: { id: found.id },
                data: { revoked: true }
            });
            throw new Error("User not found");
        }

        // issue new tokens
        const newplain = randomTokenHex(64);
        const newHash = hashToken(newplain);
        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days


        await prisma.$transaction(async (tx: any) => {
            // Revoke the old token
            await tx.refreshToken.update({
                where: {
                    id: found.id
                },
                data: {
                    revoked: true,
                    replacedBy: newHash
                },
            });

            // Create the new token
            await tx.refreshToken.create({
                data: {
                    userId,
                    tokenHash: newHash,
                    expiresAt: newExpiry
                }
            });

            // Cleanup old refresh tokens for this user
            // Delete expired tokens and revoked tokens older than 7 days
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            await tx.refreshToken.deleteMany({
                where: {
                    userId,
                    OR: [
                        { expiresAt: { lt: new Date() } }, // Expired tokens
                        {
                            revoked: true,
                            updatedAt: { lt: sevenDaysAgo } // Revoked tokens older than 7 days
                        }
                    ]
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