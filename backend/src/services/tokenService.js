const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

/**
 * JWT Token Service
 * Centralizes token creation and verification so config changes only happen here.
 */

const SECRET = process.env.JWT_SECRET;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!SECRET) {
  logger.error("JWT_SECRET is not set. Exiting.");
  process.exit(1);
}

/**
 * Sign a JWT for a given user.
 * @param {object} payload - Data to encode (avoid sensitive fields)
 * @returns {string} Signed JWT string
 */
const signToken = (payload) => {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
};

/**
 * Verify a JWT and return the decoded payload.
 * Throws JsonWebTokenError or TokenExpiredError on failure.
 *
 * @param {string} token
 * @returns {object} Decoded payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, SECRET);
};

module.exports = { signToken, verifyToken };
