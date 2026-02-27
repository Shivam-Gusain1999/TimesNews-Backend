import { z } from "zod";

/**
 * Validation schema for creating a new article.
 * Applied via the validate() middleware at the route level.
 */
export const createArticleSchema = z.object({
    title: z
        .string({ required_error: "Title is required" })
        .trim()
        .min(5, { message: "Title must be at least 5 characters long" })
        .max(200, { message: "Title cannot exceed 200 characters" }),

    content: z
        .string({ required_error: "Content is required" })
        .min(10, { message: "Content must be at least 10 characters long" }),

    categoryId: z
        .string({ required_error: "Category is required" })
        .min(1, { message: "Category ID is required" }),

    tags: z
        .string()
        .optional(),

    isFeatured: z
        .union([z.boolean(), z.string()])
        .optional(),
});

/**
 * Validation schema for updating an existing article.
 * All fields are optional since partial updates are allowed.
 */
export const updateArticleSchema = z.object({
    title: z
        .string()
        .trim()
        .min(5, { message: "Title must be at least 5 characters long" })
        .max(200, { message: "Title cannot exceed 200 characters" })
        .optional(),

    content: z
        .string()
        .min(10, { message: "Content must be at least 10 characters long" })
        .optional(),

    categoryId: z.string().optional(),

    status: z
        .enum(["DRAFT", "PUBLISHED", "ARCHIVED", "BLOCKED"])
        .optional(),

    tags: z.string().optional(),
    isFeatured: z.union([z.boolean(), z.string()]).optional(),
});
