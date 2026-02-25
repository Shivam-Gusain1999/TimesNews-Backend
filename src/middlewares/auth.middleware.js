import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { PERMISSIONS, ROLES } from "../constants/roles.constant.js";


//  Verify JWT (Login Check)

const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});

//  Verify Admin (Sirf 'admin' allow karega) 

const verifyAdmin = asyncHandler(async (req, res, next) => {
    // req.user verifyJWT se aa raha hai
    console.log("verifyAdmin checking user:", req.user._id, "role:", req.user.role);
    if (req.user.role !== ROLES.ADMIN) {
        console.log("verifyAdmin failed: User is", req.user.role);
        throw new ApiError(403, "Access Denied! Admin rights required.");
    }
    console.log("verifyAdmin passed");
    next();
});

//  Verify Publisher (Admin + Editor allow karega)

const verifyPublisher = asyncHandler(async (req, res, next) => {
    // Check karega: Kya user ka role 'CAN_PUBLISH' list mein hai?
    if (!PERMISSIONS.CAN_PUBLISH.includes(req.user.role)) {
        throw new ApiError(403, "Access Denied! You cannot publish articles.");
    }
    next();
});

//  Verify Staff (Admin + Editor + Reporter allow karega - Dashboard Access)
const verifyStaff = asyncHandler(async (req, res, next) => {
    // Allowed Roles: Admin, Editor, Reporter
    const allowedRoles = [ROLES.ADMIN, ROLES.EDITOR, ROLES.REPORTER];

    if (!allowedRoles.includes(req.user.role)) {
        throw new ApiError(403, "Access Denied! Staff rights required.");
    }
    next();
});

export { verifyJWT, verifyAdmin, verifyPublisher, verifyStaff };