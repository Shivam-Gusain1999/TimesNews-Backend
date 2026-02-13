import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req, _, next) => {
    try {
        // --- STEP 1: Token Nikalo ---
        // Token ya to Cookies mein hoga, ya Header mein (Mobile Apps ke liye)
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        // Agar token nahi mila, matlab banda logged out hai
        if (!token) {
            throw new ApiError(401, "Unauthorized request")
        }
    
        // --- STEP 2: Token Verify Karo ---
        // Secret key se check karo ki ye token humne hi diya hai ya kisi ne nakli banaya hai
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        // --- STEP 3: User Dhundo ---
        // Token sahi hai, ab DB se user nikaalo (Password mat lana)
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        // --- STEP 4: Request mein User Jod Do ---
        // Ye sabse important line hai!
        // Ab aage ke controllers ko pata chal jayega ki 'req.user' kaun hai.
        req.user = user;
        next()

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
    
})