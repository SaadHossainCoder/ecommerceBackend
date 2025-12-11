import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prismaClientSingleton = () => {
    const databaseUrl = process.env.DATABASE_URL;
    console.log("Initializing PrismaClient");

    if (!databaseUrl) {
        throw new Error("DATABASE_URL environment variable is not set");
    }

    return new PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
