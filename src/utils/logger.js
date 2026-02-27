import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom log format for readable console output in development
const devFormat = printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level}]: ${stack || message}`;
});

// Structured JSON format for production log aggregation tools
const prodFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const log = {
        timestamp,
        level,
        message: stack || message,
        ...(Object.keys(meta).length && { meta }),
    };
    return JSON.stringify(log);
});

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "warn" : "debug",
    format: combine(
        errors({ stack: true }), // Capture stack traces from Error objects
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" })
    ),
    transports: [
        // Console transport — colored output for development
        new winston.transports.Console({
            format: combine(
                colorize(),
                process.env.NODE_ENV === "production" ? prodFormat : devFormat
            ),
        }),

        // File transport — error logs persisted to disk
        new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
            format: prodFormat,
            maxsize: 5 * 1024 * 1024, // 5MB per file
            maxFiles: 5,              // Keep last 5 rotated files
        }),

        // File transport — all logs for audit and debugging
        new winston.transports.File({
            filename: "logs/combined.log",
            format: prodFormat,
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5,
        }),
    ],

    // Do not exit on uncaught exceptions — let graceful shutdown handle it
    exitOnError: false,
});

export default logger;