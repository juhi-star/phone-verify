const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const {
  sendOTP,
  verifyOTP,
  getVerificationStatus,
} = require("../controllers/verificationController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

/**
 * Verification Routes
 * Base path: /api/verify
 * All routes require authentication.
 */

// Stricter rate limit for OTP endpoints — prevent SMS abuse
const otpRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,                    // Max 5 OTP requests per 15 minutes per IP
  message: {
    success: false,
    message: "Too many OTP requests. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/verify/send-otp
// @desc    Send OTP to the provided phone number
// @access  Private
router.post("/send-otp", protect, otpRateLimit, validate(schemas.sendOTP), sendOTP);

// @route   POST /api/verify/verify-otp
// @desc    Verify submitted OTP
// @access  Private
router.post("/verify-otp", protect, validate(schemas.verifyOTP), verifyOTP);

// @route   GET /api/verify/status
// @desc    Get current phone verification status
// @access  Private
router.get("/status", protect, getVerificationStatus);

module.exports = router;
