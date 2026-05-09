const express = require("express");
const AuthController = require("../controllers/authController");

/**
 * Auth Routes - Định tuyến cho các yêu cầu xác thực
 * Theo Đặc tả v4.0
 */
const router = express.Router();
const authController = new AuthController();

/**
 * Làm mới Access Token
 * POST /api/auth/refresh
 * Body: { refreshToken: "..." }
 * Response: { success: true, data: { accessToken: "...", refreshToken: "..." } }
 */
router.post("/refresh", authController.refreshToken.bind(authController));

module.exports = router;