import { Router } from "express";
import {
    createPage,
    getAllPages,
    getPageBySlug,
    getPageById,
    updatePage,
    deletePage
} from "../controllers/page.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
router.route("/").get(getAllPages); // Get all published pages (for footer links potentially)
router.route("/slug/:slug").get(getPageBySlug); // Get single page by slug to render

// ============================================================================
// ADMIN SECURED ROUTES
// ============================================================================
// All routes below require Admin privileges
router.use(verifyJWT);
router.use(verifyAdmin);

router.route("/")
    .post(createPage);

router.route("/admin-list").get(getAllPages); // Admin route to get ALL pages including drafts

router.route("/:id")
    .get(getPageById)
    .put(updatePage)
    .delete(deletePage);


export default router;
