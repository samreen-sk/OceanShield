const User = require("../models/userModel");
const asyncHandler = require("../utils/asyncHandler");
const { successResponse, errorResponse } = require("../utils/apiResponse");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken
} = require("../utils/generateToken");
const { ROLES } = require("../config/constants");

/**
 * Register a new Citizen user
 * POST /api/v1/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return errorResponse(res, "An account with this email address already exists", 409);
  }

  // Create new user (Citizen role is default; role cannot be injected via registration)
  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash: password,
    role: ROLES.CITIZEN
  });

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  return successResponse(
    res,
    "Citizen registered successfully",
    {
      user: user.toPublicJSON(),
      tokens: {
        accessToken,
        refreshToken
      }
    },
    201
  );
});

/**
 * Log in an existing user
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user and explicitly include passwordHash for verification
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");

  if (!user) {
    return errorResponse(res, "Invalid email or password", 401);
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return errorResponse(res, "Invalid email or password", 401);
  }

  const accessToken = generateAccessToken(user._id, user.role);
  const refreshToken = generateRefreshToken(user._id);

  return successResponse(
    res,
    "Login successful",
    {
      user: user.toPublicJSON(),
      tokens: {
        accessToken,
        refreshToken
      }
    },
    200
  );
});

/**
 * Get current authenticated user profile
 * GET /api/v1/auth/me
 */
const getMe = asyncHandler(async (req, res) => {
  return successResponse(res, "User profile retrieved successfully", {
    user: req.user.toPublicJSON()
  });
});

/**
 * Refresh access token using refresh token
 * POST /api/v1/auth/refresh
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return errorResponse(res, "Refresh token is required", 400);
  }

  try {
    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return errorResponse(res, "User no longer exists", 401);
    }

    const newAccessToken = generateAccessToken(user._id, user.role);
    const newRefreshToken = generateRefreshToken(user._id);

    return successResponse(res, "Token refreshed successfully", {
      tokens: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return errorResponse(res, "Refresh token is invalid or has expired", 401);
  }
});

/**
 * Logout user (client-side token invalidation confirmation)
 * POST /api/v1/auth/logout
 */
const logout = asyncHandler(async (req, res) => {
  return successResponse(res, "User logged out successfully");
});

module.exports = {
  register,
  login,
  getMe,
  refreshToken,
  logout
};
