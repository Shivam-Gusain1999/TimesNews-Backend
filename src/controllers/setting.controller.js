import { Setting } from "../models/setting.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// ============================================================================
// 1. GET ALL SETTINGS (Public & Admin)
// ============================================================================
const getSettings = asyncHandler(async (req, res) => {
    // Optionally filter by type (e.g. ?type=theme)
    const { type } = req.query;
    const query = type ? { type } : {};

    const settings = await Setting.find(query).select("-_id key value type");

    // Format into a Key-Value pair for easy frontend consumption
    const formattedSettings = settings.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
    }, {});

    return res.status(200).json(
        new ApiResponse(200, formattedSettings, "Settings fetched successfully")
    );
});

// ============================================================================
// 2. UPDATE OR CREATE SETTINGS (Admin Only)
// ============================================================================
// Expects an array of setting objects to update multiple at once
// e.g. [{ key: 'siteTitle', value: 'New Name', type: 'general' }, ...]
const updateSettings = asyncHandler(async (req, res) => {
    const { settings } = req.body;

    if (!Array.isArray(settings) || settings.length === 0) {
        throw new ApiError(400, "Please provide an array of settings to update");
    }

    const updatedSettings = [];

    for (const item of settings) {
        const { key, value, type } = item;

        if (!key || value === undefined) {
            continue; // Skip invalid entries
        }

        // Upsert: Create if it doesn't exist, Update if it does
        const updated = await Setting.findOneAndUpdate(
            { key },
            {
                value,
                ...(type && { type }) // Update type only if provided
            },
            { new: true, upsert: true }
        );

        updatedSettings.push(updated);
    }

    return res.status(200).json(
        new ApiResponse(200, updatedSettings, "Settings updated successfully")
    );
});

export {
    getSettings,
    updateSettings
};
