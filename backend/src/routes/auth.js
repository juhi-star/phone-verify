const express = require("express");
const router = express.Router();

const { register, login, getMe } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

/**
 * Auth Routes
 * Base path: /api/auth
 */

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post("/register", validate(schemas.register), register);

// @route   POST /api/auth/login
// @desc    Login and receive JWT
// @access  Public
router.post("/login", validate(schemas.login), login);

// @route   GET /api/auth/me
// @desc    Get authenticated user's profile
// @access  Private
router.get("/me", protect, getMe);

module.exports = router;
