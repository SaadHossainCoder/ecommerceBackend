// lib/logger.ts
import winston from 'winston';

// Custom format for adding timestamp and labels
const customFormat = winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let msg = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) msg += `\n${stack}`;
    if (Object.keys(meta).length > 0) msg += `\n${JSON.stringify(meta, null, 2)}`;
    return msg;
});

// Production-ready Winston logger configuration
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info', // Env: 'debug', 'info', 'warn', 'error'
    format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }), // Include stack traces
        winston.format.splat(), // For printf interpolation
        customFormat
    ),
    defaultMeta: { service: 'auth-api' }, // Add service name for context
    transports: [
        // Console transport with colors for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                customFormat
            ),
            level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
        }),
        // Combined log file (all levels)
        new winston.transports.File({
            filename: 'logs/combined.log',
            maxsize: 5 * 1024 * 1024, // 5MB rotation
            maxFiles: 10,
            tailable: true,
            zippedArchive: true,
        }),
        // Error log file (errors only)
        new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
            maxsize: 5 * 1024 * 1024, // 5MB
            maxFiles: 10,
            tailable: true,
            zippedArchive: true,
        }),
    ],
    exceptionHandlers: [
        new winston.transports.File({ filename: 'logs/exceptions.log' }),
    ],
    rejectionHandlers: [
        new winston.transports.File({ filename: 'logs/rejections.log' }),
    ],
});

// Handle uncaught exceptions and unhandled rejections globally
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', { error: err });
    process.exit(1);
});

process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Rejection:', { error: err });
    process.exit(1);
});

// Ensure logs directory exists (in production, use mkdirp or similar)
import fs from 'fs';
import path from 'path';
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

export default logger;