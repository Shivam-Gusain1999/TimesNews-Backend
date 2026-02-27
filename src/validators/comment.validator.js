import { z } from "zod";

/**
 * Validation schema for adding a comment.
 */
export const addCommentSchema = z.object({
    content: z
        .string({ required_error: "Comment content is required" })
        .trim()
        .min(1, { message: "Comment cannot be empty" })
        .max(1000, { message: "Comment cannot exceed 1000 characters" }),
});
