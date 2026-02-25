import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ROLES, ROLE_VALUES } from "../constants/roles.constant.js";
import { Article } from "../models/article.model.js";
import { Category } from "../models/category.model.js";

// 1. Get All Users (With Search & Role Filter)
const getAllUsers = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, role } = req.query;

    const query = {};

    if (search) {
        query.$or = [
            { fullName: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { username: { $regex: search, $options: "i" } }
        ];
    }

    if (role && ROLE_VALUES.includes(role)) {
        query.role = role;
    }

    // Pagination Options
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }, // New users first
        select: "-password -refreshToken" // Security
    };

    // Mongoose Paginate or a simple find query can be used here.
    // Using simple skip/limit to reduce external dependencies.
    const skip = (options.page - 1) * options.limit;

    const users = await User.find(query)
        .select("-password -refreshToken")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit);

    const totalUsers = await User.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            users,
            pagination: {
                total: totalUsers,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(totalUsers / options.limit)
            }
        }, "Users fetched successfully")
    );
});

// 2. Create User By Admin (Editor/Reporter)
const createUserByAdmin = asyncHandler(async (req, res) => {
    const { fullName, email, username, password, role } = req.body;

    // Validation
    if ([fullName, email, username, password, role].some((field) => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    // Role Validation
    if (!ROLE_VALUES.includes(role)) {
        throw new ApiError(400, "Invalid User Role");
    }

    // Admin cannot create another Admin directly (Optional restriction)
    if (role === ROLES.ADMIN) {
        // Uncomment below to restrict:
        // throw new ApiError(403, "Cannot create Admin account directly");
    }

    // Duplicate Check
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Avatar Handling (Fallback to generated text avatar)
    // Using UI Avatars to keep file uploads optional
    const avatarLocalPath = req.file?.path;
    let avatarUrl = `https://ui-avatars.com/api/?name=${fullName.replace(" ", "+")}&background=random`;

    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath, "avatars");
        if (avatar?.url) {
            avatarUrl = avatar.url;
        }
    }

    // Create User
    const user = await User.create({
        fullName,
        email,
        password,
        username: username.toLowerCase(),
        role,
        avatar: avatarUrl,
        isBlocked: false
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    return res.status(201).json(
        new ApiResponse(201, createdUser, `User created successfully as ${role}`)
    );
});

// 3. Block / Unblock User
const toggleBlockUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Admin cannot block other Admins (Safety)
    if (user.role === ROLES.ADMIN) {
        throw new ApiError(403, "Cannot block an Admin");
    }

    // Toggle Status
    user.isBlocked = !user.isBlocked;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, { isBlocked: user.isBlocked },
            user.isBlocked ? "User has been Blocked" : "User has been Unblocked"
        )
    );
});

// 4. Update User Role (Promote/Demote)
const updateUserRole = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;

    if (!role || !ROLE_VALUES.includes(role)) {
        throw new ApiError(400, "Invalid Role");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Prevent changing Admin role self or others easily
    if (user.role === ROLES.ADMIN && req.user._id.toString() !== user._id.toString()) {
        // Only Super Admin should do this really, but for now:
        // throw new ApiError(403, "Cannot change Admin role");
    }

    user.role = role;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, { role: user.role }, `User role updated to ${role}`)
    );
});

// ===================================
// 5. Dashboard Stats
// ===================================
const getDashboardStats = asyncHandler(async (req, res) => {
    // 1. Total Articles
    const totalArticles = await Article.countDocuments({ isArchived: false, status: "PUBLISHED" });

    // 2. Archived Articles
    const archivedArticles = await Article.countDocuments({ isArchived: true });

    // 3. Total Categories
    const totalCategories = await Category.countDocuments({ isArchived: false });

    // 4. Total Views (Aggregation)
    const viewsStats = await Article.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = viewsStats.length > 0 ? viewsStats[0].totalViews : 0;

    // 5. Latest 5 Articles
    const latestArticles = await Article.find({ isArchived: false, status: "PUBLISHED" })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("category", "name")
        .select("title views createdAt thumbnail");

    return res.status(200).json(
        new ApiResponse(200, {
            totalArticles,
            archivedArticles,
            totalCategories,
            totalViews,
            latestArticles
        }, "Dashboard stats fetched successfully")
    );
});

export {
    getAllUsers,
    createUserByAdmin,
    toggleBlockUser,
    updateUserRole,
    getDashboardStats
};