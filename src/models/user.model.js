import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ROLE_VALUES, ROLES } from "../constants/roles.constant.js";

const userSchema = new Schema(
  {
    // 1. Identity Fields
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      index: true
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false // Exclude password from query results by default
    },


    avatar: {
      type: String, // Cloudinary URL
      default: null
    },
    coverImage: {
      type: String, // Cloudinary URL
    },
    bio: {
      type: String,
      maxLength: [250, "Bio cannot exceed 250 characters"],
      default: ""
    },

    // 4. Role Management
    role: {
      type: String,
      enum: ROLE_VALUES,
      default: ROLES.USER
    },

    // 4.5 Block/Ban Status
    isBlocked: {
      type: Boolean,
      default: false
    },

    // 5. User History
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Article"
      }
    ],
    readingHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Article"
      }
    ],

    // 6. Refresh Token for managing sessions
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true
  }
);




// 1. Password Encryption (Pre-save Hook)
// Hash the password before saving to the database
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  // Utilize 10 salt rounds for hashing
  this.password = await bcrypt.hash(this.password, 10);

});

// 2. Password Verification Method
// Compare raw password with the hashed password 
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// 3. Access Token Generator
// Included with every API request
userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName,
      role: this.role
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

// 4. Refresh Token Generator
// Used to issue new access tokens upon expiration
userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};

export const User = mongoose.model("User", userSchema);