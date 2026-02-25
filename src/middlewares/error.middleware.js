import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // 1. Check if the error is an instance of our custom ApiError
    if (!(error instanceof ApiError)) {
        // Standardize Mongoose or native JS errors
        const statusCode =
            error.statusCode || (error instanceof mongoose.Error ? 400 : 500);

        const message = error.message || "Something went wrong";

        // Convert the error to our standard ApiError format
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    // 2. Prepare the response payload
    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}), // Hide stack trace in production 🔒
    };

    // 3. Send response to the client
    return res.status(error.statusCode).json(response);
};

export { errorHandler };