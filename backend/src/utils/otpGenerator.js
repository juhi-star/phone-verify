const crypto = require("crypto");

/**
 * Generate a cryptographically secure numeric OTP.
 * Using crypto.randomInt ensures uniform distribution (no modulo bias).
 *
 * @param {number} length - Number of digits (default from env or 6)
 * @returns {string} - Zero-padded OTP string
 */
const generateOTP = (length = parseInt(process.env.OTP_LENGTH) || 6) => {
  const max = Math.pow(10, length); // e.g. 1_000_000 for 6 digits
  const otp = crypto.randomInt(0, max);
  return otp.toString().padStart(length, "0");
};

/**
 * Calculate OTP expiry timestamp
 * @param {number} minutes - Minutes until expiry (default from env or 2)
 * @returns {Date}
 */
const getOTPExpiry = (minutes = parseInt(process.env.OTP_EXPIRY_MINUTES) || 2) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generateOTP, getOTPExpiry };
