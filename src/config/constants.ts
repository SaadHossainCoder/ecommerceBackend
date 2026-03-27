
export const CONFIG = {
    REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME || "jid",
    ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || "30m",
    JWT_SECRET: process.env.JWT_SECRET!,
    NODE_ENV: process.env.NODE_ENV || "development",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000"
};
