import { connectDB } from "./config/db.js";
import app from "./app.js";
import logger from "./utils/logger.js";
import fs from "fs";

// Ensure Multer's temp upload directory exists (required on cloud platforms like Render)
const tempDir = "./public/temp";
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
    logger.info("Created temp upload directory: ./public/temp");
}
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        const server = app.listen(PORT, () => {
            logger.info(`Server is running at port: ${PORT}`);
            logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
        });

        // Handle server-level errors (e.g., port conflicts)
        server.on("error", (error) => {
            logger.error("Server Error:", error);
            process.exit(1);
        });

        // Graceful Shutdown Handler
        // Ensures in-flight requests complete and DB connections close cleanly
        const gracefulShutdown = (signal) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);

            server.close(() => {
                logger.info("HTTP server closed. No new connections accepted.");

                // Close database connection
                import("mongoose").then(({ default: mongoose }) => {
                    mongoose.connection
                        .close(false)
                        .then(() => {
                            logger.info("MongoDB connection closed.");
                            process.exit(0);
                        });
                });
            });

            // Force shutdown after 10 seconds if graceful shutdown fails
            setTimeout(() => {
                logger.error("Forced shutdown — graceful shutdown timed out.");
                process.exit(1);
            }, 10000);
        };

        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));

        // Catch uncaught exceptions and unhandled promise rejections
        process.on("uncaughtException", (error) => {
            logger.error("Uncaught Exception:", error);
            gracefulShutdown("uncaughtException");
        });

        process.on("unhandledRejection", (reason) => {
            logger.error("Unhandled Rejection:", reason);
            gracefulShutdown("unhandledRejection");
        });
    })
    .catch((err) => {
        logger.error("MongoDB connection FAILED:", err);
        process.exit(1);
    });