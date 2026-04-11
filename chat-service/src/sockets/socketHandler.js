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
        const newMessage = await Message.create({
          roomId: data.roomId,
          senderId: userData.userId,
          content: data.content,
          type: data.type || "text",
        });

        // Cập nhật lastMessage bằng ID
        await Room.findByIdAndUpdate(data.roomId, {
          lastMessage: newMessage._id,
        });

        io.to(data.roomId).emit("new_message", { message: newMessage });
      } catch (err) {
        socket.emit("message_error", { error: "SERVER_ERROR" });
      }
    });

    socket.on("join_room", ({ roomId }) => {
      socket.join(roomId);
      socket.emit("room_joined", { roomId });
    });
  });
};
