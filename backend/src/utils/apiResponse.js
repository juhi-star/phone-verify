/**
 * Standardized API response helpers.
 * All responses follow the shape: { success, message, data?, error? }
 */

/**
 * Send a successful response
 * @param {Response} res - Express response object
 * @param {string} message - Human-readable success message
 * @param {object} data - Response payload
 * @param {number} statusCode - HTTP status code (default 200)
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  const response = { success: true, message };
  if (data !== null) response.data = data;
  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Response} res - Express response object
 * @param {string} message - Human-readable error message
 * @param {number} statusCode - HTTP status code (default 400)
 * @param {string|null} error - Detailed error info (only in dev)
 */
const sendError = (res, message, statusCode = 400, error = null) => {
  const response = { success: false, message };
  if (error && process.env.NODE_ENV === "development") {
    response.error = error;
  }
  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess, sendError };
