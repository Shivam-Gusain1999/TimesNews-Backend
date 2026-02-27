import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema } from "../../src/validators/user.validator.js";
import { createArticleSchema, updateArticleSchema } from "../../src/validators/article.validator.js";

// ============================================================================
// USER VALIDATOR TESTS
// ============================================================================
describe("User Validators", () => {

    // =========================
    // Register Schema
    // =========================
    describe("registerSchema", () => {
        const validData = {
            fullName: "Shivam Gusain",
            username: "shivam_dev",
            email: "shivam@example.com",
            password: "securePass123"
        };

        it("should pass with valid registration data", async () => {
            const result = await registerSchema.parseAsync(validData);
            expect(result.fullName).toBe("Shivam Gusain");
            expect(result.username).toBe("shivam_dev");
            expect(result.email).toBe("shivam@example.com");
        });

        it("should reject missing fullName", async () => {
            const { fullName, ...data } = validData;
            await expect(registerSchema.parseAsync(data)).rejects.toThrow();
        });

        it("should reject missing email", async () => {
            const { email, ...data } = validData;
            await expect(registerSchema.parseAsync(data)).rejects.toThrow();
        });

        it("should reject missing password", async () => {
            const { password, ...data } = validData;
            await expect(registerSchema.parseAsync(data)).rejects.toThrow();
        });

        it("should reject missing username", async () => {
            const { username, ...data } = validData;
            await expect(registerSchema.parseAsync(data)).rejects.toThrow();
        });

        it("should reject invalid email format", async () => {
            await expect(
                registerSchema.parseAsync({ ...validData, email: "not-an-email" })
            ).rejects.toThrow();
        });

        it("should reject short password (< 6 chars)", async () => {
            await expect(
                registerSchema.parseAsync({ ...validData, password: "abc" })
            ).rejects.toThrow();
        });

        it("should reject username with special characters", async () => {
            await expect(
                registerSchema.parseAsync({ ...validData, username: "user@name!" })
            ).rejects.toThrow();
        });

        it("should reject username shorter than 3 characters", async () => {
            await expect(
                registerSchema.parseAsync({ ...validData, username: "ab" })
            ).rejects.toThrow();
        });

        it("should trim whitespace from fullName", async () => {
            const result = await registerSchema.parseAsync({
                ...validData,
                fullName: "  Shivam Gusain  "
            });
            expect(result.fullName).toBe("Shivam Gusain");
        });

        it("should lowercase the email", async () => {
            const result = await registerSchema.parseAsync({
                ...validData,
                email: "SHIVAM@EXAMPLE.COM"
            });
            expect(result.email).toBe("shivam@example.com");
        });

        it("should accept optional bio within limits", async () => {
            const result = await registerSchema.parseAsync({
                ...validData,
                bio: "I love coding"
            });
            expect(result.bio).toBe("I love coding");
        });

        it("should reject bio exceeding 250 characters", async () => {
            await expect(
                registerSchema.parseAsync({ ...validData, bio: "x".repeat(251) })
            ).rejects.toThrow();
        });
    });

    // =========================
    // Login Schema
    // =========================
    describe("loginSchema", () => {
        it("should pass with email and password", async () => {
            const result = await loginSchema.parseAsync({
                email: "test@example.com",
                password: "password123"
            });
            expect(result.email).toBe("test@example.com");
        });

        it("should pass with username and password", async () => {
            const result = await loginSchema.parseAsync({
                username: "testuser",
                password: "password123"
            });
            expect(result.username).toBe("testuser");
        });

        it("should reject when neither email nor username is provided", async () => {
            await expect(
                loginSchema.parseAsync({ password: "password123" })
            ).rejects.toThrow();
        });

        it("should reject empty password", async () => {
            await expect(
                loginSchema.parseAsync({ email: "test@example.com", password: "" })
            ).rejects.toThrow();
        });

        it("should reject missing password entirely", async () => {
            await expect(
                loginSchema.parseAsync({ email: "test@example.com" })
            ).rejects.toThrow();
        });
    });
});


// ============================================================================
// ARTICLE VALIDATOR TESTS
// ============================================================================
describe("Article Validators", () => {

    // =========================
    // Create Article Schema
    // =========================
    describe("createArticleSchema", () => {
        const validArticle = {
            title: "Breaking News: Major Event",
            content: "This is the detailed content of the article about the major event.",
            categoryId: "507f1f77bcf86cd799439011"
        };

        it("should pass with valid article data", async () => {
            const result = await createArticleSchema.parseAsync(validArticle);
            expect(result.title).toBe("Breaking News: Major Event");
        });

        it("should reject missing title", async () => {
            const { title, ...data } = validArticle;
            await expect(createArticleSchema.parseAsync(data)).rejects.toThrow();
        });

        it("should reject missing content", async () => {
            const { content, ...data } = validArticle;
            await expect(createArticleSchema.parseAsync(data)).rejects.toThrow();
        });

        it("should reject missing categoryId", async () => {
            const { categoryId, ...data } = validArticle;
            await expect(createArticleSchema.parseAsync(data)).rejects.toThrow();
        });

        it("should reject title shorter than 5 characters", async () => {
            await expect(
                createArticleSchema.parseAsync({ ...validArticle, title: "Hi" })
            ).rejects.toThrow();
        });

        it("should reject content shorter than 10 characters", async () => {
            await expect(
                createArticleSchema.parseAsync({ ...validArticle, content: "Short" })
            ).rejects.toThrow();
        });

        it("should accept optional tags as string", async () => {
            const result = await createArticleSchema.parseAsync({
                ...validArticle,
                tags: "news,breaking,world"
            });
            expect(result.tags).toBe("news,breaking,world");
        });

        it("should accept optional isFeatured as boolean", async () => {
            const result = await createArticleSchema.parseAsync({
                ...validArticle,
                isFeatured: true
            });
            expect(result.isFeatured).toBe(true);
        });
    });

    // =========================
    // Update Article Schema
    // =========================
    describe("updateArticleSchema", () => {
        it("should pass with empty object (all fields optional)", async () => {
            const result = await updateArticleSchema.parseAsync({});
            expect(result).toBeDefined();
        });

        it("should pass with partial update (title only)", async () => {
            const result = await updateArticleSchema.parseAsync({
                title: "Updated Title Here"
            });
            expect(result.title).toBe("Updated Title Here");
        });

        it("should reject invalid status enum value", async () => {
            await expect(
                updateArticleSchema.parseAsync({ status: "INVALID_STATUS" })
            ).rejects.toThrow();
        });

        it("should accept valid status values", async () => {
            for (const status of ["DRAFT", "PUBLISHED", "ARCHIVED", "BLOCKED"]) {
                const result = await updateArticleSchema.parseAsync({ status });
                expect(result.status).toBe(status);
            }
        });

        it("should reject title shorter than 5 characters", async () => {
            await expect(
                updateArticleSchema.parseAsync({ title: "Hi" })
            ).rejects.toThrow();
        });
    });
});
