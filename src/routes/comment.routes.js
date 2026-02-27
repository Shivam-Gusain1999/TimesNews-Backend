import { Router } from "express";
import {
    addComment,
    getArticleComments,
    deleteComment,
    getAllCommentsAdmin
} from "../controllers/comment.controller.js";
import { verifyJWT, verifyStaff } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { addCommentSchema } from "../validators/comment.validator.js";

const router = Router();

// Public — Read comments for an article
router.route("/:articleId").get(getArticleComments);

// Staff — View all comments across articles
router.route("/admin/all").get(verifyJWT, verifyStaff, getAllCommentsAdmin);

// Protected — Add a comment (requires login + validation)
router.route("/:articleId").post(verifyJWT, validate(addCommentSchema), addComment);

// Protected — Delete a comment (owner or moderator)
router.route("/:commentId").delete(verifyJWT, deleteComment);

export default router;