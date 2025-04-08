import jwt from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET_KEY || "3hk1qwfu80cyqw3r1jfqpe9vdayqehpifb31rjlpihfwipbfjel31fpih8FHWUBJUWO8U3R1J";

const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

  try {
    const verified = jwt.verify(token, SECRET_KEY);
    req.user = verified;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      res.status(401).json({ message: "Session expired. Please log in again." });
    } else {
      res.status(400).json({ message: "Invalid token." });
    }
  }
};

// ✅ Default export
export default verifyToken;
