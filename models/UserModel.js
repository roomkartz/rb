import mongoose from "mongoose";

const propertySchema = new mongoose.Schema({
  address: String,
  description: String,
  rent: Number,
  gender: String,
  furnishing: String,
  restriction: String,
  images: [String],
  status: { type: String, default: "Open" },
  wifi: Boolean,
  ac: Boolean,
  waterSupply: Boolean,
  powerBackup: Boolean,
  security: Boolean,
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  uid: { type: String, required: true, unique: true }, // From Firebase Auth
  email: { type: String },                             // Optional from Firebase
  phoneNumber: { type: String },                       // Optional from Firebase
  role: { type: String, enum: ['user', 'owner'], required: true }, // Required role
  properties: [propertySchema],                        // Only for owners
}, { timestamps: true });

export default mongoose.model("User", userSchema);
