import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


// this helper function generate access token or refresh tokens 

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        
        // Model ke methods call kiye
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Refresh Token ko Database mein save karna zaroori hai
        // Taaki user bina login kiye naya Access Token maang sake
        user.refreshToken = refreshToken;
        
        // Validate false isliye kyunki humein baaki fields (jaise password) check nahi karne
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token");
    }
}


const registerUser = asyncHandler(async (req, res) => {
    
 
    // Frontend (React/Postman) se data body mein aayega
    const { fullName, email, username, password } = req.body;
    
   if (
    [fullName, email, username, password].some((field) => !field || field.trim() === "")
) {
    throw new ApiError(400, "All fields are required");
}

    // --- STEP 3: DUPLICATE CHECK (Database Query) ---
    // Kya ye banda pehle se exist karta hai?
    const existedUser = await User.findOne({
        $or: [{ username }, { email }] // Ya to Username same ho YA Email same ho
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // --- STEP 4: FILE HANDLING (Multer ka Jadoo) ---
    // Hamein bas unka Local Path chahiye.

    // Avatar zaroori hai
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    
    // Cover Image optional hai (check karna padega ki aayi hai ya nahi)
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // Agar Avatar nahi mila, toh wahi rok do
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required");
    }

    // --- STEP 5: CLOUDINARY UPLOAD (Heavy Lifting) ---
    // Local path ko Cloudinary utility mein bhejo
    // Hum folder name bhi pass kar rahe hain: "avatars" aur "covers"
    
    const avatar = await uploadOnCloudinary(avatarLocalPath, "avatars");
    const coverImage = await uploadOnCloudinary(coverImageLocalPath, "covers");

    // Check: Kya Cloudinary ne URL diya?
    if (!avatar?.url) {
        throw new ApiError(500, "Avatar upload failed on cloud");
    }

    // DATABASE ENTRY (Object Creation) ---
    const user = await User.create({
        fullName,
        avatar: avatar.url, // Cloudinary URL
        coverImage: coverImage?.url || "", // Agar nahi hai to empty string
        email,
        password, 
        username: username.toLowerCase() 
    });

    // --- STEP 7: RESPONSE CHECK (Safai) ---
    // User ban gaya, par humein password wapas nahi bhejna hai.
    // Isliye hum DB se dobara dhoondte hain bina password ke.
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" // Minus (-) ka matlab: Ye mat lao
    );

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Success! 
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
    );
});



// LOGIN USER CONTROLLER

const loginUser = asyncHandler(async (req, res) => {
    
    const { email, username, password } = req.body;

    // Check: Kam se kam Username YA Email hona chahiye
    if (!username && !email) {
        throw new ApiError(400, "Username or email is required");
    }

    // Hum check karenge ki kya username match karta hai YA email match karta hai
    const user = await User.findOne({
        $or: [{ username }, { email }]
    }).select("+password");

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    
    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

   
    // Access aur Refresh tokens generate karo
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    
    // User ko wapas bhejne se pehle password aur refresh token hata do
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    
   const cookieOptions = {
    httpOnly: true,
    secure: true, 
    sameSite: "None"
}

    return res
        .status(200)
        .cookie("accessToken", accessToken, cookieOptions)
        .cookie("refreshToken", refreshToken, cookieOptions)
        .json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser, accessToken, refreshToken
                }, 
                "User logged In Successfully"
            )
        );
});



// LOGOUT USER CONTROLLER
const logoutUser = asyncHandler(async (req, res) => {

    // Hum user ko update kar rahe hain ki uska refreshToken ab 'undefined' (null) ho jaye
    if(req?.user?._id){
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // 1 means remove this field
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true,
        sameSite: "None"
    }

    return res
        .status(200)
        // clearCookie function browser ko bolta hai ki ye cookies delete kar do
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(
                200, 
                {}, 
                "User logged out successfully"
            )
        )}
})


// REFRESH ACCESS TOKEN 

const refreshAccessToken = asyncHandler(async (req, res) => {
    
    //  Incoming Refresh Token lo 
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        //  Verify Token ---
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        //  User Dhundo ---
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        // Security Check (Optional but Good) ---
        // Kya incoming token wahi hai jo database mein save hai?
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        // Naye Tokens Banao 
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


// CHANGE CURRENT PASSWORD

const changeCurrentPassword = asyncHandler(async(req, res) => {
    
    const { oldPassword, newPassword } = req.body

    // Validation
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required")
    }

    // User find

    // req.user humein 'verifyJWT' middleware se mil raha hai
    // Lekin req.user mein password field nahi hoti (humne select("-password") kiya tha)
    // Isliye humein database se dobara password ke saath user lana padega
    
    const user = await User.findById(req.user?._id).select("+password")

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    // Step 3: Old Password check karo
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // Step 4: Naya Password Set karo aur Save karo
    user.password = newPassword
    
    // Mongoose ka 'pre-save' hook apne aap ise hash kar dega 
    await user.save({ validateBeforeSave: false })

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})


// GET CURRENT USER (Banda kaun hai?)

const getCurrentUser = asyncHandler(async(req, res) => {
    // req.user humein verifyJWT middleware se mil chuka hai
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})


// UPDATE ACCOUNT DETAILS (Name aur Email badalna)

const updateAccountDetails = asyncHandler(async(req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    // findByIdAndUpdate use karenge
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email: email // ya sirf 'email' likh sakte ho 
            }
        },
        { new: true } // naya (updated) data return karega
    ).select("-password") // password mat dena response mein

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

// UPDATE USER AVATAR 

const updateUserAvatar = asyncHandler(async(req, res) => {
    
    // 1. Multer se local file path nikaalo
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // 2. Nayi photo Cloudinary pe upload karo (Folder name "avatars" pass kar rahe hain)
    const avatar = await uploadOnCloudinary(avatarLocalPath, "avatars");

    if (!avatar || !avatar.url) {
        throw new ApiError(400, "Error while uploading avatar on Cloudinary");
    }

    // 3. Purana avatar URL nikal lo (Delete karne ke kaam aayega)
    const oldAvatarUrl = req.user?.avatar;

    // 4. Database mein naya URL update karo
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    // 5. Purani photo Cloudinary se uda do (Taaki storage bache)
    if (oldAvatarUrl) {
        await deleteFromCloudinary(oldAvatarUrl);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"));
});



// UPDATE USER COVER IMAGE 

const updateUserCoverImage = asyncHandler(async(req, res) => {
    
    // 1. Multer se local file path nikaalo
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    // 2. Nayi photo Cloudinary pe upload karo (Folder name "covers" pass kar rahe hain)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath, "covers");

    if (!coverImage || !coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image on Cloudinary");
    }

    // 3. Purana cover image URL nikal lo
    const oldCoverImageUrl = req.user?.coverImage;

    // 4. Database mein naya URL update karo
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password");

    // 5. Purani photo Cloudinary se uda do
    if (oldCoverImageUrl) {
        await deleteFromCloudinary(oldCoverImageUrl);
    }

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover image updated successfully"));
});


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails,updateUserAvatar, updateUserCoverImage };