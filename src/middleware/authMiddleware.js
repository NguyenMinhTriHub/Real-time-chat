const AuthService = require("../services/authService");
const ErrorHandler = require("../utils/errorHandler");

/**
 * Middleware xác thực cho các yêu cầu HTTP
 * Kiểm tra Bearer Token và xác thực qua Auth Service nội bộ
 */
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res
        .status(401)
        .json(
          ErrorHandler.formatErrorResponse(
            "TOKEN_MISSING",
            "Authorization header is required",
          ),
        );
    }

    const tokenParts = authHeader.split(" ");
    const token = tokenParts[1];
    if (!token) {
      return res
        .status(401)
        .json(
          ErrorHandler.formatErrorResponse(
            "TOKEN_INVALID",
            "Bearer token is missing",
          ),
        );
    }

    const userData = await AuthService.verifyToken(token);
    req.user = {
      id: userData.userId || userData.id,
      ...userData,
    };
    next();
  } catch (error) {
    const authError = ErrorHandler.handleAuthError(error);
    res
      .status(authError.statusCode)
      .json(
        ErrorHandler.formatErrorResponse(
          authError.errorCode,
          authError.message,
        ),
      );
  }
};
