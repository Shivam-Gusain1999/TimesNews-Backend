import mongoose from "mongoose";
import { Article } from "../models/article.model.js";
import { Category } from "../models/category.model.js";
import { User } from "../models/user.model.js";
import dotenv from "dotenv";
import { DB_NAME } from "../constants.js"; // Path check kar lena

// Load environment variables
dotenv.config({
    path: './.env'
});

const seedProfessionalData = async () => {
    try {
        console.log("🚀 Senior Developer Seeding Process Started...");

        // Establish database connection
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        console.log(`✅ Connected to Database: ${DB_NAME}`);

        // 1. Cleanup: Remove existing dummy data (Optional)
        console.log("🧹 Cleaning up old data...");
        await Article.deleteMany({});
        await Category.deleteMany({});
        // Note: Avoid deleting users to preserve existing accounts.
        // Uncomment the line below for a completely fresh start:
        await User.deleteMany({});

        // ---------------------------------------------------------
        // 👑 2. SUPER ADMIN SETUP (Core Configuration)
        // ---------------------------------------------------------
        const adminEmail = process.env.ADMIN_EMAIL || "shivam@timesnews.com";
        const adminPassword = process.env.ADMIN_PASSWORD || "Admin@1234";

        let user = await User.findOne({ email: adminEmail });

        if (!user) {
            console.log("🌱 Creating Super Admin...");
            user = await User.create({
                username: "superadmin",
                email: adminEmail,
                password: adminPassword, // Model hook handles encryption
                fullName: "Times News Owner",
                role: "admin", // <--- Required role assignment
                avatar: "https://ui-avatars.com/api/?name=Super+Admin&background=000&color=fff"
            });
            console.log(`✅ Super Admin Created: ${adminEmail}`);
        } else {
            console.log(`ℹ️ Super Admin already exists: ${adminEmail}`);
            // If user exists but is not an admin, forcibly upgrade the role
            if (user.role !== "admin") {
                user.role = "admin";
                await user.save();
                console.log("⚡ Updated existing user to Admin Role");
            }
        }

        // ---------------------------------------------------------
        // 3. Categories Setup
        // ---------------------------------------------------------
        const categoriesData = [
            { name: "Politics", description: "National and International Politics" },
            { name: "Sports", description: "Cricket, Football, and more" },
            { name: "Technology", description: "AI, Gadgets, and Software" },
            { name: "Entertainment", description: "Movies and Lifestyle" },
            { name: "Business", description: "Stock Market and Economy" }
        ];

        // Verify existing categories to prevent duplication
        const existingCats = await Category.countDocuments();
        let createdCategories = [];

        if (existingCats === 0) {
            createdCategories = await Category.insertMany(categoriesData);
            console.log("✅ Categories Created");
        } else {
            createdCategories = await Category.find();
            console.log("ℹ️ Using existing categories");
        }

        // ---------------------------------------------------------
        // 4. Articles Setup (Dummy Data)
        // ---------------------------------------------------------
        const articles = [];

        // Only generate sample articles if categories were freshly created
        if (createdCategories.length > 0) {
            createdCategories.forEach((cat) => {
                for (let i = 1; i <= 3; i++) {
                    articles.push({
                        title: `${cat.name} Update: Important News Story ${i}`,
                        content: `This is a high-quality professional news content for ${cat.name}. It covers all the essential aspects of the latest developments.`,
                        slug: `${cat.name.toLowerCase()}-news-${i}-${Date.now()}`,
                        thumbnail: `https://placehold.co/800x450?text=${cat.name}+News`, // Auto-generated placeholder image
                        category: cat._id,
                        author: user._id, // Assign Admin as the author
                        views: Math.floor(Math.random() * 50000) + 1000,
                        isFeatured: i === 1,
                        // Uncomment if a status field is explicitly required by the schema:
                        // status: "published" 
                    });
                }
            });

            await Article.insertMany(articles);
            console.log(`🎉 Success: ${articles.length} Professional Articles Seeded!`);
        }

    } catch (error) {
        console.error("💥 Script Error:", error);
    } finally {
        await mongoose.connection.close();
        console.log("👋 Connection Closed");
        process.exit();
    }
};

seedProfessionalData();