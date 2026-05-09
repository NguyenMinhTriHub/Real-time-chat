const messageRepository = require("../repositories/messageRepository");
const roomRepository = require("../repositories/roomRepository");
const ErrorHandler = require("../utils/errorHandler");
const { getRedisClient } = require("../config/redis");

class MessageService {
    /**
     * @param {Object} socketHandler - Instance để gửi thông báo real-time
     */
    constructor(socketHandler) {
        this.socketHandler = socketHandler;
    }

    async publishEvent(eventType, payload) {
        await ErrorHandler.handleRedisOperation(async() => {
            const redisClient = getRedisClient();
            await redisClient.publish(eventType, JSON.stringify(payload));
        });
    }

    /**
     * Xóa tin nhắn (Xóa mềm) [cite: UC10]
     * Đánh dấu deletedAt thay vì xóa khỏi DB
     */
    async deleteMessage(messageId, userId) {
        try {
            const message = await messageRepository.findById(messageId);
            if (!message) {
                console.error(`Message not found: ${messageId}`);
                throw new Error("NOT_FOUND");
            }

            // Nếu tin nhắn đã bị xóa mềm thì không thể xóa lại
            if (message.deletedAt) {
                console.warn(`Attempt to delete already deleted message: ${messageId}`);
                throw new Error("ALREADY_DELETED");
            }

            // Kiểm tra quyền sở hữu tin nhắn
            if (message.senderId !== userId) {
                console.error(
                    `Permission denied: User ${userId} cannot delete message ${messageId} (owner: ${message.senderId})`,
                );
                throw new Error("FORBIDDEN");
            }

            // Thực hiện xóa mềm trong DB
            const deletedMessage = await messageRepository.softDelete(messageId);

            // Cập nhật lại tin nhắn cuối cùng (lastMessage) của phòng
            await this.updateRoomLastMessageAfterDelete(message.roomId, messageId);

            // Phát tín hiệu xóa tin nhắn tới các client đang kết nối
            if (this.socketHandler && this.socketHandler.handleMessageDeleted) {
                await this.socketHandler.handleMessageDeleted(
                    messageId,
                    message.roomId,
                );
            }

            await this.publishEvent("message_deleted", {
                messageId: message._id.toString(),
                roomId: message.roomId.toString(),
                userId,
                deletedAt: new Date().toISOString(),
            });

            return deletedMessage;
        } catch (error) {
            console.error(
                `deleteMessage error: ${error.message} (messageId: ${messageId}, userId: ${userId})`,
            );
            throw error;
        }
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
     * Lấy lịch sử tin nhắn với phân trang Cursor [cite: UC06]
     * Sử dụng createdAt làm con trỏ
     */
    async getMessages(roomId, userId, cursor, limit = 20) {
        try {
            const room = await roomRepository.findOne({
                _id: roomId,
                members: userId,
            });
            if (!room) {
                console.error(
                    `Access denied: User ${userId} not member of room ${roomId}`,
                );
                throw new Error("FORBIDDEN");
            }

            const messages = await messageRepository.findByRoomId(
                roomId,
                cursor,
                limit,
            );

            console.log(
                `✓ Messages loaded for room ${roomId}: ${messages.messages.length} messages (cursor: ${cursor || "start"}, limit: ${limit})`,
            );

            return messages;
        } catch (error) {
            console.error(
                `getMessages error: ${error.message} (roomId: ${roomId}, userId: ${userId}, cursor: ${cursor})`,
            );
            throw error;
        }
    }

    /**
     * Tạo tin nhắn mới [cite: UC07]
     * Cập nhật lastMessage và phát sự kiện real-time
     */
    async createMessage(roomId, senderId, messageData) {
        try {
            const room = await roomRepository.findOne({
                _id: roomId,
                members: senderId,
            });
            if (!room) {
                console.error(
                    `Access denied: User ${senderId} not member of room ${roomId}`,
                );
                throw new Error("FORBIDDEN");
            }

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

            console.log(
                `✓ Message created: ${message._id} in room ${roomId} by user ${senderId}`,
            );

            await this.publishEvent("new_message", {
                messageId: message._id.toString(),
                roomId: roomId.toString(),
                senderId,
                type: message.type,
                content: message.content,
                mediaUrls: message.mediaUrls,
                fileName: message.fileName || null,
                replyTo: message.replyTo || null,
                createdAt: message.createdAt.toISOString(),
            });

            return message;
        } catch (error) {
            console.error(
                `createMessage error: ${error.message} (roomId: ${roomId}, senderId: ${senderId})`,
            );
            throw error;
        }
    }

    async markMessageAsRead(messageId, userId) {
        return await messageRepository.markAsRead(messageId, userId);
    }
}

module.exports = MessageService;