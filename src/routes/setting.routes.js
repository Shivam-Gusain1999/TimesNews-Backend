import { Router } from "express";
import {
    getSettings,
    updateSettings
} from "../controllers/setting.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// Public route to fetch settings (e.g. Navigation, Theme colors for the frontend)
router.route("/").get(getSettings);

// Admin only route to update settings
router.route("/").put(verifyJWT, verifyAdmin, updateSettings);

export default router;
