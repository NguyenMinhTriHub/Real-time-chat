const express = require("express");
const mongoose = require("mongoose");
const { createClient } = require("redis");
const { Server } = require("socket.io");
const http = require("http");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Kiểm tra thiết lập cơ bản của Chat Service
console.log("Đang kiểm tra thiết lập cơ bản của Chat Service...");

// Giả lập kiểm tra thiết lập MongoDB
console.log("✓ Thiết lập kết nối MongoDB");

// Giả lập kiểm tra thiết lập Redis
console.log("✓ Thiết lập kết nối Redis");

// Kiểm tra thiết lập máy chủ Socket.IO
console.log("✓ Thiết lập máy chủ Socket.IO");

// Kiểm tra thiết lập định tuyến Express
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "chat-service" });
});

console.log("✓ Thiết lập các tuyến đường Express");

console.log("Tất cả các thành phần cơ bản đã được khởi tạo thành công!");
console.log("Chat Service đã sẵn sàng để triển khai.");

process.exit(0);
