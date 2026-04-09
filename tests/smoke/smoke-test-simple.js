import ws from "k6/ws";
import { check } from "k6";

// Cấu hình kiểm thử: 10 người dùng ảo chạy trong 20 giây
export const options = {
  vus: 10,
  duration: "20s",
};

export default function () {
  // URL bắt tay Socket.io theo đặc tả EIO=4
  const url = "ws://localhost:3002/socket.io/?EIO=4&transport=websocket";

  const res = ws.connect(url, null, function (socket) {
    socket.on("open", () => {
      // Gửi mã "40" để bắt đầu kết nối Socket.io
      socket.send("40");

      // Gửi mã "42" kèm theo nội dung tin nhắn theo chuẩn Socket.io
      socket.send('42["message", "Hello from k6 Smoke Test"]');

      socket.close();
    });

    socket.on("error", (e) => {
      console.error("❌ Lỗi kết nối Socket.io:", e.error());
    });
  });

  // Xác nhận kết nối thành công
  check(res, { "Kết nối thành công (101)": (r) => r && r.status === 101 });
}
