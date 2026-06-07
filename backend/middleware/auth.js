import jwt from "jsonwebtoken";

export const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Debug (VERY IMPORTANT while fixing your issue)
    console.log("AUTH HEADER RECEIVED:", authHeader);

    // 1. Check header exists
    if (!authHeader) {
      return res.status(401).json({
        error: "No authorization header provided",
      });
    }

    // 2. Split safely (handles extra spaces too)
    const parts = authHeader.trim().split(/\s+/);

    if (parts.length !== 2) {
      return res.status(401).json({
        error: "Invalid authorization format. Expected: Bearer <token>",
      });
    }

    const [scheme, token] = parts;

    // 3. Must be Bearer
    if (scheme !== "Bearer") {
      return res.status(401).json({
        error: "Authorization must use Bearer scheme",
      });
    }

    if (!token) {
      return res.status(401).json({
        error: "Token missing",
      });
    }

    // 4. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded?.id) {
      return res.status(401).json({
        error: "Invalid token payload",
      });
    }

    // 5. Attach user to request
    req.userId = decoded.id;

    next();
  } catch (err) {
    console.log("AUTH ERROR:", err.message);

    // Better error classification
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        error: "Token expired. Please login again.",
      });
    }

    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        error: "Invalid token",
      });
    }

    return res.status(401).json({
      error: "Unauthorized",
      message: err.message,
    });
  }
};