import ws from "k6/ws";
import { check } from "k6";

// Cấu hình kiểm thử: 1 người dùng ảo (VU) chạy trong 5 giây
export const options = {
  vus: 1,
  duration: "5s",
};

export default function () {
  // URL của Chat Service (Port 3002)
  const url = "ws://localhost:3002";
  const params = { tags: { my_tag: "smoke_test" } };

  const res = ws.connect(url, params, function (socket) {
    socket.on("open", () => {
      console.log("✅ Đã kết nối WebSocket thành công!");

      // Gửi dữ liệu mẫu để kiểm tra phản hồi
      socket.send(JSON.stringify({ event: "ping", data: "hello" }));

      // Đóng kết nối sau khi kiểm tra xong
      socket.close();
    });

    socket.on("error", (e) => {
      console.error("❌ Lỗi kết nối WebSocket:", e.error());
    });
  });

  // Kiểm tra trạng thái phản hồi phải là 101 (Switching Protocols)
  check(res, { "status is 101": (r) => r && r.status === 101 });
}
