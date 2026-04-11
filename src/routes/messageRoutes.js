const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

/**
 * Định nghĩa các tuyến đường cho Message
 * @param {Object} messageController - Instance của MessageController đã được khởi tạo
 * @param {Middleware} uploadMiddleware - Middleware Multer để xử lý tải tệp
 */
module.exports = (messageController, uploadMiddleware) => {
  const router = express.Router();

  // Tất cả các tuyến đường nhắn tin đều yêu cầu xác thực JWT
  router.use(authMiddleware);

  // Lấy lịch sử tin nhắn trong phòng (Phân trang cursor)
  // GET /api/chat/rooms/:roomId/messages
  router.get(
    "/rooms/:roomId/messages",
    messageController.getMessages.bind(messageController),
  );

  // Tải lên tệp/ảnh đính kèm vào phòng chat
  // POST /api/chat/rooms/:roomId/upload
  // Sử dụng uploadMiddleware để xử lý field "file" (max 10MB) theo đặc tả [cite: 213]
  router.post(
    "/rooms/:roomId/upload",
    uploadMiddleware,
    messageController.uploadFile.bind(messageController),
  );

  // Xóa tin nhắn (Xóa mềm - Soft Delete)
  // DELETE /api/chat/messages/:messageId
  router.delete(
    "/messages/:messageId",
    messageController.deleteMessage.bind(messageController),
  );

  return router;
};
