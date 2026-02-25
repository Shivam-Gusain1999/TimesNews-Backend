import { z } from "zod";

// Defines validation schemas mapping to the User Model

export const registerSchema = z.object({

    // 1. fullName: Required, with basic length validation
    fullName: z
        .string({ required_error: "Full name is required" })
        .trim()
        .min(2, { message: "Full name must be at least 2 characters long" })
        .max(50, { message: "Full name cannot exceed 50 characters" }),

    // 2. username: Required, no spaces, lowercase (Regex prevents DB errors)
    username: z
        .string({ required_error: "Username is required" })
        .trim()
        .toLowerCase()
        .min(3, { message: "Username must be at least 3 characters long" })
        .max(20, { message: "Username cannot exceed 20 characters" })
        .regex(/^[a-zA-Z0-9_]+$/, { message: "Username can only contain letters, numbers, and underscores" }),

    // 3. email: Required, standard email validation
    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .toLowerCase()
        .email({ message: "Invalid email format. Please enter a valid email" }),

    // 4. password: Required, enforcing minimum length
    password: z
        .string({ required_error: "Password is required" })
        .min(6, { message: "Password must be at least 6 characters long" })
        .max(100, { message: "Password is too long" }),

    // 5. bio: Optional, max 250 characters
    bio: z
        .string()
        .trim()
        .max(250, { message: "Bio cannot exceed 250 characters" })
        .optional()
});

// Validation schema for Login credentials
export const loginSchema = z.object({
    // Support login via either username or email
    email: z.string().email({ message: "Invalid email format" }).optional(),
    username: z.string().trim().optional(),
    password: z.string({ required_error: "Password is required" }).min(1, "Password cannot be empty")
}).refine(data => data.email || data.username, {
    // Refinement ensures that at least one (email or username) is provided
    message: "Either username or email must be provided to login",
    path: ["username"]
});