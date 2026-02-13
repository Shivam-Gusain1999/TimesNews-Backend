import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration (.env se load hoga)
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
        // (Callback use kiya taaki server block na ho)
        fs.unlink(localFilePath, (err) => {
            if (err) console.log("Local file deleted");
        });
        
        return response;

    } catch (error) {
        // Upload Fail -> Delete local file (Clean up)
        fs.unlink(localFilePath, (err) => {
             if (err) console.log("Error deleting local file after fail");
        });
        return null;
    }
}


// 2. DELETE FUNCTION (Cloudinary se hatana)

const deleteFromCloudinary = async (fileUrlOrPublicId) => {
    try {
        if (!fileUrlOrPublicId) return null;

        // Step A: Agar URL aaya hai, to Public ID nikalo
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

// 3. HELPER: URL se Public ID nikaalne ka logic

const extractPublicIdFromUrl = (url) => {
    try {
        
        // 1. URL ko '/' se todo
        const parts = url.split('/');
        
        // 2. 'upload' keyword dhundo
        const uploadIndex = parts.findIndex(part => part === "upload");
        
        if (uploadIndex === -1) return null; // Invalid URL
        
        // 3. 'upload' ke baad waale hisse uthao (version v123... ko chod kar)
        // parts array mein se humein chahiye: ['times-news', 'avatars', 'myphoto.jpg']
        
        // uploadIndex + 1 usually version hota hai (e.g., v172...)
        // Hum check karenge agar wo 'v' se start hota hai to skip karenge
        
        let startIndex = uploadIndex + 1;
        if (parts[startIndex].startsWith('v')) {
            startIndex++;
        }
        
        const relevantParts = parts.slice(startIndex); // ['times-news', 'avatars', 'myphoto.jpg']
        
        // 4. Join wapis karo aur extension (.jpg) hatao
        const publicIdWithExtension = relevantParts.join('/'); 
        const publicId = publicIdWithExtension.split('.')[0];
        
        return publicId; // Output: times-news/avatars/myphoto

    } catch (error) {
        console.log("Error extracting ID:", error);
        return null;
    }
}

export { uploadOnCloudinary, deleteFromCloudinary };