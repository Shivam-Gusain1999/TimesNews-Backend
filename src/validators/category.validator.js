import { z } from "zod";

/**
 * Validation schema for creating/updating a category.
 */
export const categorySchema = z.object({
    name: z
        .string({ required_error: "Category name is required" })
        .trim()
        .min(2, { message: "Category name must be at least 2 characters" })
        .max(50, { message: "Category name cannot exceed 50 characters" }),
});
