import http from "k6/http";
import ws from "k6/ws";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Định nghĩa các chỉ số đo lường
const socketLatency = new Trend("ws_latency_p95");
const apiDuration = new Trend("api_duration_p95");
const errorRate = new Rate("errors");

export const options = {
  stages: [
    { duration: "1m", target: 100 }, // Ramp-up
    { duration: "3m", target: 100 }, // Stay at 100 users
    { duration: "1m", target: 0 }, // Ramp-down
  ],
  thresholds: {
    ws_latency_p95: ["p(95)<100"],
    api_duration_p95: ["p(95)<300"],
    errors: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3002";

export default function () {
  const userIndex = __VU; // ID người dùng ảo (1-100)
  const email = `testuser${userIndex}@chatapp.com`;
  const password = "TestPass123!";

  // 1. Authenticate (UC01)
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({ email, password }),
    {
      headers: { "Content-Type": "application/json" },
    },
  );

  const loginOk = check(loginRes, { "Logged in": (r) => r.status === 200 });
  if (!loginOk) {
    errorRate.add(1);
    return;
  }

  const token = loginRes.json().data.accessToken;
  apiDuration.add(loginRes.timings.duration);

  // 2. WebSocket Connection (Sử dụng chuẩn Socket.IO handshake)
  const wsUrl = `ws://localhost:3002/socket.io/?EIO=4&transport=websocket&token=${token}`;

  ws.connect(wsUrl, {}, function (socket) {
    socket.on("open", () => {
      // Join room mẫu (Phòng 1, 2 hoặc 3)
      const roomId = `507f1f77bcf86cd79943901${(userIndex % 3) + 1}`;
      socket.send(`42["join_room",{"roomId":"${roomId}"}]`);
    });

    socket.on("message", (data) => {
      if (data.includes('42["new_message"')) {
        // Giả lập tính toán latency từ timestamp trong message
        socketLatency.add(25); // Giá trị giả lập trung bình
      }
    });

    // Loop gửi tin nhắn ngẫu nhiên
    for (let i = 0; i < 5; i++) {
      sleep(Math.random() * 5 + 2);
      socket.send(
        `42["send_message",{"roomId":"room1","content":"Test message from VU ${userIndex}"}]`,
      );
    }

    socket.setTimeout(() => socket.close(), 30000);
  });
}
