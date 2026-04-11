const jwt = require("jsonwebtoken");

/**
 * Kiểm tra tính an toàn của JWT Secret
 */
const validateJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  // Kiểm tra secret phải tồn tại và có độ dài tối thiểu 32 ký tự
  if (!secret || typeof secret !== "string" || secret.trim().length < 32) {
    console.error("CRITICAL: JWT_SECRET_INSECURE");
    throw new Error("CRITICAL: JWT_SECRET_INSECURE");
  }
  return secret;
};

/**
 * Middleware xác thực kết nối Socket.IO bằng JWT
 */
const socketAuthMiddleware = async (socket, next) => {
  try {
    const secret = validateJwtSecret();

    // SỬA LỖI: Viết liền toán tử ?. (không có khoảng trắng)
    const token =
      socket.handshake && socket.handshake.auth
        ? socket.handshake.auth.token
        : undefined;

    if (!token || typeof token !== "string" || token.trim().length === 0) {
      const err = new Error("Token is required");
      err.code = 401;
      err.type = "AUTH_FAILED";
      return next(err);
    }

    // Xác thực Token với thuật toán HS256
    jwt.verify(token, secret, { algorithms: ["HS256"] }, (error, decoded) => {
      if (error) {
        const err = new Error("Auth token invalid or expired");
        err.code = 401;
        err.type = "AUTH_FAILED";
        return next(err);
      }

      // Lấy userId từ payload của token
      const userId = decoded.userId || decoded.id;
      if (!userId) {
        const err = new Error("Auth token missing userId");
        err.code = 401;
        err.type = "AUTH_FAILED";
        return next(err);
      }

      // Lưu thông tin user vào socket data để sử dụng ở socketHandler
      socket.data = socket.data || {};
      socket.data.user = {
        id: userId,
        roles: decoded.roles || [],
      };

      return next();
    });
  } catch (error) {
    const err = new Error("Auth initialization failed");
    err.code = 401;
    err.type = "AUTH_FAILED";
    return next(err);
  }
};

module.exports = socketAuthMiddleware;
