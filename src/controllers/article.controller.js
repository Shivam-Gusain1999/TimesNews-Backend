import { Article } from "../models/article.model.js";
import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ROLES, PERMISSIONS } from "../constants/roles.constant.js";

// Escape special regex characters from user input to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ============================================================================
// 1. CREATE ARTICLE (Secure & Optimized)
// ============================================================================
const createArticle = asyncHandler(async (req, res) => {
    const { title, content, categoryId, tags, isFeatured } = req.body;

    // Validation: Required fields check
    if ([title, content, categoryId].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "Title, Content and Category are required");
    }

    // Ensure the mapped category is active, not archived
    const category = await Category.findOne({ _id: categoryId, isArchived: false });
    if (!category) {
        throw new ApiError(404, "Invalid or Archived Category");
    }

    // Slug Generation (SEO Friendly & Unique)
    // Strip special characters, spaces, and append a timestamp
    const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        + "-" + Date.now();

    // Image Upload Handling
    const thumbnailLocalPath = req.file?.path;
    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail image is required");
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail) {
        throw new ApiError(500, "Error while uploading thumbnail to Cloudinary");
    }

    // Role Based Status (RBAC)
    // Admin/Editor publish directly, Users remain explicitly in DRAFT
    let status = "DRAFT";
    if (req.user && PERMISSIONS.CAN_PUBLISH.includes(req.user.role)) {
        status = "PUBLISHED";
    }

    // Database Entry
    const article = await Article.create({
        title,
        content,
        slug,
        thumbnail: thumbnail.url,
        category: categoryId,
        author: req.user._id,
        tags: tags ? tags.split(",") : [],
        isFeatured: isFeatured || false,
        status,
        isArchived: false // Default active
    });

    return res.status(201).json(
        new ApiResponse(201, article, "Article created successfully")
    );
});

// ============================================================================
// 2. GET ALL ARTICLES (With Search, Filter & Pagination)
// ============================================================================
const getAllArticles = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, category } = req.query;

    // Base Query: Only fetch published and active articles
    const query = {
        status: "PUBLISHED",
        isArchived: false
    };

    // 1. Search Logic (Title match)
    if (search) {
        query.title = { $regex: escapeRegex(search), $options: "i" };
    }

    // 2. Category Filter (search by slug first, then fall back to case-insensitive name)
    if (category) {
        let categoryDoc = await Category.findOne({ slug: category, isArchived: false });
        if (!categoryDoc) {
            const nameFromSlug = category.replace(/-/g, ' ');
            categoryDoc = await Category.findOne({ name: { $regex: new RegExp(`^${nameFromSlug}$`, 'i') }, isArchived: false });
        }
        if (categoryDoc) {
            query.category = categoryDoc._id;
        }
    }

    // 3. Pagination Logic
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: [
            { path: "author", select: "fullName username avatar" },
            { path: "category", select: "name slug" }
        ]
    };



    const skip = (options.page - 1) * options.limit;

    const articles = await Article.find(query)
        .populate("author", "fullName username avatar")
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit);

    const totalArticles = await Article.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            articles,
            pagination: {
                total: totalArticles,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(totalArticles / options.limit)
            }
        }, "Articles fetched successfully")
    );
});

// ============================================================================
// 3. GET SINGLE ARTICLE (By Slug)
// ============================================================================
const getArticleBySlug = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    // View Count Logic is now controlled via frontend
    const article = await Article.findOne(
        { slug, status: "PUBLISHED", isArchived: false }
    )
        .populate("author", "fullName username bio avatar")
        .populate("category", "name slug");

    if (!article) {
        throw new ApiError(404, "Article not found or has been archived");
    }

    return res.status(200).json(
        new ApiResponse(200, article, "Article fetched successfully")
    );
});

// ============================================================================
// 4. UPDATE ARTICLE (Secure Update)
// ============================================================================
const updateArticle = asyncHandler(async (req, res) => {
    const { articleId } = req.params;
    const { title, content, categoryId, status } = req.body;

    const article = await Article.findById(articleId);

    if (!article) {
        throw new ApiError(404, "Article not found");
    }

    // Note: Previously we blocked editing archived articles. 
    // Now we allow it so Admins can restore them.

    const isOwner = article.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isEditor = req.user.role === ROLES.EDITOR;
    const isReporter = req.user.role === ROLES.REPORTER;

    // Security Rules:
    // 1. Admin & Editor: Can edit ANY article.
    // 2. Reporter: Can edit ONLY their OWN article.

    if (!isAdmin && !isEditor) {
        // Must be owner
        if (!isOwner) {
            throw new ApiError(403, "You can only edit your own articles");
        }
    }

    // Image Handling: Upload replacement thumbnail if provided via Multer
    // The previous asset remains in Cloudinary as a safety backup
    if (req.file?.path) {
        const newThumbnail = await uploadOnCloudinary(req.file.path);
        if (newThumbnail) {
            article.thumbnail = newThumbnail.url;
        }
    }

    // Fields Update
    if (title) article.title = title;
    if (content) article.content = content;
    if (categoryId) article.category = categoryId;

    // Status Update (Restricted based on roles)
    if (status && PERMISSIONS.CAN_PUBLISH.includes(req.user.role)) {
        article.status = status;
        // If status is changed from ARCHIVED, make sure isArchived is false
        if (status !== 'ARCHIVED') {
            article.isArchived = false;
        }
    }

    await article.save();

    return res.status(200).json(
        new ApiResponse(200, article, "Article updated successfully")
    );
});

