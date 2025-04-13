import admin from "firebase-admin";

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken; // Contains uid, email, phone_number, etc.
    next();
  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default verifyFirebaseToken;
