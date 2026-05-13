const logger = require("../utils/logger");
const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

const inMemory = {
  users: new Map(),
  otps: new Map(),
};

let dbReady = false;

function setDbReady(ready) {
  dbReady = ready;
}

function isDbReady() {
  return dbReady;
}

function stripPassword(user) {
  const { password, ...rest } = user;
  return rest;
}

const storage = {
  async createUser({ name, email, password }) {
    if (dbReady) {
      const User = require("../models/User");
      return User.create({ name, email, password });
    }
    if (inMemory.users.has(email)) {
      const err = new Error("Duplicate email");
      err.code = 11000;
      throw err;
    }
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const user = {
      _id: `mem-${Date.now()}`,
      name,
      email,
      password: hashed,
      phone: null,
      isPhoneVerified: false,
      createdAt: new Date(),
    };
    inMemory.users.set(email, user);
    logger.info(`[MEM] User created: ${email}`);
    return stripPassword(user);
  },

  async findUserByEmail(email) {
    if (dbReady) {
      const User = require("../models/User");
      return User.findOne({ email });
    }
    const user = inMemory.users.get(email);
    if (!user) return null;
    return stripPassword(user);
  },

  async findUserByEmailWithPassword(email) {
    if (dbReady) {
      const User = require("../models/User");
      return User.findOne({ email }).select("+password");
    }
    const user = inMemory.users.get(email);
    if (!user) return null;
    return { ...user };
  },

  async findUserById(id) {
    if (dbReady) {
      const User = require("../models/User");
      return User.findById(id);
    }
    for (const user of inMemory.users.values()) {
      if (user._id === id) return stripPassword(user);
    }
    return null;
  },

  async findUserByIdWithOtp(id) {
    if (dbReady) {
      const User = require("../models/User");
      return User.findById(id).select("+otp.hash +otp.expiresAt +otp.createdAt +otp.attempts");
    }
    let user = null;
    for (const u of inMemory.users.values()) {
      if (u._id === id) { user = u; break; }
    }
    if (!user) return null;

    const sync = () => { inMemory.users.set(user.email, { ...user }); };

    const wrapper = {
      get _id() { return user._id; },
      get name() { return user.name; },
      get email() { return user.email; },
      get phone() { return user.phone; },
      set phone(v) { user.phone = v; sync(); },
      get isPhoneVerified() { return user.isPhoneVerified; },
      set isPhoneVerified(v) { user.isPhoneVerified = v; sync(); },
      get createdAt() { return user.createdAt; },
      get otp() { return inMemory.otps.get(id) || { hash: null, expiresAt: null, createdAt: null, attempts: 0 }; },
      set otp(v) { inMemory.otps.set(id, v); },
      async setOTP(plainOTP, expiresAt) {
        const hash = await bcrypt.hash(plainOTP, SALT_ROUNDS);
        inMemory.otps.set(id, { hash, expiresAt, createdAt: new Date(), attempts: 0 });
        sync();
      },
      async verifyOTP(candidate) {
        const data = inMemory.otps.get(id);
        if (!data || !data.hash || !data.expiresAt) return false;
        if (new Date() > data.expiresAt) return false;
        if (data.attempts >= 5) return false;
        const match = await bcrypt.compare(candidate, data.hash);
        data.attempts++;
        if (match) {
          data.hash = undefined;
          data.expiresAt = undefined;
          data.createdAt = undefined;
          data.attempts = 0;
          user.isPhoneVerified = true;
          sync();
        }
        return match;
      },
      clearOTP() {
        inMemory.otps.set(id, { hash: null, expiresAt: null, createdAt: null, attempts: 0 });
        sync();
      },
      async save() { sync(); return wrapper; },
    };
    return wrapper;
  },
};

module.exports = { storage, setDbReady, isDbReady };
