const express = require("express");
const router = express.Router();
const {
  register,
  login,
  getMe,
  refreshToken,
  logout
} = require("../controllers/authController");
const { authenticate } = require("../middleware/authMiddleware");
const { authLimiter } = require("../middleware/rateLimitMiddleware");
const {
  validateRegisterInput,
  validateLoginInput
} = require("../validators/authValidator");

// Public endpoints with strict brute-force rate limiter
router.post("/register", authLimiter, validateRegisterInput, register);
router.post("/login", authLimiter, validateLoginInput, login);
router.post("/refresh", refreshToken);

// Protected endpoints
router.get("/me", authenticate, getMe);
router.post("/logout", authenticate, logout);

module.exports = router;
