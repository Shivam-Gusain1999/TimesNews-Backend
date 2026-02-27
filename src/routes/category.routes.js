import { Router } from "express";
import {
    createCategory,
    getAllCategories,
    deleteCategory,
    updateCategory
} from "../controllers/category.controller.js";
import { verifyJWT, verifyStaff } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { categorySchema } from "../validators/category.validator.js";

const router = Router();

// Public — Fetch all active categories
router.route("/").get(getAllCategories);

// Protected — Create, update, delete categories (Staff only + validated)
router.route("/").post(verifyJWT, verifyStaff, validate(categorySchema), createCategory);
router.route("/:categoryId").patch(verifyJWT, verifyStaff, validate(categorySchema), updateCategory);
router.route("/:categoryId").delete(verifyJWT, verifyStaff, deleteCategory);

export default router;