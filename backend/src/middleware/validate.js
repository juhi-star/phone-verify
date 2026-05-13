const Joi = require("joi");
const { sendError } = require("../utils/apiResponse");

/**
 * Factory function that returns an Express middleware for validating req.body.
 * Uses Joi for schema-based validation with descriptive error messages.
 *
 * @param {Joi.Schema} schema - Joi schema to validate against
 * @returns {Function} Express middleware
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,   // Return all validation errors at once
    stripUnknown: true,  // Remove unknown fields from req.body
  });

  if (error) {
    const details = error.details.map((d) => d.message).join(", ");
    return sendError(res, `Validation error: ${details}`, 422);
  }

  req.body = value; // Use sanitized/coerced values
  next();
};

// ─── Schemas ─────────────────────────────────────────────────────────────────

const schemas = {
  register: Joi.object({
    name: Joi.string().trim().max(100).required(),
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().min(8).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().required(),
    password: Joi.string().required(),
  }),

  sendOTP: Joi.object({
    // E.164 format: + followed by 7–15 digits
    phone: Joi.string()
      .pattern(/^\+[1-9]\d{6,14}$/)
      .required()
      .messages({
        "string.pattern.base": "Phone must be in E.164 format (e.g. +14155552671)",
      }),
  }),

  verifyOTP: Joi.object({
    phone: Joi.string()
      .pattern(/^\+[1-9]\d{6,14}$/)
      .required(),
    otp: Joi.string()
      .length(parseInt(process.env.OTP_LENGTH) || 6)
      .pattern(/^\d+$/)
      .required()
      .messages({
        "string.length": `OTP must be ${process.env.OTP_LENGTH || 6} digits`,
        "string.pattern.base": "OTP must contain only digits",
      }),
  }),
};

module.exports = { validate, schemas };
