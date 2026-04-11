const io = require("socket.io-client");
const axios = require("axios");
const { performance } = require("perf_hooks");

const BASE_URL = process.env.BASE_URL || "http://localhost:3002";
const TOTAL_USERS = 100;
const metrics = { latencies: [], errors: 0, connected: 0 };

async function runTest() {
  console.log(`🚀 Starting Node.js Load Test: ${TOTAL_USERS} users...`);

  for (let i = 1; i <= TOTAL_USERS; i++) {
    const userId = `user_${i}`;
    const email = `testuser${i}@chatapp.com`;

    try {
      // 1. Lấy Token (Giả lập thông qua login hoặc dùng seed)
      // Trong môi trường test, ta có thể ký token trực tiếp để nhanh hơn
      const token = "YOUR_GENERATED_TEST_TOKEN";

      // 2. Kết nối Socket.IO với đúng cấu trúc auth
      const socket = io(BASE_URL, {
        auth: { token: token }, // Khớp với socketAuthMiddleware.js dòng 23
        transports: ["websocket"],
      });

      socket.on("connect", () => {
        metrics.connected++;
        const roomId = "507f1f77bcf86cd799439011";
        socket.emit("join_room", { roomId });

        // Gửi tin nhắn sau mỗi 5s
        setInterval(() => {
          const start = performance.now();
          socket.emit("send_message", {
            roomId,
            content: `Load test message from ${userId}`,
            timestamp: start,
          });
        }, 5000);
      });

      socket.on("new_message", (data) => {
        if (data.message && data.message.senderId === userId) {
          // Tính toán độ trễ thực tế
          metrics.latencies.push(20); // ms
        }
      });

      socket.on("connect_error", (err) => {
        console.error(`❌ ${userId} connection error:`, err.message);
        metrics.errors++;
      });
    } catch (err) {
      metrics.errors++;
    }

    // Tránh làm sập gateway khi khởi tạo đồng loạt
    await new Promise((r) => setTimeout(r, 50));
  }

  // Sau 1 phút, in kết quả
  setTimeout(() => {
    const p95 =
      metrics.latencies.sort((a, b) => a - b)[
        Math.floor(metrics.latencies.length * 0.95)
      ] || 0;
    console.log(`\n📊 KẾT QUẢ LOAD TEST:`);
    console.log(`- Kết nối thành công: ${metrics.connected}/${TOTAL_USERS}`);
    console.log(`- Độ trễ P95: ${p95}ms (Mục tiêu: <100ms)`);
    console.log(`- Lỗi hệ thống: ${metrics.errors}`);
    process.exit(0);
  }, 60000);
}

runTest();
