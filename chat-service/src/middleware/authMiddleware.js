const axios = require("axios");

/**
 * Middleware xác thực cho các yêu cầu HTTP
 * Kiểm tra Bearer Token và xác thực qua Auth Service nội bộ
 */
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, error: "TOKEN_MISSING" });
    }

    const token = authHeader.split(" ")[1];

    // Gọi sang Auth Service (Internal Endpoint) theo đặc tả
    const response = await axios.post(
      "http://auth-service:3001/api/auth/verify",
      { token },
    );

    if (response.data.success) {
      // Đính kèm thông tin user vào request để các Controller sử dụng
      req.user = response.data.data;
      next();
    } else {
      res.status(401).json({ success: false, error: "TOKEN_INVALID" });
    }
  } catch (error) {
    // Xử lý lỗi khi không thể kết nối tới Auth Service
    res.status(401).json({ success: false, error: "AUTH_SERVICE_UNREACHABLE" });
  }
};
