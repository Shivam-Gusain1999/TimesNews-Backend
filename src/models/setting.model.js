import mongoose, { Schema } from "mongoose";

const settingSchema = new Schema(
    {
        key: {
            type: String,
            required: [true, "Setting key is required"],
            unique: true,
            index: true, // For fast lookup
            trim: true
        },
        type: {
            type: String,
            enum: ['general', 'theme', 'navigation', 'seo', 'social', 'ads'],
            required: [true, "Setting category type is required"]
        },
        value: {
            type: Schema.Types.Mixed, // Can store Strings, Numbers, Booleans, Arrays, or Objects
            required: true
        },
        description: {
            type: String,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

export const Setting = mongoose.model("Setting", settingSchema);
