import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import { aj } from "./config/arcjet";
import { rateLimit } from "express-rate-limit";
import http from "node:http";
import { errorHandler } from "./middleware/error-handler.middlewere";
import userRoutes from "./routes/user.routes";
import cookieParser from 'cookie-parser';

import dotenv from "dotenv";
import e from "express";
dotenv.config();

const app = express();

// ----------------------
// 🌐 1. CORS
// ----------------------
app.use(cors({
    origin: ["http://localhost:3000", process.env.FRONTEND_URL!],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
}));



// ======================================================
// 2. 🧾 Body Parser
// (No need for body-parser package now)
// ======================================================
app.use(express.json({ limit: "20kb" }));
app.use(express.urlencoded({ extended: true, limit: "20kb" }));
app.use(cookieParser());

// ======================================================
// 3. 🛡️ Security Middlewares
// ======================================================

//Helmet - Secure Http headers
app.use(helmet);

// Prevent NoSQL injection ($gt, $ne)
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// Rate limiter (global, tweak for important routes)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 mins
    max: 200, // change for production
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests from this IP, please try later." }
});
app.use(limiter);



// ======================================================
// 4. 🚀 Test Route
// ======================================================
    app.use("/api/users", userRoutes);


// ======================================================
// 5. 🤖 Arcjet — AI Security Layer Middleware
// ======================================================
// Protect Any Route
app.use(async (req, res, next) => {
    const decision = await aj.protect(req);

    if (decision.isDenied()) {
        return res.status(429).json({ error: "Rate limit exceeded" });
    }

    next();
});

const server = http.createServer(async function (
    req: http.IncomingMessage,
    res: http.ServerResponse,
) {
    const userId = "user123"; // Replace with your authenticated user ID
    const decision = await aj.protect(req, { userId, requested: 5 }); // Deduct 5 tokens from the bucket
    console.log("Arcjet decision", decision);

    if (decision.isDenied()) {
        res.writeHead(429, { "Content-Type": "application/json" });
        res.end(
            JSON.stringify({ error: "Too Many Requests", reason: decision.reason }),
        );
    } else {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Hello world" }));
    }
});
server.listen(3000);

// ======================================================
// 5. 🔥 Global Error Handler
// ======================================================
app.use(errorHandler);


export default app;