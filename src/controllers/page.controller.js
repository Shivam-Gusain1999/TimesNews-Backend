import { Page } from "../models/page.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import slugify from "slugify";

// ============================================================================
// 1. CREATE PAGE (Admin Only)
// ============================================================================
const createPage = asyncHandler(async (req, res) => {
    const { title, content, status } = req.body;

    if (!title || !content) {
        throw new ApiError(400, "Title and content are required");
    }

    // Generate SEO friendly slug
    let baseSlug = slugify(title, { lower: true, strict: true });
    let slug = baseSlug;

    // Ensure slug uniqueness
    let isSlugUnique = false;
    let counter = 1;
    while (!isSlugUnique) {
        const existingPage = await Page.findOne({ slug });
        if (existingPage) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        } else {
            isSlugUnique = true;
        }
    }

    const newPage = await Page.create({
        title,
        slug,
        content,
        status: status || 'published',
        author: req.user._id
    });

    return res.status(201).json(
        new ApiResponse(201, newPage, "Page created successfully")
    );
});

// ============================================================================
// 2. GET ALL PAGES (Admin: All, Public: Published only)
// ============================================================================
const getAllPages = asyncHandler(async (req, res) => {
    const isAdminRequest = req.baseUrl.includes('/admin') || (req.user && ['admin', 'editor'].includes(req.user.role));

    // If Admin, show everything. If public, show only published pages.
    const query = isAdminRequest ? {} : { status: 'published' };

    const pages = await Page.find(query)
        .populate("author", "fullName username")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, pages, "Pages fetched successfully")
    );
});

// ============================================================================
// 3. GET PAGE BY SLUG (Public Route)
// ============================================================================
const getPageBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    const page = await Page.findOne({ slug, status: 'published' })
        .populate("author", "fullName");

    if (!page) {
        throw new ApiError(404, "Page not found");
    }

    return res.status(200).json(
        new ApiResponse(200, page, "Page fetched successfully")
    );
});

// ============================================================================
// 4. GET PAGE BY ID (Admin Edit Route)
// ============================================================================
const getPageById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const page = await Page.findById(id);

    if (!page) {
        throw new ApiError(404, "Page not found");
    }

    return res.status(200).json(
        new ApiResponse(200, page, "Page fetched successfully")
    );
});

// ============================================================================
// 5. UPDATE PAGE (Admin Only)
// ============================================================================
const updatePage = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, content, status, slug } = req.body;

    const page = await Page.findById(id);

    if (!page) {
        throw new ApiError(404, "Page not found");
    }

    // If title or slug is being updated, verify uniqueness of new slug
    let updatedSlug = page.slug;
    if (slug && slug !== page.slug) {
        const existingSlug = await Page.findOne({ slug, _id: { $ne: id } });
        if (existingSlug) {
            throw new ApiError(400, "This custom slug is already in use");
        }
        updatedSlug = slugify(slug, { lower: true, strict: true });
    } else if (title && title !== page.title && !slug) {
        updatedSlug = slugify(title, { lower: true, strict: true });
    }

    page.title = title || page.title;
    page.slug = updatedSlug;
    page.content = content || page.content;
    page.status = status || page.status;

    await page.save();

    return res.status(200).json(
        new ApiResponse(200, page, "Page updated successfully")
    );
});

// ============================================================================
// 6. DELETE PAGE (Admin Only)
// ============================================================================
const deletePage = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const page = await Page.findByIdAndDelete(id);

    if (!page) {
        throw new ApiError(404, "Page not found to delete");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Page deleted successfully")
    );
});

export {
    createPage,
    getAllPages,
    getPageBySlug,
    getPageById,
    updatePage,
    deletePage
};
