import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
    let error = err;

    // 1. Check agar error humara jana-pehchana 'ApiError' nahi hai
    if (!(error instanceof ApiError)) {
        // Agar Mongoose ka error hai ya koi simple JS error, toh use standardize karo
        const statusCode =
            error.statusCode || error instanceof mongoose.Error ? 400 : 500;

        const message = error.message || "Something went wrong";
        
        // Error ko humare standard format mein convert kar do
        error = new ApiError(statusCode, message, error?.errors || [], err.stack);
    }

    // 2. Response taiyar karo
    const response = {
        ...error,
        message: error.message,
        ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}), // Production mein stack trace mat dikhao 🔒
    };

    // 3. User ko bhejo
    return res.status(error.statusCode).json(response);
};

export { errorHandler };