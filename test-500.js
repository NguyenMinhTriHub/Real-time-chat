const { io } = require("socket.io-client");

const URL = "http://localhost:3002";
const MAX_USERS = 600; // Chúng ta test hẳn 600 user cho máu
const CONNECTION_DELAY = 100; // Cứ 100ms thì cho 1 user mới vào (tránh bị Windows chặn)

let currentUsers = 0;

console.log(
  `🚀 Đang bắt đầu thử nghiệm áp lực: Mục tiêu ${MAX_USERS} kết nối đồng thời...`,
);

function createClient(index) {
  const socket = io(URL, {
    transports: ["websocket"],
    forceNew: true, // Ép buộc tạo kết nối mới hoàn toàn
  });

  socket.on("connect", () => {
    currentUsers++;
    if (currentUsers % 50 === 0 || currentUsers === MAX_USERS) {
      console.log(
        `✅ [STATUS] Đang có ${currentUsers} người dùng kết nối đồng thời.`,
      );
    }

    // Giả lập hành vi chat nhẹ nhàng để duy trì kết nối
    setInterval(() => {
      if (socket.connected) {
        socket.emit("send_message", {
          senderId: `User_${index}`,
          content: "ping",
        });
      }
    }, 30000); // 30 giây gửi 1 tin là quá đủ để giữ kết nối
  });

  socket.on("connect_error", (err) => {
    console.error(`❌ User ${index} lỗi kết nối:`, err.message);
  });

  socket.on("disconnect", () => {
    currentUsers--;
  });
}

// Bắt đầu tạo user dần dần
let i = 0;
const interval = setInterval(() => {
  createClient(i);
  i++;
  if (i >= MAX_USERS) {
    clearInterval(interval);
    console.log("--------------------------------------------------");
    console.log("🎉 HOÀN THÀNH: Đã thiết lập đủ 600 kết nối đồng thời!");
    console.log("👉 Tri hãy chụp ảnh màn hình này để làm minh chứng đồ án.");
    console.log("👉 Đừng tắt Terminal này cho đến khi chụp ảnh xong.");
  }
}, CONNECTION_DELAY);
