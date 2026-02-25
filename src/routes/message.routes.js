import { Router } from "express";
import {
    sendMessage,
    getAllMessages,
    getMessageById,
    toggleMessageReadStatus,
    deleteMessage
} from "../controllers/message.controller.js";
import { verifyJWT, verifyStaff } from "../middlewares/auth.middleware.js";

const router = Router();

// Public route to submit a form
router.route("/").post(sendMessage);

// Protected routes for Staff/Admin
router.use(verifyJWT);
router.use(verifyStaff);

router.route("/").get(getAllMessages);
router.route("/:id").get(getMessageById).delete(deleteMessage);
router.route("/:id/read").patch(toggleMessageReadStatus);

export default router;
