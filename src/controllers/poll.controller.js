import { Poll } from "../models/poll.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ============================================================================
// ADMIN ROUTES
// ============================================================================

export const createPoll = asyncHandler(async (req, res) => {
    const { question, options, status } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
        throw new ApiError(400, "Question and at least two options are required");
    }

    // Format options for the schema
    const formattedOptions = options.map(opt => ({
        text: typeof opt === 'string' ? opt : opt.text,
        votes: 0
    }));

    const poll = await Poll.create({
        question,
        options: formattedOptions,
        status: status || 'active',
        createdBy: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, poll, "Poll created successfully"));
});

export const getAllPolls = asyncHandler(async (req, res) => {
    const polls = await Poll.find()
        .populate("createdBy", "fullName")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, polls, "All polls retrieved"));
});

export const updatePollStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'closed'].includes(status)) {
        throw new ApiError(400, "Invalid status");
    }

    const poll = await Poll.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
    );

    if (!poll) {
        throw new ApiError(404, "Poll not found");
    }

    return res.status(200).json(new ApiResponse(200, poll, "Poll status updated"));
});

export const deletePoll = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const poll = await Poll.findByIdAndDelete(id);

    if (!poll) {
        throw new ApiError(404, "Poll not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Poll deleted successfully"));
});

// ============================================================================
// PUBLIC ROUTES
// ============================================================================

export const getActivePolls = asyncHandler(async (req, res) => {
    // Usually, we just want the latest active poll for the widget
    const limit = parseInt(req.query.limit) || 1;

    const polls = await Poll.find({ status: 'active' })
        .sort({ createdAt: -1 })
        .limit(limit);

    return res.status(200).json(new ApiResponse(200, polls, "Active polls retrieved"));
});

export const voteInPoll = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { optionId } = req.body;

    // In a real production app without tight auth, fingerprinting is needed.
    // We will use IP address as a basic prevention mechanism for demonstration.
    const userIdentifier = req.ip || req.headers['x-forwarded-for'] || "anonymous";

    const poll = await Poll.findById(id);

    if (!poll) {
        throw new ApiError(404, "Poll not found");
    }

    if (poll.status !== 'active') {
        throw new ApiError(400, "This poll is closed");
    }

    // Check if user already voted
    if (poll.votedUsers.includes(userIdentifier)) {
        throw new ApiError(403, "You have already voted in this poll");
    }

    // Find the option
    const optionIndex = poll.options.findIndex(opt => opt._id.toString() === optionId);

    if (optionIndex === -1) {
        throw new ApiError(400, "Invalid voting option");
    }

    // Register vote
    poll.options[optionIndex].votes += 1;
    poll.votedUsers.push(userIdentifier);

    await poll.save();

    // Calculate percentages for the response
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    const results = poll.options.map(opt => ({
        _id: opt._id,
        text: opt.text,
        votes: opt.votes,
        percentage: totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0
    }));

    return res.status(200).json(
        new ApiResponse(200, { pollId: poll._id, results, totalVotes }, "Vote cast successfully")
    );
});
