const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

/**
 * User Schema
 * Stores user credentials, phone info, and verification state.
 * OTP is hashed before storage — never stored in plaintext.
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false, // Never returned in queries by default
    },
    phone: {
      type: String,
      trim: true,
      match: [/^\+[1-9]\d{1,14}$/, "Phone must be in E.164 format (e.g. +14155552671)"],
      default: null,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    // OTP fields — hashed for security
    otp: {
      hash: { type: String, select: false },      // bcrypt hash of the OTP
      expiresAt: { type: Date, select: false },    // expiry timestamp
      createdAt: { type: Date, select: false },    // when OTP was created (for cooldown)
      attempts: { type: Number, default: 0, select: false }, // failed attempt counter
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
userSchema.index({ phone: 1 });

// ─── Hooks ──────────────────────────────────────────────────────────────────

/**
 * Hash password before saving if it has been modified.
 */
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

// ─── Instance Methods ────────────────────────────────────────────────────────

/**
 * Compare a plaintext password against the stored hash.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Set and hash an OTP, then reset attempt counter.
 */
userSchema.methods.setOTP = async function (plainOTP, expiresAt) {
  this.otp.hash = await bcrypt.hash(plainOTP, SALT_ROUNDS);
  this.otp.expiresAt = expiresAt;
  this.otp.createdAt = new Date();
  this.otp.attempts = 0;
};

/**
 * Verify a submitted OTP against the stored hash.
 * Increments attempt counter on each call (caller is responsible for saving).
 */
userSchema.methods.verifyOTP = async function (candidateOTP) {
  if (!this.otp.hash || !this.otp.expiresAt) return false;

  if (new Date() > this.otp.expiresAt) return false;

  if (this.otp.attempts >= 5) return false;

  this.otp.attempts += 1;
  const isMatch = await bcrypt.compare(candidateOTP, this.otp.hash);

  if (isMatch) {
    this.otp.hash = undefined;
    this.otp.expiresAt = undefined;
    this.otp.createdAt = undefined;
    this.otp.attempts = 0;
    this.isPhoneVerified = true;
  }

  return isMatch;
};

/**
 * Clear stored OTP fields.
 */
userSchema.methods.clearOTP = function () {
  this.otp.hash = undefined;
  this.otp.expiresAt = undefined;
  this.otp.createdAt = undefined;
  this.otp.attempts = 0;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
