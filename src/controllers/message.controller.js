import { Message } from "../models/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// @desc    Submit a new contact message
// @route   POST /api/v1/messages
// @access  Public
const sendMessage = asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !message) {
        throw new ApiError(400, "Name, email, and message are required.");
    }

    const newMessage = await Message.create({
        name,
        email,
        subject,
        message,
    });

    if (!newMessage) {
        throw new ApiError(500, "Something went wrong while submitting the message.");
    }

    return res
        .status(201)
        .json(new ApiResponse(201, newMessage, "Message submitted successfully."));
});

// @desc    Get all contact messages (with pagination)
// @route   GET /api/v1/messages
// @access  Private/Staff (Admin/Editor)
const getAllMessages = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startIndex = (page - 1) * limit;

    const query = {};
    if (req.query.isRead !== undefined) {
        query.isRead = req.query.isRead === "true";
    }

    const total = await Message.countDocuments(query);
    const messages = await Message.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(startIndex)
        .limit(limit);

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                messages,
                total,
                page,
                pages: Math.ceil(total / limit),
            },
            "Messages fetched successfully."
        )
    );
});

// @desc    Get a single message by ID
// @route   GET /api/v1/messages/:id
// @access  Private/Staff
const getMessageById = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        throw new ApiError(404, "Message not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, message, "Message fetched successfully."));
});

// @desc    Mark a message as read/unread
// @route   PATCH /api/v1/messages/:id/read
// @access  Private/Staff
const toggleMessageReadStatus = asyncHandler(async (req, res) => {
    const message = await Message.findById(req.params.id);

    if (!message) {
        throw new ApiError(404, "Message not found.");
    }

    message.isRead = !message.isRead;
    await message.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, message, `Message marked as ${message.isRead ? 'read' : 'unread'}.`));
});

// @desc    Delete a message
// @route   DELETE /api/v1/messages/:id
// @access  Private/Staff
const deleteMessage = asyncHandler(async (req, res) => {
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
        throw new ApiError(404, "Message not found.");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Message deleted successfully."));
});

export {
    sendMessage,
    getAllMessages,
    getMessageById,
    toggleMessageReadStatus,
    deleteMessage
};
