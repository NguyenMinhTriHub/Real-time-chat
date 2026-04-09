const roomRepository = require("../repositories/roomRepository");
const minioService = require("../services/minioService");
const ErrorHandler = require("../utils/errorHandler");
const multer = require("multer");
const path = require("path");

class MessageController {
  constructor(messageService) {
    this.messageService = messageService;
  }

  /**
   * Lấy lịch sử tin nhắn (Cursor Pagination)
   * GET /api/chat/rooms/:roomId/messages
   */
  async getMessages(req, res) {
    try {
      const { roomId } = req.params;
      const { cursor, limit = 20 } = req.query; // Mặc định limit 20 theo đặc tả [cite: 201]
      const userId = req.user.id;

      const result = await this.messageService.getMessages(
        roomId,
        userId,
        cursor,
        limit,
      );

      res.json({
        success: true,
        data: result,
        error: null,
        message: "Messages retrieved successfully",
      });
    } catch (error) {
      console.error("Get messages error:", error);
      const errorInfo = ErrorHandler.handleBusinessError(error);
      res
        .status(errorInfo.statusCode)
        .json(
          ErrorHandler.formatErrorResponse(
            errorInfo.errorCode,
            errorInfo.message,
          ),
        );
    }
  }

  /**
   * Upload file/ảnh vào phòng chat
   * POST /api/chat/rooms/:roomId/upload
   */
  async uploadFile(req, res) {
    try {
      const { roomId } = req.params;
      const userId = req.user.id;

      // 1. Kiểm tra quyền thành viên phòng
      const room = await roomRepository.findOne({
        _id: roomId,
        members: userId,
      });
      if (!room) {
        return res
          .status(403)
          .json(
            ErrorHandler.formatErrorResponse(
              "FORBIDDEN",
              "User is not a member of this room",
            ),
          );
      }

      if (!req.file) {
        return res
          .status(400)
          .json(
            ErrorHandler.formatErrorResponse(
              "VALIDATION_ERROR",
              "No file provided",
            ),
          );
      }

      // 2. Sửa lỗi mã hóa tên file (UTF-8) và áp dụng PascalCase
      const originalNameUtf8 = Buffer.from(
        req.file.originalname,
        "latin1",
      ).toString("utf8");

      // 3. Gọi service để upload lên MinIO
      const mediaUrl = await minioService.uploadFile(
        req.file.buffer,
        originalNameUtf8,
        req.file.mimetype,
      );

      // 4. Trả về kết quả theo cấu trúc đặc tả [cite: 215-220]
      res.json({
        success: true,
        data: {
          mediaUrl,
          fileType: req.file.mimetype,
          fileSize: req.file.size,
        },
        error: null,
        message: "File uploaded successfully",
      });
    } catch (error) {
      console.error("Upload file error:", error);
      res
        .status(500)
        .json(
          ErrorHandler.formatErrorResponse(
            "INTERNAL_ERROR",
            "File upload failed",
          ),
        );
    }
  }

  /**
   * Xóa tin nhắn (Soft Delete)
   * DELETE /api/chat/messages/:messageId
   */
  async deleteMessage(req, res) {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;

      await this.messageService.deleteMessage(messageId, userId);

      res.json({
        success: true,
        data: null,
        error: null,
        message: "Message deleted successfully",
      });
    } catch (error) {
      console.error("Delete message error:", error);
      const errorInfo = ErrorHandler.handleBusinessError(error);
      res
        .status(errorInfo.statusCode)
        .json(
          ErrorHandler.formatErrorResponse(
            errorInfo.errorCode,
            errorInfo.message,
          ),
        );
    }
  }
}

// Cấu hình Multer: Giới hạn 10MB theo đặc tả [cite: 213, 221]
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

module.exports = {
  MessageController,
  upload: upload.single("image"), // Sử dụng field 'image' như index.js
};
