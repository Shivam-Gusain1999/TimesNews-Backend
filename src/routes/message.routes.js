import { Router } from "express";
import {
    sendMessage,
    getAllMessages,
    getMessageById,
    toggleMessageReadStatus,
    deleteMessage
} from "../controllers/message.controller.js";
import { verifyJWT, verifyStaff } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { sendMessageSchema } from "../validators/message.validator.js";

const router = Router();

// Public — Submit a contact message (validated)
router.route("/").post(validate(sendMessageSchema), sendMessage);

// Protected — Staff/Admin only (applied to all routes below)
router.use(verifyJWT);
router.use(verifyStaff);

router.route("/").get(getAllMessages);
router.route("/:id").get(getMessageById).delete(deleteMessage);
router.route("/:id/read").patch(toggleMessageReadStatus);

export default router;
