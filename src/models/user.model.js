import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { ROLE_VALUES, ROLES } from "../constants/roles.constant.js"; // ✅ Roles import kiye

const userSchema = new Schema(
  {
    // 1. Identity Fields (Search Fast)
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true // Database mein dhoondne mein aasaani hogi
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
      select: false // API response mein password kabhi nahi dikhega
    },


    avatar: {
      type: String, // Cloudinary URL
      default: null
    },
    coverImage: {
      type: String, // Cloudinary URL (Profile ka banner)
    },
    bio: {
        type: String,
        maxLength: [250, "Bio cannot exceed 250 characters"],
        default: ""
    },

    // 4. Role Management (Admin vs Reporter vs User)
    role: {
        type: String,
        enum: ROLE_VALUES, // Sirf ['admin', 'editor', 'reporter', 'user'] allowed hai
        default: ROLES.USER
    },

    // 5. User History (News Specific)
    bookmarks: [
      {
        type: Schema.Types.ObjectId,
        ref: "Article" // Kaunsi news save ki hai
      }
    ],
    readingHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Article" // Kaunsi news padhi hai (Recommendation ke liye)
      }
    ],

    // 6. Refresh Token (Login tikaye rakhne ke liye)
    refreshToken: {
      type: String
    }
  },
  {
    timestamps: true // createdAt aur updatedAt apne aap manage honge
  }
);




// 1. Password Encryption (Pre-save Hook)
// Save hone se pehle password ko hash (encrypt) karega
userSchema.pre("save", async function() {
  if (!this.isModified("password")) return;
  
  // 10 Rounds Salt (Industry Standard)
  this.password = await bcrypt.hash(this.password, 10);

});

// 2. Password Checker Method
// Login ke waqt check karega ki password sahi hai ya nahi
userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

// 3. Access Token Generator (Short Lived - 15 mins)
// Ye token har API request ke saath bheja jayega
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

// 4. Refresh Token Generator (Long Lived - 10 days)
// Ye tab kaam aayega jab Access Token expire ho jayega
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