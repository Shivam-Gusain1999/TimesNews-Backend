import mongoose, { Schema } from "mongoose";

const pageSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Page title is required"],
            trim: true
        },
        slug: {
            type: String,
            required: [true, "Slug is required"],
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        content: {
            type: String,
            required: [true, "Page content is required"]
        },
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'published'
        },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

export const Page = mongoose.model("Page", pageSchema);
