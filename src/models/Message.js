const mongoose = require("mongoose");

/**
 * Schema cho tin nhắn (Messages)
 * Lưu trữ nội dung, người gửi, loại tin nhắn và liên kết phương tiện
 */
const messageSchema = new mongoose.Schema(
  {
    // ID của phòng chat chứa tin nhắn này
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    // ID của người gửi (từ Auth Service/PostgreSQL)
    senderId: { type: String, required: true },
    // Loại tin nhắn: văn bản, hình ảnh, tệp tin hoặc thông báo hệ thống
    type: {
      type: String,
      enum: ["text", "image", "file", "system"],
      required: true,
    },
    // Nội dung tin nhắn văn bản
    content: { type: String },
    // Danh sách các URL phương tiện (từ MinIO)
    mediaUrls: [{ type: String }],
    // Thời điểm xóa (dùng cho tính năng xóa mềm - Soft Delete)
    deletedAt: { type: Date, default: null },
  },
  {
    // Tự động tạo createdAt và updatedAt
    timestamps: true,
  },
);

module.exports = mongoose.model("Message", messageSchema);
