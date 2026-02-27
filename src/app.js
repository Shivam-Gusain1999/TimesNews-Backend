// External Packages
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";

// Middlewares
import { errorHandler } from "./middlewares/error.middleware.js";
import { globalLimiter, authLimiter, viewLimiter } from "./middlewares/rateLimiter.middleware.js";

// Routes
import userRouter from "./routes/user.routes.js";
import articleRouter from "./routes/article.routes.js";
import categoryRouter from "./routes/category.routes.js";
import adminRouter from "./routes/admin.routes.js";
import commentRouter from "./routes/comment.routes.js";
import messageRouter from "./routes/message.routes.js";
import settingRouter from "./routes/setting.routes.js";
import pageRouter from "./routes/page.routes.js";
import pollRouter from "./routes/poll.routes.js";
import newsletterRouter from "./routes/newsletter.routes.js";

// Utils
import logger from "./utils/logger.js";
import { ApiResponse } from "./utils/ApiResponse.js";

const app = express();

// Security Headers (must be applied first)
app.use(helmet());

// CORS Configuration — supports comma-separated origins for multi-deployment
const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : [];

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
    },
    credentials: true,
}));

// Response compression (gzip/brotli) — reduces payload size by ~70%
app.use(compression());

// Body parsers
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// HTTP request logging (development only)
if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// Global rate limiter — applies to all routes
app.use(globalLimiter);

// Health Check Endpoint — used by load balancers and monitoring tools
app.get("/api/v1/health", (req, res) => {
    res.status(200).json(
        new ApiResponse(200, {
            status: "healthy",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
        }, "Server is running")
    );
});

// API Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Application Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/articles", articleRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/messages", messageRouter);
app.use("/api/v1/settings", settingRouter);
app.use("/api/v1/pages", pageRouter);
app.use("/api/v1/polls", pollRouter);
app.use("/api/v1/newsletters", newsletterRouter);

// Global Error Handler (must be last middleware)
app.use(errorHandler);

export default app;

// Export limiters for route-level use
export { authLimiter, viewLimiter };
