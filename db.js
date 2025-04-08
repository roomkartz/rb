import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const connectDB = async () => {
  try {
    const MONGO_URI = "mongodb+srv://ayushmaurya3596:Ayush21@cluster0.gnbc7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0"; // Access the MongoDB URI from the environment variables

    if (!MONGO_URI) {
      throw new Error("MONGODB_URI is not defined in the environment variables");
    }

    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default connectDB;