import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ROLES, PERMISSIONS } from "../constants/roles.constant.js";

// 1. Add Comment
const addComment = asyncHandler(async (req, res) => {
    const { articleId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content,
        article: articleId,
        owner: req.user._id
    });

    // Populate related fields for immediate UI update
    const populatedComment = await Comment.findById(comment._id).populate("owner", "fullName username avatar");

    return res.status(201).json(
        new ApiResponse(201, populatedComment, "Comment added successfully")
    );
});

// 2. Get Article Comments
const getArticleComments = asyncHandler(async (req, res) => {
    const { articleId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 }, // Newest first
        populate: { path: "owner", select: "fullName username avatar" }
    };

    // Calculate the number of documents to skip for standard pagination
    const skip = (options.page - 1) * options.limit;

    const comments = await Comment.find({ article: articleId })
        .populate("owner", "fullName username avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit);

    const totalComments = await Comment.countDocuments({ article: articleId });

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                total: totalComments,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(totalComments / options.limit)
            }
        }, "Comments fetched successfully")
    );
});

// 3. Delete Comment (RBAC Protected)
const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // Authorization Check:
    // 1. Is User the Owner?
    const isOwner = comment.owner.toString() === req.user._id.toString();

    // 2. Is User an Admin or Editor? (Moderators)
    const isModerator = [ROLES.ADMIN, ROLES.EDITOR].includes(req.user.role);

    if (!isOwner && !isModerator) {
        throw new ApiError(403, "You are not authorized to delete this comment");
    }

    await Comment.findByIdAndDelete(commentId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    );
});

// 4. Get All Comments (Admin)
const getAllCommentsAdmin = asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };
    const skip = (options.page - 1) * options.limit;

    const comments = await Comment.find({})
        .populate("owner", "fullName username avatar email")
        .populate("article", "title slug thumbnail")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(options.limit);

    const totalComments = await Comment.countDocuments({});

    return res.status(200).json(
        new ApiResponse(200, {
            comments,
            pagination: {
                total: totalComments,
                page: options.page,
                limit: options.limit,
                totalPages: Math.ceil(totalComments / options.limit)
            }
        }, "All comments fetched successfully")
    );
});

export {
    addComment,
    getArticleComments,
    deleteComment,
    getAllCommentsAdmin
};