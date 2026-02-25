import mongoose, { Schema } from "mongoose";

const pollOptionSchema = new Schema({
    text: {
        type: String,
        required: [true, "Option text is required"],
        trim: true
    },
    votes: {
        type: Number,
        default: 0
    }
});

const pollSchema = new Schema(
    {
        question: {
            type: String,
            required: [true, "Poll question is required"],
            trim: true
        },
        options: {
            type: [pollOptionSchema],
            validate: [v => v.length >= 2, 'A poll must have at least two options']
        },
        status: {
            type: String,
            enum: ['active', 'closed'],
            default: 'active',
            index: true // Indexed for faster querying of active polls on the frontend
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        // To prevent duplicate voting, we store identifiers. 
        // In a real production system with guest voting, we might store IP hashes or browser fingerprints.
        votedUsers: [{
            type: String
        }]
    },
    {
        timestamps: true
    }
);

export const Poll = mongoose.model("Poll", pollSchema);
