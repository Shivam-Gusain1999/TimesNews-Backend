import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";


// Generate Access and Refresh Tokens for a user

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Save refresh token to database
        user.refreshToken = refreshToken;

        // Save without validation since we only update the token
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token");
    }
}


const registerUser = asyncHandler(async (req, res) => {


    // Request body is validated by Zod at the route level
    const { fullName, email, username, password } = req.body;

    // Check if a user with the same email or username already exists
    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    });

    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Handle file uploads (Avatar is required, Cover Image is optional)
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    // Cover Image optional
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    // Upload files to Cloudinary
    let avatarUrl = "";

    if (avatarLocalPath) {
        const avatar = await uploadOnCloudinary(avatarLocalPath, "avatars");
        if (!avatar?.url) {
            throw new ApiError(500, "Avatar upload failed on cloud");
        }
        avatarUrl = avatar.url;
    } else {
        // Fallback to auto-generated avatar
        avatarUrl = `https://ui-avatars.com/api/?name=${fullName.replace(" ", "+")}&background=random&color=fff`;
    }

    const coverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath, "covers") : null;


    // Create user in the database
    const user = await User.create({
        fullName,
        avatar: avatarUrl,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });

    // Fetch the newly created user without sensitive fields (password, refreshToken)
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Success! 
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});



// Authenticate and Login User

const loginUser = asyncHandler(async (req, res) => {

    // Request body is validated by Zod at the route level
    const { email, username, password } = req.body;

    // Find the user by username or email
    const user = await User.findOne({
        $or: [{ username }, { email }]
    }).select("+password");

    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Check if user is blocked
    if (user.isBlocked) {
        throw new ApiError(403, "Your account has been blocked. Please contact support.");
    }


    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }


    // Generate access and refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Retrieve the user object without sensitive data
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



// Logout User
const logoutUser = asyncHandler(async (req, res) => {

    // Unset the refreshToken field in the database
    if (req?.user?._id) {
        await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                    refreshToken: 1
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
            .clearCookie("accessToken", options)
            .clearCookie("refreshToken", options)
            .json(
                new ApiResponse(
                    200,
                    {},
                    "User logged out successfully"
                )
            )
    }
})


// Refresh Access Token

const refreshAccessToken = asyncHandler(async (req, res) => {

    // Retrieve the incoming refresh token from cookies or request body
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        // Verify the existing token
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )

        // Find the user associated with the token 
        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }

        // Verify that the provided token matches the one stored in the database
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
        }

        // Generate a new pair of tokens
        const options = {
            httpOnly: true,
            secure: true,
            sameSite: "None"
        }

        const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Access token refreshed"
                )
            )

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})


// CHANGE CURRENT PASSWORD

const changeCurrentPassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body

    // Validation
    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old password and new password are required")
    }

    // Retrieve the user from the database, including the password for verification
    const user = await User.findById(req.user?._id).select("+password")

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    // Verify the old password
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    // Update the password - the pre-save hook will automatically hash it
    user.password = newPassword

    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})


// Retrieve the current authenticated user
const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})


// Update Basic Account Details (Name and Email)
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
})

// Update User Avatar
const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    // Upload the new avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath, "avatars");

    if (!avatar || !avatar.url) {
        throw new ApiError(400, "Error while uploading avatar on Cloudinary");
    }

    // Store the old avatar URL before update for cleanup
    const oldAvatarUrl = req.user?.avatar;

    // Persist the new avatar URL in the database
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { avatar: avatar.url } },
        { new: true }
    ).select("-password -refreshToken");

    // Delete the old avatar from Cloudinary to free storage
    if (oldAvatarUrl && !oldAvatarUrl.includes("ui-avatars.com")) {
        await deleteFromCloudinary(oldAvatarUrl);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Avatar updated successfully"));
});



// Update User Cover Image
const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing");
    }

    // Upload the new cover image to Cloudinary
    const coverImage = await uploadOnCloudinary(coverImageLocalPath, "covers");

    if (!coverImage || !coverImage.url) {
        throw new ApiError(400, "Error while uploading cover image on Cloudinary");
    }

    // Store the old cover image URL before update for cleanup
    const oldCoverImageUrl = req.user?.coverImage;

    // Persist the new cover image URL in the database
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password -refreshToken");

    // Delete the old cover image from Cloudinary to free storage
    if (oldCoverImageUrl) {
        await deleteFromCloudinary(oldCoverImageUrl);
    }

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Cover image updated successfully"));
});


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage };