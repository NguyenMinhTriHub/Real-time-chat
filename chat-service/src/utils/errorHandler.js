/**
 * Error Handler Layer - Tách biệt logic xử lý lỗi để dễ debug
 * Theo Đặc tả v4.0.1 - Mục 9.3 Reliability
 */

class ErrorHandler {
  /**
   * Xử lý lỗi authentication với logic đặc biệt cho TOKEN_BLACKLISTED
   * Hỗ trợ cả ngữ cảnh HTTP và WebSocket
   */
  static handleAuthError(error, context = "http") {
    let statusCode = 401;
    let errorCode = "UNAUTHORIZED";
    let message = error.message;

    // Xử lý các mã lỗi cụ thể từ Auth Service
    if (error.code === "TOKEN_BLACKLISTED") {
      statusCode = 401;
      errorCode = "TOKEN_BLACKLISTED";
      message = "Token has been blacklisted";

      // Đối với WebSocket, cần thêm tín hiệu để ngắt kết nối ngay lập tức
      if (context === "websocket") {
        return {
          shouldDisconnect: true,
          response: { message, code: errorCode },
        };
      }
    } else if (error.code === "SERVICE_UNAVAILABLE") {
      statusCode = 503;
      errorCode = "SERVICE_UNAVAILABLE";
      message = "Authentication service temporarily unavailable";
    }

    return {
      statusCode,
      errorCode,
      message,
      shouldDisconnect: false,
    };
  }

  /**
   * Xử lý lỗi Redis với logic dự phòng (fallback)
   * Theo Mục 9.3: Nếu Redis gặp sự cố, hệ thống vẫn cố gắng hoạt động
   */
  static async handleRedisOperation(operation, fallback = null) {
    try {
      return await operation();
    } catch (error) {
      console.warn("⚠️ Redis operation failed, using fallback:", error.message);

      // Thực thi hàm fallback nếu được cung cấp (ví dụ: truy vấn trực tiếp DB)
      if (fallback) {
        try {
          return await fallback();
        } catch (fallbackError) {
          console.error(
            "❌ Fallback operation also failed:",
            fallbackError.message,
          );
        }
      }

      // Trả về null để báo hiệu Redis không khả dụng nhưng không làm dừng ứng dụng
      return null;
    }
  }

  /**
   * Xử lý lỗi phát sinh từ các thao tác với Database (MongoDB)
   */
  static handleDatabaseError(error) {
    console.error("❌ Database operation error:", error);

    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";
    let message = "Database operation failed";

    // Phân loại lỗi dựa trên đặc điểm của Mongoose
    if (error.name === "ValidationError") {
      statusCode = 400;
      errorCode = "VALIDATION_ERROR";
      message = "Invalid data provided";
    } else if (error.name === "CastError") {
      statusCode = 400;
      errorCode = "VALIDATION_ERROR";
      message = "Invalid ID format";
    }

    return { statusCode, errorCode, message };
  }

  /**
   * Xử lý các lỗi logic nghiệp vụ (Business Logic)
   */
  static handleBusinessError(error) {
    let statusCode = 500;
    let errorCode = "INTERNAL_ERROR";
    let message = error.message || "Business logic error";

    // Chuyển đổi các thông điệp lỗi thành mã trạng thái HTTP tương ứng
    switch (error.message) {
      case "NOT_FOUND":
        statusCode = 404;
        errorCode = "NOT_FOUND";
        message = "Resource not found";
        break;
      case "FORBIDDEN":
        statusCode = 403;
        errorCode = "FORBIDDEN";
        message = "Access denied";
        break;
      case "VALIDATION_ERROR":
        statusCode = 400;
        errorCode = "VALIDATION_ERROR";
        message = "Invalid input data";
        break;
    }

    return { statusCode, errorCode, message };
  }

  /**
   * Định dạng phản hồi lỗi (Error Response Formatter)
   * Đảm bảo cấu trúc JSON đồng nhất: { success, data, error, message }
   */
  static formatErrorResponse(errorCode, message, data = null) {
    return {
      success: false,
      data,
      error: errorCode,
      message,
    };
  }

  /**
   * Định dạng phản hồi thành công (Success Response Formatter)
   */
  static formatSuccessResponse(data, message = "Operation successful") {
    return {
      success: true,
      data,
      error: null,
      message,
    };
  }
}

module.exports = ErrorHandler;
