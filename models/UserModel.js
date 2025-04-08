import mongoose from "mongoose";

// models/Property.js or inside userSchema properties field
const propertySchema = new mongoose.Schema({
  address: { type: String, required: true },
  description: { type: String, required: true },
  rent: { type: Number, required: true },
  gender: { type: String, required: true },
  furnishing: { type: String, required: true },
  restriction: { type: String, required: true },
  images: [{ type: String }], // Multiple base64 images
  status: { type: String, enum: ["Open", "Closed"], default: "Open" },
  wifi: { type: Boolean, default: false },
  ac: { type: Boolean, default: false },
  waterSupply: { type: Boolean, default: false },
  powerBackup: { type: Boolean, default: false },
  security: { type: Boolean, default: false },
});


const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  mobile: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Broker", "User"], required: true },
  otp: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  isActive: { type: Boolean, default: false },

  // ➕ Add this
  properties: [propertySchema],
});

const User = mongoose.model("User", userSchema);
export default User;
