const { storage } = require("../services/storageService");
const { signToken } = require("../services/tokenService");
const { sendSuccess, sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    try {
      const existingUser = await storage.findUserByEmail(email);
      if (existingUser) {
        return sendError(res, "An account with this email already exists", 409);
      }
    } catch (e) {
      if (e.code !== 11000) throw e;
      return sendError(res, "An account with this email already exists", 409);
    }

    let user;
    try {
      user = await storage.createUser({ name, email, password });
    } catch (e) {
      if (e.code === 11000) {
        return sendError(res, "An account with this email already exists", 409);
      }
      throw e;
    }

    const token = signToken({ id: user._id, email: user.email });
    logger.info(`New user registered: ${email}`);

    return sendSuccess(res, "Account created successfully", {
      token,
      user: { id: user._id, name: user.name, email: user.email, isPhoneVerified: false },
    }, 201);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const userWithPw = await storage.findUserByEmailWithPassword(email);
    if (!userWithPw) {
      return sendError(res, "Invalid email or password", 401);
    }

    const isMatch = await bcrypt.compare(password, userWithPw.password);
    if (!isMatch) {
      return sendError(res, "Invalid email or password", 401);
    }

    const user = await storage.findUserByEmail(email);
    const token = signToken({ id: user._id, email: user.email });
    logger.info(`User logged in: ${email}`);

    return sendSuccess(res, "Login successful", {
      token,
      user: { id: user._id, name: user.name, email: user.email, phone: user.phone, isPhoneVerified: user.isPhoneVerified },
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res) => {
  return sendSuccess(res, "Profile fetched", {
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    phone: req.user.phone,
    isPhoneVerified: req.user.isPhoneVerified,
    createdAt: req.user.createdAt,
  });
};

module.exports = { register, login, getMe };
