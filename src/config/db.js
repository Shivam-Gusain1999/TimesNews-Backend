import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


export const connectDB = async () => {
  try {
    // 1. Connection Event Listeners (Agar chalte server mein DB band ho jaye)
    mongoose.connection.on("disconnected", () => {
      console.log("MongoDB disconnected! Trying to reconnect...");
    });

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB runtime error:", err);
    });

    // 2. Connection Attempt (Safer Way)
    // Hum DB Name URL mein nahi jodenge, Mongoose ke options mein denge
    // Isse slash (/) ki galti kabhi nahi hogi.
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`, {
      dbName: DB_NAME, 
    });

    console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
    
  } catch (error) {
    console.error(" MONGODB connection FAILED ", error);
    process.exit(1);
  }
};

