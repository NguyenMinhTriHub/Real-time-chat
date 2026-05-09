const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");

/**
 * Auth Controller - Xử lý các yêu cầu liên quan đến xác thực
 * Theo Đặc tả v4.0
 */
class AuthController {
    /**
     * Làm mới Access Token từ Refresh Token
     * POST /api/auth/refresh
     * @param {Object} req - Express request
     * @param {Object} res - Express response
     */
    async refreshToken(req, res) {
        try {
            const { refreshToken } = req.body;

            // Kiểm tra refreshToken có tồn tại
            if (!refreshToken) {
                return res
                    .status(400)
                    .json(
                        ErrorHandler.formatErrorResponse(
                            "REFRESH_TOKEN_MISSING",
                            "Refresh token is required",
                        ),
                    );
            }

            const secret = process.env.JWT_SECRET;
            if (!secret) {
                console.error("CRITICAL: JWT_SECRET is not configured");
                return res
                    .status(500)
                    .json(
                        ErrorHandler.formatErrorResponse(
                            "CONFIG_ERROR",
                            "Server configuration error",
                        ),
                    );
            }

            // Xác thực Refresh Token
            let decoded;
            try {
                decoded = jwt.verify(refreshToken, secret);
            } catch (error) {
                // Token không hợp lệ hoặc đã hết hạn
                if (error.name === "TokenExpiredError") {
                    return res
                        .status(401)
                        .json(
                            ErrorHandler.formatErrorResponse(
                                "REFRESH_TOKEN_EXPIRED",
                                "Refresh token has expired",
                            ),
                        );
                }
                return res
                    .status(401)
                    .json(
                        ErrorHandler.formatErrorResponse(
                            "REFRESH_TOKEN_INVALID",
                            "Invalid refresh token",
                        ),
                    );
            }

            // Kiểm tra token type có phải refresh token không
            if (decoded.type !== "refresh") {
                return res
                    .status(401)
                    .json(
                        ErrorHandler.formatErrorResponse(
                            "REFRESH_TOKEN_INVALID",
                            "Token is not a refresh token",
                        ),
                    );
            }

            // Kiểm tra userId có tồn tại trong token
            if (!decoded.userId) {
                return res
                    .status(401)
                    .json(
                        ErrorHandler.formatErrorResponse(
                            "REFRESH_TOKEN_INVALID",
                            "Invalid refresh token payload",
                        ),
                    );
            }

            // Tạo Access Token mới
            const newAccessToken = jwt.sign({
                    userId: decoded.userId,
                    email: decoded.email || "",
                    role: decoded.role || "user",
                },
                secret, {
                    expiresIn: "1h", // Access token hết hạn sau 1 giờ theo đặc tả v4.0
                },
            );

            // Tạo Refresh Token mới (optional, có thể để token cũ vẫn sử dụng được)
            const newRefreshToken = jwt.sign({
                    userId: decoded.userId,
                    email: decoded.email || "",
                    type: "refresh",
                },
                secret, {
                    expiresIn: "7d", // Refresh token hết hạn sau 7 ngày
                },
            );

            // Trả về response theo định dạng v4.0
            return res.json({
                success: true,
                data: {
                    accessToken: newAccessToken,
                    refreshToken: newRefreshToken,
                },
                error: null,
                message: "Token refreshed successfully",
            });
        } catch (error) {
            console.error("Refresh token error:", error);
            return res
                .status(500)
                .json(
                    ErrorHandler.formatErrorResponse(
                        "INTERNAL_SERVER_ERROR",
                        "An error occurred while refreshing token",
                    ),
                );
        }
    }
}

module.exports = AuthController;