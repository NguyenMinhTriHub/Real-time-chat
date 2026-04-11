const mongoose = require("mongoose");

/**
 * Schema cho phòng chat (Rooms)
 * Quản lý loại phòng, tên nhóm, danh sách thành viên và tin nhắn cuối cùng
 */
const roomSchema = new mongoose.Schema(
  {
    // Loại phòng: direct (chat 1-1) hoặc group (chat nhóm)
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    // Tên phòng (bắt buộc cho Group, nullable cho Direct)
    name: { type: String },
    // Danh sách ID các thành viên tham gia phòng
    members: [{ type: String, required: true }],
    // Tham chiếu đến tin nhắn cuối cùng để hiển thị ở danh sách phòng
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    // Tự động tạo createdAt và updatedAt
    timestamps: true,
  },
);

module.exports = mongoose.model("Room", roomSchema);
