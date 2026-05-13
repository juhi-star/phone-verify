const { verifyToken } = require("../services/tokenService");
const { storage } = require("../services/storageService");
const { sendError } = require("../utils/apiResponse");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return sendError(res, "Authorization token is missing or malformed", 401);
    }

    const token = authHeader.split(" ")[1];

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return sendError(res,
        err.name === "TokenExpiredError"
          ? "Session expired. Please log in again."
          : "Invalid token. Please log in again.",
        401);
    }

    const user = await storage.findUserById(decoded.id);
    if (!user) {
      return sendError(res, "User associated with this token no longer exists", 401);
    }

    req.user = user;
    next();
  } catch (error) {
    return sendError(res, "Authentication failed", 500);
  }
};

module.exports = { protect };
