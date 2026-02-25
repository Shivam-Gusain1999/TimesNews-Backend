import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


export const connectDB = async () => {
  try {
    // 1. Connection Event Listeners (Handle runtime disconnections)
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected! Trying to reconnect...");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB runtime error:", err);
    });

    // 2. Secure Connection Attempt
    // Pass DB Name via Mongoose options instead of the URI string
    // This prevents trailing slash formatting errors.
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`, {
      dbName: DB_NAME,
    });

    console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);

  } catch (error) {
    console.error(" MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

