import { rateLimit } from "express-rate-limit";

// ─────────────────────────────────────────────────────────────────────────────
// Shared response message helper
// ─────────────────────────────────────────────────────────────────────────────
const tooManyMsg = (action: string) => ({
    ok: false,
    message: `Too many ${action} attempts. Please try again later.`,
});

// ─────────────────────────────────────────────────────────────────────────────
// 🔐 AUTH LIMITERS  (strictest – these touch DB + send emails)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /auth/signup — 5 accounts per IP per 15 min */
export const signupLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("signup"),
});

/** POST /auth/login — 10 attempts per IP per 15 min */
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("login"),
});

/** POST /auth/refresh — 60 token refreshes per IP per 15 min (silent background calls) */
export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("token refresh"),
});

/** POST /auth/forgot — 5 password reset emails per IP per hour */
export const forgotPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,   // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("forgot password"),
});

/** POST /auth/reset — 10 password resets per IP per hour */
export const resetPasswordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("password reset"),
});

/** POST /auth/otp/send — 5 OTP sends per IP per 10 min (stops OTP spam) */
export const otpSendLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("OTP send"),
});

/** POST /auth/otp/verify — 10 OTP attempts per IP per 10 min (stops brute force) */
export const otpVerifyLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("OTP verification"),
});

// ─────────────────────────────────────────────────────────────────────────────
// 🛒 PRODUCT LIMITERS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /products (public read) — 100 per IP per 5 min */
export const productReadLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("product requests"),
});

/** GET /products/search — 30 searches per IP per minute (search is expensive) */
export const searchLimiter = rateLimit({
    windowMs: 60 * 1000,        // 1 min
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("search"),
});

/** POST/PUT/DELETE /products (admin writes) — 50 per IP per 15 min */
export const productWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("product write"),
});

/** POST /products/:id/review — 5 reviews per IP per hour (stops review spam) */
export const reviewSubmitLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("review submission"),
});

// ─────────────────────────────────────────────────────────────────────────────
// 🎟️ COUPON LIMITERS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /coupons/validate — 20 validations per IP per 15 min (stops code brute-force) */
export const couponValidateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("coupon validation"),
});

// ─────────────────────────────────────────────────────────────────────────────
// 📍 ADDRESS LIMITERS
// ─────────────────────────────────────────────────────────────────────────────

/** POST /addresses — 10 address creates per IP per 15 min */
export const addressWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("address creation"),
});

// ─────────────────────────────────────────────────────────────────────────────
// ⭐ REVIEW LIMITERS (review.routes.ts — separate from product reviews)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /reviews/product/:id — 5 review posts per IP per hour */
export const reviewPostLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("review post"),
});

// ─────────────────────────────────────────────────────────────────────────────
// 📢 NOTIFICATION BAR LIMITERS
// ─────────────────────────────────────────────────────────────────────────────

/** GET /notification-bar (public) — 60 reads per IP per minute */
export const notificationReadLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("notification bar requests"),
});

// ─────────────────────────────────────────────────────────────────────────────
// 🏪 VENDOR / CATEGORY / BANNER LIMITERS  (public reads are cached by Redis)
// ─────────────────────────────────────────────────────────────────────────────

/** Public read limiter for vendor / category / banner — 80 per IP per 5 min */
export const publicReadLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 80,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("requests"),
});

/** Admin write limiter (generic) — 50 per IP per 15 min */
export const adminWriteLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: tooManyMsg("admin operations"),
});
