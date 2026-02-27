import rateLimit from "express-rate-limit";

/**
 * Global Rate Limiter
 * Limits each IP to 100 requests per 15-minute window.
 * Prevents abuse and basic DDoS protection.
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,   // Disable `X-RateLimit-*` headers
    message: {
        statusCode: 429,
        success: false,
        message: "Too many requests from this IP, please try again after 15 minutes.",
    },
});

/**
 * Auth Rate Limiter (Login / Register)
 * Stricter limit to prevent brute-force attacks.
 * 10 attempts per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message: "Too many login/register attempts. Please try again after 15 minutes.",
    },
});

/**
 * View Increment Limiter
 * Prevents artificial inflation of article view counts.
 * 30 view increments per IP per 15 minutes.
 */
export const viewLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        statusCode: 429,
        success: false,
        message: "View count rate limit exceeded.",
    },
});