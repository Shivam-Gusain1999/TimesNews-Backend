import { Router } from "express";
import {
    addComment,
    getArticleComments,
    deleteComment,
    getAllCommentsAdmin
} from "../controllers/comment.controller.js";
import { verifyJWT, verifyStaff } from "../middlewares/auth.middleware.js";

const router = Router();

// Public Route (Read Comments)
router.route("/:articleId").get(getArticleComments);

// Admin/Staff Route
router.route("/admin/all").get(verifyJWT, verifyStaff, getAllCommentsAdmin);

// Protected Routes (Write/Delete)
// Note: router.use(verifyJWT) applies to all below, but we need mixed public/private
// So we apply middleware specifically to protected routes

router.route("/:articleId").post(verifyJWT, addComment);

router.route("/:commentId").delete(verifyJWT, deleteComment);

export default router;