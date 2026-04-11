const axios = require("axios");

class AuthService {
  /**
   * Xác thực Token thông qua Auth Service nội bộ
   * @param {string} token - JWT Token từ client
   */
  static async verifyToken(token) {
    try {
      // Sử dụng URL nội bộ giữa các container Docker
      const authUrl =
        process.env.AUTH_SERVICE_URL ||
        "http://auth-service:3001/api/auth/verify";

      const response = await axios.post(
        authUrl,
        {
          token,
        },
        {
          timeout: 3000, // Giới hạn 3 giây theo đặc tả
        },
      );

      if (response.data.success) {
        return response.data.data; // Trả về { userId, email, role }
      } else {
        // Xử lý các mã lỗi nghiệp vụ cụ thể
        if (response.data.error === "TOKEN_BLACKLISTED") {
          const error = new Error("Token has been blacklisted");
          error.code = "TOKEN_BLACKLISTED";
          throw error;
        }
        throw new Error(response.data.error || "Token verification failed");
      }
    } catch (error) {
      console.error("Auth service connection error:", error.message);

      // Xử lý lỗi timeout hoặc mất kết nối
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        const timeoutError = new Error("Auth service timeout");
        timeoutError.code = "SERVICE_UNAVAILABLE";
        throw timeoutError;
      }

      throw error;
    }
  }
}

module.exports = AuthService;
