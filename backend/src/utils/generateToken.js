const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * Generate Access Token (short-lived)
 * @param {string} userId User ID
 * @param {string} role User role ('CITIZEN' | 'ADMIN')
 * @returns {string} JWT Token
 */
const generateAccessToken = (userId, role) => {
  return jwt.sign(
    {
      userId,
      role
    },
    env.JWT_SECRET,
    {
      expiresIn: env.JWT_EXPIRES_IN
    }
  );
};

/**
 * Generate Refresh Token (longer-lived)
 * @param {string} userId User ID
 * @returns {string} JWT Refresh Token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    {
      userId
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN
    }
  );
};

/**
 * Verify Refresh Token
 * @param {string} token Refresh token
 * @returns {object} Decoded payload
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
};
