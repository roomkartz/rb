import express from "express";
import User from "../models/UserModel.js";
import verifyFirebaseToken from "../middleware/auth.js";

const router = express.Router();

router.get("/all-users", async (req, res) => {
  try {
    const users = await User.find({}, "displayName phoneNumber role isActive");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.get("/profile", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select("-_id -__v");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({ status: "success", user });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch profile" });
  }
});

router.get("/properties", async (req, res) => {
  try {
    const users = await User.find({}, "properties");
    const allProperties = users.flatMap(user => user.properties);
    res.status(200).json(allProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

router.get("/my-properties", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid }).select("properties");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ properties: user.properties });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

router.post("/add-property", verifyFirebaseToken, async (req, res) => {
  try {
    const user = await User.findOne({ uid: req.user.uid });
    if (!user || user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can add properties" });
    }

    const newProperty = { ...req.body, status: req.body.status || "Open" };
    user.properties.push(newProperty);
    await user.save();

    res.status(200).json({ status: "success", property: newProperty });
  } catch (err) {
    res.status(500).json({ error: "Failed to add property" });
  }
});

router.put("/update-property/:propertyId", verifyFirebaseToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { rent, status } = req.body;

    const user = await User.findOne({ uid: req.user.uid });
    if (!user || user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can update properties" });
    }

    const property = user.properties.id(propertyId);
    if (!property) return res.status(404).json({ error: "Property not found" });

    if (rent !== undefined) property.rent = rent;
    if (status !== undefined) property.status = status;

    await user.save();
    res.status(200).json(property);
  } catch (err) {
    res.status(500).json({ error: "Failed to update property" });
  }
});

router.delete("/delete-property/:propertyId", verifyFirebaseToken, async (req, res) => {
  try {
    const { propertyId } = req.params;

    const user = await User.findOne({ uid: req.user.uid });
    if (!user || user.role !== "owner") {
      return res.status(403).json({ error: "Only owners can delete properties" });
    }

    user.properties = user.properties.filter(p => p._id.toString() !== propertyId);
    await user.save();

    res.status(200).json({ message: "Property deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete property" });
  }
});
router.post("/owner", async (req, res) => {
  const { uid, phoneNumber, role } = req.body;

  try {
    // Check if already exists
    const existing = await User.findOne({ uid });
    if (existing) {
      return res.status(200).json({ message: "Owner already exists", user: existing });
    }

    // Save new owner
    const newOwner = new User({
      uid,
      phoneNumber,
      role: role || "owner",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await newOwner.save();

    res.status(201).json({ message: "Owner created", user: newOwner });
  } catch (error) {
    console.error("Failed to create owner:", error);
    res.status(500).json({ error: "Failed to save owner" });
  }
});
export default router;
