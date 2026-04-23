import express from "express";
import cors from "cors";
import helmet from "helmet";
import hpp from "hpp";
import { rateLimit } from "express-rate-limit";
import { errorHandler } from "./middleware/error-handler.middleware";
import cookieParser from 'cookie-parser';
// import { apiStatusCode } from "./lib/apiCode.lib";
import logger from "./lib/logger";
import rootRouter from "./routes/allRoutes";


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
app.use(helmet());

// Prevent NoSQL injection ($gt, $ne)
// DISABLED: express-mongo-sanitize incompatible with Node.js (query is read-only)
// Use Zod/input validation instead
// app.use(mongoSanitize());

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
// 4. 📜 logger Handler (Moved up to capture all requests)
// ======================================================
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.http(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, { ip: req.ip });
    });
    next();
});

// ======================================================
// 5. 🚀  Route
// ======================================================
app.use("/api", rootRouter);

// ======================================================
// 6. 🔥 Global Error Handler
// ======================================================
app.use(errorHandler);


export default app;