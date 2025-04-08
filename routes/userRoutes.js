import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import User from "../models/UserModel.js";
import verifyToken  from "../middleware/auth.js"; // Ensure the correct file extension

const saltRounds = 10;
const router = express.Router();



const SECRET_KEY = process.env.JWT_SECRET_KEY;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
let otpStore = {}; 

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Send OTP
router.post('/send-otp2', async (req, res) => {
  const { email } = req.body;
  const otp = generateOtp();

  // Set OTP expiry time (5 minutes)
  otpStore[email] = { otp, expires: Date.now() + 300000 };

  // Create a transporter using your email service
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  // Mail options
  const mailOptions = {
    from: EMAIL_USER, // you can also hardcode your email here if it's always the same
    to: email,
    subject: 'Your OTP Code',
    text: `Your OTP code is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'OTP sent to your email' });
  } catch (error) {
    console.error('Error sending OTP:', error);  // Improved error logging
    res.status(500).json({ message: 'Error sending OTP' });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;

  if (otpStore[email] && otpStore[email].otp === otp && Date.now() < otpStore[email].expires) {
    delete otpStore[email]; // Remove OTP after successful verification
    res.status(200).json({ message: 'OTP verified' });
  } else {
    res.status(400).json({ message: 'Invalid or expired OTP' });
  }
});

// Register User
router.post('/register', async (req, res) => {
  const { name, email, mobile, password, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({ name, email, mobile, password: hashedPassword, role });

    await newUser.save();

    res.status(201).json({ message: 'User registered successfully', user: newUser });
  } catch (err) {
    console.error("Error during user registration:", err);
    res.status(500).json({ message: 'Error registering user' });
  }
});



// Login user
router.post('/login', async (req, res) => {
  const { mobile, password } = req.body;

  try {
    const user = await User.findOne({ mobile });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // ✅ Set user as active
    user.isActive = true;
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, SECRET_KEY, { expiresIn: '48h' });

    res.json({ message: 'Login successful', token, user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to login' });
  }
});
router.post('/logout', async (req, res) => {
  const { mobile } = req.body;

  try {
    const user = await User.findOne({ mobile });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.isActive = false;
    await user.save();

    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

router.get('/all-users', async (req, res) => {
  try {
    const users = await User.find({}, 'name mobile role isActive'); // Fetch only required fields
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


// Send OTP for password reset (same as before)
router.post('/send-otp', async (req, res) => {
  const { email } = req.body;
  try {
    // Check if the user exists in the database
    let user = await User.findOne({ email });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    if (user) {
      // If user exists, it's for password reset
      user.otp = hashedOtp;
      user.otpExpires = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
      await user.save();

      // Send OTP for password reset
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      });

      const mailOptions = {
        from: EMAIL_USER,
        to: email,
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}`,
      };

      await transporter.sendMail(mailOptions);
      return res.json({ success: true, message: 'OTP sent to your email for password reset.' });
    } else {
      // If the user doesn't exist, it's for registration
      user = new User({ email, otp: hashedOtp, otpExpires: Date.now() + 10 * 60 * 1000 });
      await user.save();

      // Send OTP for registration
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: EMAIL_USER, pass: EMAIL_PASS },
      });

      const mailOptions = {
        from: EMAIL_USER,
        to: email,
        subject: 'Registration OTP',
        text: `Your OTP for registration is: ${otp}`,
      };

      await transporter.sendMail(mailOptions);
      return res.json({ success: true, message: 'OTP sent to your email for registration.' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to send OTP.', error: err.message });
  }
});

// Reset Password
router.post('/forgot-password', async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isOtpValid = await bcrypt.compare(otp, user.otp);
    if (!isOtpValid || Date.now() > user.otpExpires)
      return res.status(400).json({ message: 'Invalid or expired OTP.' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
});

// Profile Route
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password -otp -otpExpires');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ status: 'success', user });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});
router.get("/my-properties", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("properties");
    if (!user) return res.status(404).json({ error: "User not found" });

    res.status(200).json({ properties: user.properties });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});
// routes/userRoutes.js or wherever you define the route
router.post("/add-property", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    const {
      address,
      description,
      rent,
      gender,
      furnishing,
      restriction,
      images, // Get multiple base64 image strings
      status,
      wifi,
      ac,
      waterSupply,
      powerBackup,
      security,
    } = req.body;

    const newProperty = {
      address,
      description,
      rent,
      gender,
      furnishing,
      restriction,
      images,
      status: status || "Open",
      wifi,          // Store checkbox values
      ac,
      waterSupply,
      powerBackup,
      security,
    };

    user.properties.push(newProperty);
    await user.save();

    res.status(200).json({ status: "success", property: newProperty });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to add property" });
  }
});

router.get("/properties", async (req, res) => {
  try {
    // Get all users with their properties
    const users = await User.find({}, "properties");

    // Flatten and merge all properties into one array
    const allProperties = users.flatMap(user => user.properties);

    res.status(200).json(allProperties);
  } catch (error) {
    console.error("Error fetching properties:", error);
    res.status(500).json({ error: "Failed to fetch properties" });
  }
});

// Update property by ID
// PUT /api/users/:id


// Update a specific property of the user
router.put("/update-property/:propertyId", verifyToken, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { rent, status } = req.body;

    // Validate input
    if (rent === undefined && status === undefined) {
      return res.status(400).json({ error: "No fields to update" });
    }

    if (rent !== undefined && (isNaN(rent) || rent <= 0)) {
      return res.status(400).json({ error: "Invalid rent amount" });
    }

    if (status && !["Open", "Closed"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    // Find user and the specific property
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const propertyIndex = user.properties.findIndex(
      p => p._id.toString() === propertyId
    );

    if (propertyIndex === -1) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Update the property fields
    if (rent !== undefined) {
      user.properties[propertyIndex].rent = rent;
    }
    if (status !== undefined) {
      user.properties[propertyIndex].status = status;
    }

    await user.save();

    res.status(200).json(user.properties[propertyIndex]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update property" });
  }
});


router.delete("/delete-property/:propertyId", verifyToken, async (req, res) => {
  try {
    const { propertyId } = req.params;

    // Find the user making the request
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find index of the property to delete
    const propertyIndex = user.properties.findIndex(
      (p) => p._id.toString() === propertyId
    );

    if (propertyIndex === -1) {
      return res.status(404).json({ error: "Property not found" });
    }

    // Remove property from user's properties
    user.properties.splice(propertyIndex, 1);
    
    await user.save();

    res.status(200).json({ message: "Property deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete property" });
  }
});

export default router;