// ============================================================================
// 5. DELETE ARTICLE (Soft Delete / Archive)
// ============================================================================
const deleteArticle = asyncHandler(async (req, res) => {
    const { articleId } = req.params;

    const article = await Article.findById(articleId);

    if (!article || article.isArchived) {
        throw new ApiError(404, "Article not found");
    }

    // Security Check
    // Admin: Can delete anything
    // Editor: Can delete anything (as per "Editor... delete content")
    // Reporter: CANNOT DELETE (even own). "Reporter... No Delete"

    const isOwner = article.author.toString() === req.user._id.toString();
    const isAdmin = req.user.role === ROLES.ADMIN;
    const isEditor = req.user.role === ROLES.EDITOR;

    // Logic: 
    // 1. Admin & Editor can delete ANY article.
    // 2. Reporter cannot delete anything.
    if (!isAdmin && !isEditor) {
        throw new ApiError(403, "Access Denied! You are not authorized to delete articles.");
    }

    // SOFT DELETE LOGIC
    // Archive the article rather than a hard database deletion
    article.isArchived = true;
    article.status = "ARCHIVED";

    // Disable full validation on save since we are only manipulating the status
    await article.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, {}, "Article moved to archive (Soft Deleted)")
    );
});



// ============================================================================
// 6. INCREMENT VIEW (Separate Endpoint)
// ============================================================================
const incrementArticleView = asyncHandler(async (req, res) => {
    const { slug } = req.params;

    await Article.findOneAndUpdate(
        { slug, status: "PUBLISHED", isArchived: false },
        { $inc: { views: 1 } }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "View count incremented")
    );
});

// ============================================================================
// 7. GET ALL ARTICLES (ADMIN) - No Status Restrictions
// ============================================================================
const getAllArticlesAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search, status, category } = req.query;

    const query = {};

    // 1. Search Logic
    if (search) {
        query.title = { $regex: escapeRegex(search), $options: "i" };
    }

    // 2. Status Filter
    if (status) {
        query.status = status;
        if (status === 'ARCHIVED') {
            query.isArchived = true;
        }
    }

    // 3. Category Filter
    if (category) {
        query.category = category;
    }

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 },
        populate: [
            { path: "author", select: "fullName username avatar" },
            { path: "category", select: "name" }
        ]
    };

    const skip = (options.page - 1) * options.limit;

    const articles = await Article.find(query)
        .populate("author", "fullName username avatar")
        .populate("category", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit);

    const totalArticles = await Article.countDocuments(query);

    return res.status(200).json(
        new ApiResponse(200, {
            articles,
            pagination: {
                total: totalArticles,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(totalArticles / options.limit)
            }
        }, "Admin articles fetched successfully")
    );
});

// ============================================================================
// 8. BULK UPLOAD ARTICLES
// ============================================================================
const bulkUploadArticles = asyncHandler(async (req, res) => {
    const { articles } = req.body;

    if (!articles || !Array.isArray(articles) || articles.length === 0) {
        throw new ApiError(400, "Invalid or empty articles array provided");
    }

    const results = {
        successful: 0,
        failed: 0,
        errors: []
    };

    const isAdmin = req.user.role === ROLES.ADMIN;
    const isEditor = req.user.role === ROLES.EDITOR;

    if (!isAdmin && !isEditor) {
        throw new ApiError(403, "You do not have permission to bulk upload articles");
    }

    for (const item of articles) {
        try {
            const { title, content, category, tags, status, isFeatured, thumbnail } = item;

            if (!title || !category) {
                throw new Error("Missing required fields: Title and Category are mandatory.");
            }

            // Clean input
            const safeTitle = title.trim();
            const safeCategory = category.trim();

            // Find category by name (case-insensitive) or slug
            let categoryDoc = await Category.findOne({
                $or: [
                    { name: { $regex: new RegExp(`^${safeCategory}$`, 'i') } },
                    { slug: safeCategory.toLowerCase().replace(/[^a-z0-9]+/g, "-") }
                ],
                isArchived: false
            });

            if (!categoryDoc) {
                throw new Error(`Category '${safeCategory}' not found in database.`);
            }

            const slug = safeTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-+|-+$/g, "")
                + "-" + Date.now() + Math.floor(Math.random() * 1000);

            // Use a rigorous fallback for images or content if they are missing in the CSV
            const defaultThumbnail = "https://res.cloudinary.com/dpv0ukspz/image/upload/v1727783301/placeholder-image_qzxw1m.png";

            await Article.create({
                title: safeTitle,
                content: content || `<p>Coming soon...</p>`,
                slug,
                thumbnail: thumbnail || defaultThumbnail,
                category: categoryDoc._id,
                author: req.user._id,
                tags: tags ? tags.split(",").map(t => t.trim()) : [],
                isFeatured: String(isFeatured).toLowerCase() === "true" || isFeatured === "1",
                status: status && PERMISSIONS.CAN_PUBLISH.includes(req.user.role) ? status : "DRAFT",
                isArchived: false
            });

            results.successful++;
        } catch (error) {
            results.failed++;
            results.errors.push({ title: item.title, error: error.message });
        }
    }

    return res.status(200).json(
        new ApiResponse(200, results, `Bulk upload complete. ${results.successful} created, ${results.failed} failed.`)
    );
});

export {
    createArticle,
    getAllArticles,
    getArticleBySlug,
    updateArticle,
    deleteArticle,
    incrementArticleView,
    getAllArticlesAdmin,
    bulkUploadArticles
};