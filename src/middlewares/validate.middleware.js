import { ApiError } from "../utils/ApiError.js";

/**
 * Zod Validation Middleware
 * Takes a Zod schema and validates the request body against it.
 * If validation passes, the sanitized data replaces req.body.
 * If validation fails, a 400 error with specific field messages is thrown.
 */
export const validate = (schema) => async (req, res, next) => {
    try {
        const parseBody = await schema.parseAsync(req.body);
        req.body = parseBody;
        next();
    } catch (err) {
        // Zod v4 uses `err.issues`, Zod v3 uses `err.errors` — support both
        const errors = err.issues || err.errors || [];
        const message = errors.map((e) => e.message).join(", ") || "Validation failed";
        next(new ApiError(400, message));
    }
};
