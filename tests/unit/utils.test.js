import { describe, it, expect } from "vitest";
import { ApiError } from "../../src/utils/ApiError.js";
import { ApiResponse } from "../../src/utils/ApiResponse.js";
import { asyncHandler } from "../../src/utils/asyncHandler.js";

// ============================================================================
// ApiError TESTS
// ============================================================================
describe("ApiError", () => {
    it("should create an error with correct statusCode and message", () => {
        const error = new ApiError(404, "Not Found");
        expect(error.statusCode).toBe(404);
        expect(error.message).toBe("Not Found");
        expect(error.success).toBe(false);
        expect(error.data).toBeNull();
    });

    it("should be an instance of Error", () => {
        const error = new ApiError(500, "Server Error");
        expect(error).toBeInstanceOf(Error);
    });

    it("should use default message when none provided", () => {
        const error = new ApiError(500);
        expect(error.message).toBe("Something went wrong");
    });

    it("should capture stack trace", () => {
        const error = new ApiError(400, "Bad Request");
        expect(error.stack).toBeDefined();
        expect(error.stack.length).toBeGreaterThan(0);
    });

    it("should accept custom errors array", () => {
        const errors = [
            { field: "email", message: "Invalid email" },
            { field: "password", message: "Too short" }
        ];
        const error = new ApiError(400, "Validation Failed", errors);
        expect(error.errors).toEqual(errors);
        expect(error.errors).toHaveLength(2);
    });

    it("should use provided stack trace when given", () => {
        const customStack = "Custom stack trace";
        const error = new ApiError(500, "Error", [], customStack);
        expect(error.stack).toBe(customStack);
    });
});


// ============================================================================
// ApiResponse TESTS
// ============================================================================
describe("ApiResponse", () => {
    it("should create a successful response (2xx)", () => {
        const response = new ApiResponse(200, { id: 1 }, "Success");
        expect(response.statusCode).toBe(200);
        expect(response.data).toEqual({ id: 1 });
        expect(response.message).toBe("Success");
        expect(response.success).toBe(true);
    });

    it("should mark as success for 201 status", () => {
        const response = new ApiResponse(201, { id: 1 }, "Created");
        expect(response.success).toBe(true);
    });

    it("should mark as failure for 4xx status", () => {
        const response = new ApiResponse(400, null, "Bad Request");
        expect(response.success).toBe(false);
    });

    it("should mark as failure for 5xx status", () => {
        const response = new ApiResponse(500, null, "Server Error");
        expect(response.success).toBe(false);
    });

    it("should use default message when none provided", () => {
        const response = new ApiResponse(200, {});
        expect(response.message).toBe("Success");
    });

    it("should handle null data", () => {
        const response = new ApiResponse(200, null, "No data");
        expect(response.data).toBeNull();
    });

    it("should handle array data", () => {
        const articles = [{ id: 1 }, { id: 2 }];
        const response = new ApiResponse(200, articles, "Articles fetched");
        expect(response.data).toHaveLength(2);
    });
});


// ============================================================================
// asyncHandler TESTS
// ============================================================================
describe("asyncHandler", () => {
    it("should call the handler function with req, res, next", async () => {
        let called = false;
        const handler = asyncHandler(async (req, res, next) => {
            called = true;
        });

        const req = {};
        const res = {};
        const next = () => { };

        await handler(req, res, next);
        expect(called).toBe(true);
    });

    it("should forward errors to next() on rejection", async () => {
        const testError = new Error("Test error");
        const handler = asyncHandler(async () => {
            throw testError;
        });

        let caughtError = null;
        const next = (err) => { caughtError = err; };

        await handler({}, {}, next);
        expect(caughtError).toBe(testError);
    });

    it("should forward ApiError instances to next()", async () => {
        const handler = asyncHandler(async () => {
            throw new ApiError(401, "Unauthorized");
        });

        let caughtError = null;
        const next = (err) => { caughtError = err; };

        await handler({}, {}, next);
        expect(caughtError).toBeInstanceOf(ApiError);
        expect(caughtError.statusCode).toBe(401);
    });

    it("should not call next on success", async () => {
        const handler = asyncHandler(async (req, res, next) => {
            // Success - no error thrown
        });

        let nextCalled = false;
        const next = () => { nextCalled = true; };

        await handler({}, {}, next);
        expect(nextCalled).toBe(false);
    });
});
