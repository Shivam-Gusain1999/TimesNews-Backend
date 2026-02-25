// ------------------ External Packages ------------------
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swagger.js";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import helmet from "helmet";

// ------------------ Middlewares ------------------
import { errorHandler } from "./middlewares/error.middleware.js";

// ------------------ Routes ------------------// Routes imports
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

const app = express();

// ------------------ Global Middlewares ------------------
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

// Use helmet for security headers
app.use(helmet());

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// ------------------ Routes ------------------
// Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Application route endpoints 

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



// ------------------ Error Handler ------------------
app.use(errorHandler);

export default app;
