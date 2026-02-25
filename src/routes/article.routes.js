import { Router } from "express";
import {
    createArticle,
    getAllArticles,
    getArticleBySlug,
    updateArticle,
    deleteArticle,
    incrementArticleView,
    getAllArticlesAdmin,
    bulkUploadArticles
} from "../controllers/article.controller.js";
import { verifyJWT, verifyAdmin, verifyStaff } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/").get(getAllArticles); // Public
// Admin Route - SECURED
router.route("/admin/all").get(verifyJWT, verifyStaff, getAllArticlesAdmin); // Staff Access
router.route("/admin/bulk-upload").post(verifyJWT, verifyStaff, bulkUploadArticles); // Bulk Upload
router.route("/:slug").get(getArticleBySlug);
router.route("/:slug/view").post(incrementArticleView);

router.route("/").post(
    verifyJWT,
    upload.single("thumbnail"),
    createArticle
);

router.route("/:articleId").patch(
    verifyJWT,
    upload.single("thumbnail"),
    updateArticle
);

router.route("/:articleId").delete(
    verifyJWT,
    deleteArticle
);

export default router;