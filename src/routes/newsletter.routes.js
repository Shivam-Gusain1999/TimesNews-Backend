import { Router } from "express";
import {
    subscribe,
    unsubscribe,
    getAllSubscribers,
    removeSubscriber
} from "../controllers/newsletter.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
router.route("/subscribe").post(subscribe);
router.route("/unsubscribe").post(unsubscribe);

// ============================================================================
// ADMIN SECURED ROUTES
// ============================================================================
// All routes below require Admin privileges
router.use(verifyJWT);
router.use(verifyAdmin);

router.route("/").get(getAllSubscribers);
router.route("/:id").delete(removeSubscriber);

export default router;
