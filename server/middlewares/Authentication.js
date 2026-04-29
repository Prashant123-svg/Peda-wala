// import jwt from "jsonwebtoken";

// export const authMiddleware = (req, res, next) => {
//   const token = req.header("Authorization")?.split(" ")[1]; // "Bearer TOKEN"

//   if (!token) return res.status(401).json({ msg: "No token, authorization denied" });

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = { id: decoded.id };
//     next();
//   } catch (err) {
//     res.status(400).json({ msg: "Token is not valid" });
//   }
// };


import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    
    console.log("🔐 Auth Check - Path:", req.path);
    console.log("🔐 Auth Header Present:", !!authHeader);

    if (!authHeader) {
      console.error("❌ No Authorization header");
      return res.status(401).json({ msg: "No token provided" });
    }

    const token = authHeader.split(" ")[1]; // "Bearer TOKEN"

    if (!token) {
      console.error("❌ Token missing after Bearer split");
      return res.status(401).json({ msg: "Token missing" });
    }

    console.log("🔐 Token found, verifying with secret:", !!process.env.JWT_SECRET);
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified, User ID:", decoded.id, "Role:", decoded.role);
    
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      console.error("❌ Token expired:", err.expiredAt);
      return res.status(401).json({ 
        msg: "Token expired", 
        expiredAt: err.expiredAt,
        code: "TOKEN_EXPIRED"
      });
    } else if (err.name === "JsonWebTokenError") {
      console.error("❌ Invalid token:", err.message);
      return res.status(401).json({ 
        msg: "Invalid token",
        code: "INVALID_TOKEN"
      });
    }
    console.error("❌ Authentication error:", err.message);
    return res.status(401).json({ msg: "Authentication failed", error: err.message });
  }
};

