import { Router } from "express";
import {
    createPoll,
    getAllPolls,
    updatePollStatus,
    deletePoll,
    getActivePolls,
    voteInPoll
} from "../controllers/poll.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middleware.js";

const router = Router();

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
router.route("/active").get(getActivePolls);
router.route("/:id/vote").post(voteInPoll);

// ============================================================================
// ADMIN SECURED ROUTES
// ============================================================================
// All routes below require Admin privileges
router.use(verifyJWT);
router.use(verifyAdmin);

router.route("/")
    .post(createPoll)
    .get(getAllPolls);

router.route("/:id")
    .patch(updatePollStatus)
    .delete(deletePoll);

export default router;
