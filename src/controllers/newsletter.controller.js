import { Newsletter } from "../models/newsletter.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ============================================================================
// PUBLIC ROUTES
// ============================================================================
export const subscribe = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    // Check if exists
    const existingSubscriber = await Newsletter.findOne({ email });

    if (existingSubscriber) {
        if (existingSubscriber.status === 'unsubscribed') {
            // Resubscribe them
            existingSubscriber.status = 'subscribed';
            await existingSubscriber.save();
            return res.status(200).json(new ApiResponse(200, null, "Successfully resubscribed to the newsletter!"));
        }
        // Already active
        return res.status(409).json(new ApiResponse(409, null, "You are already subscribed to the newsletter."));
    }

    // Create new
    await Newsletter.create({ email });

    return res.status(201).json(new ApiResponse(201, null, "Successfully subscribed to the newsletter!"));
});

export const unsubscribe = asyncHandler(async (req, res) => {
    const { email } = req.body; // or req.params depending on how the frontend builds the link

    if (!email) {
        throw new ApiError(400, "Email is required");
    }

    const subscriber = await Newsletter.findOneAndUpdate(
        { email },
        { status: 'unsubscribed' },
        { new: true }
    );

    if (!subscriber) {
        throw new ApiError(404, "Email not found in our database");
    }

    return res.status(200).json(new ApiResponse(200, null, "Successfully unsubscribed."));
});

// ============================================================================
// ADMIN ROUTES
// ============================================================================
export const getAllSubscribers = asyncHandler(async (req, res) => {
    const subscribers = await Newsletter.find()
        .sort({ subscribedAt: -1 });

    return res.status(200).json(new ApiResponse(200, subscribers, "Subscribers retrieved successfully"));
});

export const removeSubscriber = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const subscriber = await Newsletter.findByIdAndDelete(id);

    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Subscriber permanently removed"));
});
