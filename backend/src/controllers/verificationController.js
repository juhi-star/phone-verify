const smsService = require("../services/smsService");
const { generateOTP, getOTPExpiry } = require("../utils/otpGenerator");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const { storage } = require("../services/storageService");
const logger = require("../utils/logger");

const RESEND_COOLDOWN_SECONDS = 30;

const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;
    const userId = req.user._id;

    const user = await storage.findUserByIdWithOtp(userId);

    if (user.isPhoneVerified && user.phone === phone) {
      return sendError(res, "This phone number is already verified", 400);
    }

    if (user.otp?.createdAt) {
      const elapsedSec = (Date.now() - new Date(user.otp.createdAt)) / 1000;

      if (elapsedSec < RESEND_COOLDOWN_SECONDS) {
        const remaining = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsedSec);
        return sendError(res, `Please wait ${remaining} seconds before requesting a new code`, 429);
      }
    }

    const otp = generateOTP();
    const expiresAt = getOTPExpiry();

    user.phone = phone;
    user.isPhoneVerified = false;
    await user.setOTP(otp, expiresAt);
    await user.save();

    await smsService.sendOTP(phone, otp);

    logger.info(`OTP sent to ${phone} for user ${userId}`);

    return sendSuccess(res, "Verification code sent to your phone number", { phone, expiresAt });
  } catch (error) {
    if (error.code && error.status) {
      logger.error(`Twilio error ${error.code}: ${error.message}`);
      return sendError(res, "Failed to send SMS. Please check the phone number and try again.", 502);
    }
    next(error);
  }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    const userId = req.user._id;

    const user = await storage.findUserByIdWithOtp(userId);

    if (user.phone !== phone) {
      return sendError(res, "Phone number does not match the one the code was sent to", 400);
    }

    if (!user.otp?.hash) {
      return sendError(res, "No pending verification. Please request a new code.", 400);
    }

    if (new Date() > user.otp.expiresAt) {
      user.clearOTP();
      await user.save();
      return sendError(res, "Verification code has expired. Please request a new one.", 410);
    }

    if (user.otp.attempts >= 5) {
      user.clearOTP();
      await user.save();
      return sendError(res, "Too many failed attempts. Please request a new verification code.", 429);
    }

    const isValid = await user.verifyOTP(otp);
    await user.save();

    if (!isValid) {
      const remaining = 5 - user.otp.attempts;
      return sendError(res, `Invalid code. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`, 400);
    }

    logger.info(`Phone ${phone} verified for user ${userId}`);

    return sendSuccess(res, "Phone number verified successfully", { phone, isPhoneVerified: true });
  } catch (error) {
    next(error);
  }
};

const getVerificationStatus = async (req, res) => {
  return sendSuccess(res, "Verification status fetched", {
    phone: req.user.phone,
    isPhoneVerified: req.user.isPhoneVerified,
  });
};

module.exports = { sendOTP, verifyOTP, getVerificationStatus };
