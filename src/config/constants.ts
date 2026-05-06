
export const CONFIG = {
    DATABASE_URL: process.env.DATABASE_URL!,
    REFRESH_COOKIE_NAME: process.env.REFRESH_COOKIE_NAME || "jid",
    ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || "30m",
    JWT_SECRET: process.env.JWT_SECRET!,
    NODE_ENV: process.env.NODE_ENV || "development",
    FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
    REDIS_USERNAME: process.env.REDIS_USERNAME!,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD!,
    REDIS_HOST: process.env.REDIS_HOST!,
    REDIS_PORT: process.env.REDIS_PORT!,
    // REDIS_URL: process.env.REDIS_URL!,
};

export function assertEnv() {
    const missingVars = [];
    for (const [key, value] of Object.entries(CONFIG)) {
        if (!value) {
            missingVars.push(key);
        }
    }
    if (missingVars.length > 0) {
        throw new Error(`Missing environment variables: ${missingVars.join(", ")}`);
    }
}