import mongoose, { Schema } from "mongoose";

const categorySchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            index: true
        },
        slug: {
            type: String,
            lowercase: true,
            index: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },
        isArchived: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true
    }
);

export const Category = mongoose.model("Category", categorySchema);