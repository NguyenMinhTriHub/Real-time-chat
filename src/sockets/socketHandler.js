const Message = require("../models/Message");
const Room = require("../models/Room");
const axios = require("axios");

module.exports = (io) => {
  io.on("connection", async (socket) => {
    const token = socket.handshake.auth.token;
    let userData = null;

    try {
      // Gọi Auth Service xác thực
      const authRes = await axios.post(
        `${process.env.AUTH_SERVICE_URL}`,
        { token },
        { timeout: 3000 },
      );
      userData = authRes.data.data;
    } catch (err) {
      return socket.disconnect();
    }

    socket.on("send_message", async (data) => {
      try {
        // MỚI THÊM: Tạo object tin nhắn để emit ngay lập tức (Real-time, không block)
        const messagePayload = {
          roomId: data.roomId,
          senderId: userData.userId,
          content: data.content,
          type: data.type || "text",
          mediaUrls: data.mediaUrls || [],
        };

        // MỚI THÊM: Phát tin nhắn ngay cho client (không đợi DB)
        io.to(data.roomId).emit("new_message", { message: messagePayload });

        // MỚI THÊM: Lưu vào Database bất đồng bộ (Non-blocking) - không block luồng gửi tin nhắn Real-time
        // Sử dụng setImmediate để đẩy vào macrotask queue, để các sự kiện socket khác được xử lý trước
        setImmediate(async () => {
          try {
            const newMessage = await Message.create(messagePayload);

            // Cập nhật lastMessage bằng ID sau khi lưu thành công
            await Room.findByIdAndUpdate(data.roomId, {
              lastMessage: newMessage._id,
              updatedAt: new Date(), // MỚI THÊM: Cập nhật timestamp phòng chat
            });
          } catch (dbError) {
            console.error("Error saving message to DB:", dbError);
            // MỚI THÊM: Phát sự kiện lỗi cho client nếu cần (không ảnh hưởng đến real-time)
            io.to(data.roomId).emit("message_db_error", {
              error: "Message received but failed to save to database",
            });
          }
        });
      } catch (err) {
        console.error("Send message error:", err);
        socket.emit("message_error", { error: "SERVER_ERROR" });
      }
    });

    socket.on("join_room", ({ roomId }) => {
      socket.join(roomId);
      socket.emit("room_joined", { roomId });
    });
  });
};
