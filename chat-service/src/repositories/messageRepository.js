const Message = require("../models/Message");

class MessageRepository {
  /**
   * Tìm tin nhắn theo ID
   */
  async findById(id) {
    return await Message.findById(id);
  }

  /**
   * Tìm tin nhắn trong phòng với Phân trang Cursor (Cursor Pagination)
   * Đáp ứng đặc tả 6.2 về tải lịch sử tin nhắn
   */
  async findByRoomId(roomId, cursor, limit = 20) {
    let query = { roomId, deletedAt: null }; // Chỉ lấy tin nhắn chưa bị xóa mềm

    // Nếu có cursor, lấy các tin nhắn cũ hơn thời điểm của cursor
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) // Lấy mới nhất trước
      .limit(parseInt(limit))
      .populate("roomId", "name type"); // Lấy thông tin phòng nếu cần

    // Đảo ngược lại để hiển thị theo thứ tự thời gian tăng dần trên UI
    messages.reverse();

    // Xác định con trỏ tiếp theo cho lần load tiếp theo
    const nextCursor =
      messages.length > 0 ? messages[0].createdAt.toISOString() : null;

    return {
      messages,
      nextCursor,
      hasMore: messages.length >= limit,
    };
  }

  /**
   * Tìm một tin nhắn theo điều kiện bất kỳ
   */
  async findOne(query) {
    return await Message.findOne(query);
  }

  /**
   * Tạo tin nhắn mới
   */
  async create(messageData) {
    const message = new Message(messageData);
    return await message.save();
  }

  /**
   * Cập nhật tin nhắn
   */
  async update(id, updateData) {
    return await Message.findByIdAndUpdate(id, updateData, { new: true });
  }

  /**
   * Xóa mềm tin nhắn (Soft Delete)
   * Đáp ứng đặc tả UC10: đánh dấu deletedAt thay vì xóa khỏi DB
   */
  async softDelete(id) {
    return await Message.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true },
    );
  }

  /**
   * Đánh dấu tin nhắn đã được đọc bởi người dùng
   */
  async markAsRead(messageId, userId) {
    // Sử dụng $addToSet để đảm bảo không bị trùng lặp ID trong mảng readBy
    return await Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { readBy: userId } },
      { new: true },
    );
  }
}

module.exports = new MessageRepository();
