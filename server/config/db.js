import mongoose from "mongoose";

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    console.log("♻️ Using existing MongoDB connection");
    return;
  }

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI environment variable is not set");
    throw new Error("MONGO_URI is required");
  }

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log("✅ MongoDB Connected:", conn.connection.host);
    return conn;
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    isConnected = false;
    throw error;
  }
};

export default connectDB;
