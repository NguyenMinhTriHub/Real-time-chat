const messageRepository = require("../repositories/messageRepository");
const roomRepository = require("../repositories/roomRepository");

class MessageService {
  /**
   * @param {Object} socketHandler - Instance để gửi thông báo real-time
   */
  constructor(socketHandler) {
    this.socketHandler = socketHandler;
  }

  /**
   * Xóa tin nhắn (Xóa mềm) và cập nhật trạng thái phòng
   */
  async deleteMessage(messageId, userId) {
    const message = await messageRepository.findById(messageId);
    if (!message) throw new Error("NOT_FOUND");

    // Kiểm tra quyền sở hữu tin nhắn
    if (message.senderId !== userId) throw new Error("FORBIDDEN");

    // Thực hiện xóa mềm trong DB
    await messageRepository.softDelete(messageId);

    // Cập nhật lại tin nhắn cuối cùng (lastMessage) của phòng
    await this.updateRoomLastMessageAfterDelete(message.roomId, messageId);

    // Phát tín hiệu xóa tin nhắn tới các client đang kết nối
    if (this.socketHandler && this.socketHandler.handleMessageDeleted) {
      await this.socketHandler.handleMessageDeleted(messageId, message.roomId);
    }

    return message;
  }

  /**
   * Tìm lại tin nhắn mới nhất sau khi tin nhắn cuối cùng bị xóa
   */
  async updateRoomLastMessageAfterDelete(roomId, deletedMessageId) {
    try {
      const lastMessage = await messageRepository
        .findOne({
          roomId,
          deletedAt: null,
          _id: { $ne: deletedMessageId },
        })
        .sort({ createdAt: -1 });

      await roomRepository.update(roomId, {
        lastMessage: lastMessage ? lastMessage._id : null,
      });
    } catch (error) {
      console.error("Error updating lastMessage:", error);
    }
  }

  /**
   * Lấy lịch sử tin nhắn với phân trang Cursor
   */
  async getMessages(roomId, userId, cursor, limit = 20) {
    const room = await roomRepository.findOne({ _id: roomId, members: userId });
    if (!room) throw new Error("FORBIDDEN");

    return await messageRepository.findByRoomId(roomId, cursor, limit);
  }

  /**
   * Tạo tin nhắn mới và cập nhật trạng thái phòng
   */
  async createMessage(roomId, senderId, messageData) {
    const room = await roomRepository.findOne({
      _id: roomId,
      members: senderId,
    });
    if (!room) throw new Error("FORBIDDEN");

    const message = await messageRepository.create({
      roomId,
      senderId,
      ...messageData,
    });

    // Cập nhật lastMessage cho phòng chat
    await roomRepository.update(roomId, {
      lastMessage: message._id,
      updatedAt: new Date(),
    });

    return message;
  }

  async markMessageAsRead(messageId, userId) {
    return await messageRepository.markAsRead(messageId, userId);
  }
}

module.exports = MessageService;
