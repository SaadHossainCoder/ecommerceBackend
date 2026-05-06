// Load environment variables as the VERY FIRST thing before any imports
import "dotenv/config";
import { assertEnv } from "./config/constants";
import app from "./app";
import { verifyEmailConfig } from "./utils/emailSend.utils";
import prisma from "./prisma/client";
// import { detectBotProtection } from "./middleware/detectBot-Protection";
// import { connectRedis } from "./cache/redis.config";

// Initialize email configuration check
verifyEmailConfig();
assertEnv(); // Call immediately after dotenv

const port = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("Hello from the secure server!");
    // console.log("Response sent");
});

async function startServer() {
    try {
        await prisma.$connect();
       console.log("✅ Database connected");
        // await connectRedis();
        console.log("Connected to Redis");
        app.listen(port, () => {
            console.log(`Example app listening on port ${port}`);
            console.log(`http://localhost:${port}`);
        });
    } catch (error) {
        console.error("Failed to start server:", error);
        process.exit(1);
    }
}

startServer();