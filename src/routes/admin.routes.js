import { Router } from "express";
import {
    getAllUsers,
    createUserByAdmin,
    toggleBlockUser,
    updateUserRole,
    getDashboardStats
} from "../controllers/admin.controller.js";
import { verifyJWT, verifyAdmin, verifyStaff } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Apply Security Middlewares Globally for Admin Routes
router.use(verifyJWT);
// PREVIOUSLY: router.use(verifyAdmin); -> Too Strict
// NOW: Use verifyStaff for general access, and verifyAdmin for specific sensitive routes.

// ===================================
// User Management Routes (STRICT ADMIN ONLY)
// ===================================

// GET /api/v1/admin/users -> List all users
// Note: Editors might need to see users list? 
// User said: "Editor... NO User Role Management". 
// Interpreting as: Can SEE users, but cannot Create/Block/Change Role.
// So GET users -> verifyStaff (or verifyAdmin + verifyEditor?)
// For safety, let's keep GET users restricted to Admin for now, 
// OR allow verifyStaff if they need to see authors etc.
// Given request "Editor... NO User Role Management", viewing might be okay but let's stick to safe side first.
// Actually, to filter articles by author, they might need user list. 
// Let's keep GET restricted for now, if dashboard breaks we open it.

// POST /api/v1/admin/users -> Create new user
router.route("/users")
    .get(verifyStaff, getAllUsers) // Allow Staff to see list (for author filters etc)
    .post(verifyAdmin, upload.single("avatar"), createUserByAdmin); // Only Admin creates

// POST /api/v1/admin/users/:userId/block -> Block/Unblock
router.route("/users/:userId/block").post(verifyAdmin, toggleBlockUser); // Only Admin blocks

// PATCH /api/v1/admin/users/:userId/role -> Change Role
router.route("/users/:userId/role").patch(verifyAdmin, updateUserRole); // Only Admin promotes

// ===================================
// Dashboard Stats (Accessible to All Staff)
// ===================================
// GET /api/v1/admin/stats -> Dashboard Stats
router.route("/stats").get(verifyStaff, getDashboardStats);


export default router;
