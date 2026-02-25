import { Router } from "express";
import {
    createCategory,
    getAllCategories,
    deleteCategory,
    updateCategory
} from "../controllers/category.controller.js";
import { verifyJWT, verifyStaff } from "../middlewares/auth.middleware.js";

const router = Router();


router.route("/").get(getAllCategories);


router.route("/").post(verifyJWT, verifyStaff, createCategory);


router.route("/:categoryId").patch(verifyJWT, verifyStaff, updateCategory);


router.route("/:categoryId").delete(verifyJWT, verifyStaff, deleteCategory);

export default router;