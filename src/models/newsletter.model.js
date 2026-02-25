import mongoose, { Schema } from "mongoose";

const newsletterSchema = new Schema(
    {
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
        },
        status: {
            type: String,
            enum: ['subscribed', 'unsubscribed'],
            default: 'subscribed',
            index: true
        },
        subscribedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

export const Newsletter = mongoose.model("Newsletter", newsletterSchema);
