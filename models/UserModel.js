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
  uid: { type: String, required: true, unique: true },
  email: { type: String, sparse: true, unique: true },
  phoneNumber: { type: String },
  role: { type: String, enum: ['user', 'owner'], required: true },
  properties: [propertySchema],
}, { timestamps: true });

export default mongoose.model("User", userSchema);