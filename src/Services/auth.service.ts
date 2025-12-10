import { PrismaClient } from "@prisma/client/extension";
import { hashPassword, hashToken, randomTokenHex, verifyPassword } from "../utils/hash.utils"
import { sendEmail } from "../utils/emailSend.utils"
import { signAccessToken } from "../utils/token.utils";

const prisma = new PrismaClient();

// Signup service
export const signup = async (email: string, password: string, username: string, role: string) => {
    try {
        const existing = await prisma.user.findFirst({
            where: {
                or: [{ email }, { username }]
            }
        })
        if (existing) throw new Error("Email or Username already in use");

        // password hashing
        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                role,
            }
        });

        // create verification tokenPlain 
        const tokenPlain = randomTokenHex(32);
        await prisma.emailToken.create({
            data: {
                userId: user.id,
                tokenHash: hashToken(tokenPlain),
                type: "VERIFY_EMAIL",
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
            }
        })

        // send verification email
        const link = `${process.env.FRONTEND_URL}/verify?uid=${user.id}&token=${tokenPlain}`;
        sendEmail(
            user.email,
            "Verify your email",
            `<p>Please verify your email by clicking on the following link:
            <br>
            Email Verify code is : ${tokenPlain}
            <br>
            <a href="${link}">Verify Email</a>
            </p>`
        ).catch(console.error);

        return { user, tokenPlain };
    } catch (error) {
        console.error("Signup service error:", error);
        throw error;
    }
}

// login service
export const login = async (email: string, password: string) => {
    try {
        const user = await prisma.user.findFirst({
            where: { email }
        });
        if (!user) throw new Error("User not found");

        // password verification
        const isPasswordValid = await verifyPassword(password, user.passwordHash);
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
        const tokenHash = hashToken(refreshToken);
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                tokenHash
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
export const refreshTokens = async (userId: string, refreshToken: string) => {
    try {
        const tokenHash = hashToken(refreshToken);
        const found = await prisma.refreshToken.findFirst({ where: { userId, tokenHash } });
        if (!found || found.revoked || found.expiresAt < new Date()) throw new Error("Invalid refresh token");

        // issue new tokens
        const newplain = randomTokenHex(64);
        const newHash = hashToken(newplain);
        const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        // await prisma.refreshToken.update({
        //     where: {
        //         id: found.id
        //     },
        //     data: {
        //         revoked: true,
        //         replacedBy: newHash
        //     },
        // });

        // await prisma.refreshToken.create({
        //     data: {
        //         userId,
        //         tokenHash: newHash,
        //         expiresAt: newExpiry
        //     }
        // });

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
        // await prisma.user.update({
        //     where: {
        //         id: userId
        //     },
        //     data: {
        //         passwordHash: newPasswordHash
        //     }
        // });
        // await prisma.emailToken.update({
        //     where: {
        //         id: entry.id
        //     },
        //     data: {
        //         used: true
        //     }
        // });

        await prisma.$transaction(async (tx: any) => {
            await tx.user.update({
                where: {
                    id: userId
                },
                data: {
                    passwordHash: newPasswordHash
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
export const deleteUserById = async (userId: string) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error("User not found");

        await prisma.$transaction(async (tx: any) => {
            await tx.emailToken.deleteMany({
                where: { userId }
            });
            await tx.refreshToken.deleteMany({
                where: { userId }
            });
            await tx.user.delete({
                where: { id: userId }
            });
        });
        const xUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!xUser) {
            return true;
        }
    } catch (error) {
        console.error("Delete user by id service error:", error);
        throw error;
    }
};