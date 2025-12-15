import prisma from "../lib/prisma";
import { Prisma } from "@prisma/client";
import logger from "../lib/logger"; // Winston
import { hashPassword, hashToken, randomTokenHex, verifyPassword } from "../utils/hash.utils";
import { sendEmail } from "../utils/emailSend.utils";
import { signAccessToken } from "../utils/token.utils";
import { apiStatusCode } from "../lib/apiCode.lib";
import { SignupInput, LoginInput /* etc. */ } from "../types/auth.types";
import { signupSchema, loginSchema /* etc. */ } from "../validators/auth.schema";

// Custom errors
export class AuthError extends Error {
    constructor(message: string, public statusCode: number, public code?: string) {
        super(message);
        this.name = "AuthError";
    }
}

export const signup = async (input: SignupInput) => {
    const parsed = signupSchema.parse(input); // Validate early
    const { username, email, password, role } = parsed;
    const normalizedEmail = email.toLowerCase();
    const normalizedUsername = username.toLowerCase();

    try {
        // Check existing
        const existing = await prisma.user.findFirst({
            where: { OR: [{ email: normalizedEmail }, { username: normalizedUsername }], deletedAt: null },
        });
        if (existing) throw new AuthError("Email or username already in use", 409, "DUPLICATE");

        const passwordHash = await hashPassword(password); // bcrypt.hash(password, 12)

        return await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: { username: normalizedUsername, email: normalizedEmail, password: passwordHash, role },
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
            const link = `${process.env.FRONTEND_URL}/verify?uid=${user.id}&token=${tokenPlain}`;
            sendEmail(user.email, "Verify your email", `<p>Verify: <a href="${link}">Link</a> or code: ${tokenPlain}</p>`)
                .catch((err) => logger.error("Email send failed", { userId: user.id, err }));

            logger.info("User signed up", { userId: user.id, role });
            return { user, tokenPlain };
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            throw new AuthError("User already exists", 409, "DUPLICATE");
        }
        logger.error("Signup failed", { email: normalizedEmail, error: (error as Error).message });
        throw new AuthError("Signup failed", 500);
    }
};

export const login = async (input: LoginInput) => {
    const parsed = loginSchema.parse(input);
    const { email, password } = parsed;
    const normalizedEmail = email.toLowerCase();

    try {
        const user = await prisma.user.findFirst({
            where: { email: normalizedEmail, deletedAt: null, lockedUntil: { lt: new Date() } }, // Not locked
        });
        if (!user) throw new AuthError("Invalid credentials", 401, "INVALID_CREDENTIALS");

        // Check attempts
        if (user.failedAttempts >= 5) throw new AuthError("Account locked. Try again later.", 429, "LOCKED");

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            await prisma.user.update({
                where: { id: user.id },
                data: { failedAttempts: { increment: 1 } },
            });
            throw new AuthError("Invalid credentials", 401, "INVALID_CREDENTIALS");
        }

        // Reset attempts, update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { failedAttempts: 0, lastLoginAt: new Date() },
        });

        const accessToken = signAccessToken({ sub: user.id, role: user.role });
        const refreshPlain = randomTokenHex(64);
        const refreshHash = hashToken(refreshPlain);

        await prisma.refreshToken.create({
            data: {
                userId: user.id,
                tokenHash: refreshHash,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
        });

        logger.info("User logged in", { userId: user.id });
        return { user: { id: user.id, username: user.username, email: user.email, role: user.role }, accessToken, refreshToken: refreshPlain };
    } catch (error) {
        logger.error("Login failed", { email: normalizedEmail, error: (error as Error).message });
        throw error instanceof AuthError ? error : new AuthError("Login failed", 500);
    }
};

// Similar enhancements for logout, refreshTokens (add rotation chain check), requestForgotPassword, etc.
// For refresh: Check replacedBy chain to prevent reuse of old tokens.

export const logout = async (userId: string, refreshToken: string) => {
    if (!userId || !refreshToken) throw new AuthError("Invalid input", 400);

    const tokenHash = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
        where: { userId, tokenHash, revoked: false },
        data: { revoked: true },
    });

    logger.info("User logged out", { userId });
};

export const refreshTokens = async (refreshToken: string) => {
    if (!refreshToken) throw new AuthError("Missing refresh token", 400);

    const tokenHash = hashToken(refreshToken);
    const found = await prisma.refreshToken.findFirst({
        where: { tokenHash, revoked: false, expiresAt: { gt: new Date() } },
        include: { user: { select: { id: true, role: true } } },
    });
    if (!found) throw new AuthError("Invalid refresh token", 401);

    // Check if replaced (prevent old token use)
    const latest = await prisma.refreshToken.findFirst({
        where: { userId: found.userId, revoked: false },
        orderBy: { createdAt: "desc" },
    });
    if (latest?.id !== found.id) throw new AuthError("Token replaced", 401);

    const newPlain = randomTokenHex(64);
    const newHash = hashToken(newPlain);
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await prisma.$transaction(async (tx) => {
        await tx.refreshToken.update({ where: { id: found.id }, data: { revoked: true, replacedBy: newHash } });
        await tx.refreshToken.create({ data: { userId: found.userId, tokenHash: newHash, expiresAt: newExpiry } });
    });

    const accessToken = signAccessToken({ sub: found.user.id, role: found.user.role });
    logger.info("Tokens refreshed", { userId: found.userId });
    return { refreshToken: newPlain, accessToken };
};

// ... Implement requestForgotPassword, resetPassword (with complexity), verifyEmailToken, createOtp/verifyOtp similarly.
// For OTP: Use numeric hash, short expiry.

export const getAllUsers = async (query: PaginationQuery = {}) => {
    const { page = 1, limit = 10, role, verified } = query;
    const skip = (page - 1) * limit;
    const where = {
        deletedAt: null,
        ...(role && { role }),
        ...(verified !== undefined && { isEmailVerified: verified }),
    };

    const [users, total] = await Promise.all([
        prisma.user.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: "desc" },
            select: { id: true, username: true, email: true, role: true, isEmailVerified: true, createdAt: true, updatedAt: true },
        }),
        prisma.user.count({ where }),
    ]);

    logger.info("Users fetched", { page, limit, total });
    return { users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

export const getUserById = async (userId: string) => {
    if (!userId) throw new AuthError("Missing user ID", 400);
    const user = await prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: { id: true, username: true, email: true, role: true, isEmailVerified: true, createdAt: true, updatedAt: true },
    });
    if (!user) throw new AuthError("User not found", 404);
    return user;
};

export const deleteUserById = async (userId: string, adminId: string) => {
    if (!userId || !adminId) throw new AuthError("Invalid input", 400);
    if (userId === adminId) throw new AuthError("Cannot delete self", 403, "SELF_DELETE");

    const [admin, user] = await Promise.all([
        prisma.user.findUnique({ where: { id: adminId, deletedAt: null } }),
        prisma.user.findUnique({ where: { id: userId, deletedAt: null } }),
    ]);
    if (!admin || admin.role !== "ADMIN") throw new AuthError("Admin required", 403);
    if (!user) throw new AuthError("User not found", 404);
    if (user.role === "ADMIN") throw new AuthError("Cannot delete admin", 403, "ADMIN_DELETE");

    await prisma.$transaction(async (tx) => {
        await tx.emailToken.deleteMany({ where: { userId } });
        await tx.refreshToken.deleteMany({ where: { userId } });
        await tx.user.update({ where: { id: userId }, data: { deletedAt: new Date() } }); // Soft delete
    });

    logger.info("User deleted", { userId, adminId });
    return true;
};