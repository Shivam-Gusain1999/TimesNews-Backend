import { z } from "zod";

/**
 * Validation schema for the contact/message form submission.
 */
export const sendMessageSchema = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .trim()
        .min(2, { message: "Name must be at least 2 characters" })
        .max(100, { message: "Name cannot exceed 100 characters" }),

    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .email({ message: "Invalid email format" }),

    subject: z
        .string()
        .trim()
        .max(200, { message: "Subject cannot exceed 200 characters" })
        .optional(),

    message: z
        .string({ required_error: "Message is required" })
        .trim()
        .min(10, { message: "Message must be at least 10 characters" })
        .max(5000, { message: "Message cannot exceed 5000 characters" }),
});
