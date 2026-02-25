import { Category } from "../models/category.model.js";
import { ROLES } from "../constants/roles.constant.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


// Helper to check permission
const isModerator = (req) => [ROLES.ADMIN, ROLES.EDITOR].includes(req.user.role);

const createCategory = asyncHandler(async (req, res) => {
    // Security Check: Only Admin & Editors are permitted
    if (!isModerator(req)) {
        throw new ApiError(403, "Access Denied! You are not authorized to create categories.");
    }

    const { name } = req.body;
    // ... [Rest of code same] ...

    if (!name?.trim()) {
        throw new ApiError(400, "Category name is required");
    }

    const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-");

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
        throw new ApiError(409, "Category with this name already exists");
    }

    const category = await Category.create({
        name,
        slug,
        owner: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(201, category, "Category created successfully")
    );
});


const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await Category.find({ isArchived: false });
    return res.status(200).json(
        new ApiResponse(200, categories, "All active categories fetched successfully")
    );
});

// === Update Category (Admin/Editor) ===
const updateCategory = asyncHandler(async (req, res) => {
    // Security Check: Only Admin & Editors are permitted
    if (!isModerator(req)) {
        throw new ApiError(403, "Access Denied! You are not authorized to update categories.");
    }
    const { categoryId } = req.params;
    const { name } = req.body;

    if (!name?.trim()) {
        throw new ApiError(400, "New category name is required");
    }

    const category = await Category.findById(categoryId);

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    const slug = name.toLowerCase().replace(/ /g, "-");

    category.name = name;
    category.slug = slug;

    await category.save();

    return res.status(200).json(
        new ApiResponse(200, category, "Category updated successfully")
    );
});

const deleteCategory = asyncHandler(async (req, res) => {
    // Security Check: Only Admin & Editors are permitted
    if (!isModerator(req)) {
        throw new ApiError(403, "Access Denied! You are not authorized to delete categories.");
    }
    const { categoryId } = req.params;

    const category = await Category.findByIdAndUpdate(
        categoryId,
        { isArchived: true },
        { new: true }
    );

    if (!category) {
        throw new ApiError(404, "Category not found");
    }

    return res.status(200).json(
        new ApiResponse(200, category, "Category archived successfully")
    );
});


export {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
};