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
        // Zod returns multiple field-level errors — join them for a clear message
        const message = err.errors.map((e) => e.message).join(", ");
        next(new ApiError(400, message));
    }
};
