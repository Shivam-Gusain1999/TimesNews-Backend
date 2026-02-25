import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Load configuration from environment variables
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


// 1. UPLOAD FUNCTION (Local File -> Cloudinary)

const uploadOnCloudinary = async (localFilePath, folderName = "others") => {
    try {
        if (!localFilePath) return null;

        // Upload on Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
            folder: `times-news/${folderName}` // Folder organization
        });

        // File uploaded successfully -> Delete local file
        fs.unlink(localFilePath, (err) => {
            if (err) console.error("Error deleting local file after upload:", err.message);
        });

        return response;

    } catch (error) {
        // Upload Fail -> Delete local file (Clean up)
        fs.unlink(localFilePath, (err) => {
            if (err) console.error("Error deleting local file after failed upload:", err.message);
        });
        return null;
    }
}


// 2. DELETE FUNCTION (Remove asset from Cloudinary)

const deleteFromCloudinary = async (fileUrlOrPublicId) => {
    try {
        if (!fileUrlOrPublicId) return null;

        // Step A: Extract Public ID if a full URL is provided
        let publicId = fileUrlOrPublicId;

        if (fileUrlOrPublicId.includes("http")) {
            publicId = extractPublicIdFromUrl(fileUrlOrPublicId);
        }

        if (!publicId) {
            console.log("Could not extract publicId");
            return null;
        }

        // Step B: Delete from Cloudinary
        const result = await cloudinary.uploader.destroy(publicId);
        return result;

    } catch (error) {
        console.log("Error deleting from Cloudinary:", error);
        return null;
    }
}

// 3. HELPER: Logic to extract Public ID from a full secure URL

const extractPublicIdFromUrl = (url) => {
    try {

        // 1. Split the URL by '/'
        const parts = url.split('/');

        // 2. Locate the 'upload' keyword
        const uploadIndex = parts.findIndex(part => part === "upload");

        if (uploadIndex === -1) return null; // Invalid URL

        // 3. Extract parts following 'upload', excluding the version identifier
        // Expected parts slice: ['folder_name', 'subfolder', 'filename.jpg']

        // Skip the version segment (e.g., v172...) starting with 'v' if present

        let startIndex = uploadIndex + 1;
        if (parts[startIndex].startsWith('v')) {
            startIndex++;
        }

        const relevantParts = parts.slice(startIndex); // ['times-news', 'avatars', 'myphoto.jpg']

        // 4. Rejoin the parts and omit the file extension (.jpg/.png)
        const publicIdWithExtension = relevantParts.join('/');
        const publicId = publicIdWithExtension.split('.')[0];

        return publicId; // Output: times-news/avatars/myphoto

    } catch (error) {
        console.log("Error extracting ID:", error);
        return null;
    }
}

export { uploadOnCloudinary, deleteFromCloudinary };