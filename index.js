require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const Minio = require("minio");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static(__dirname));

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// --- KẾT NỐI DATABASE ---
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://mongodb:27017/chatdb")
  .then(() => console.log("🍃 MongoDB Connected"));

const Message = mongoose.model(
  "Message",
  new mongoose.Schema(
    {
      senderId: String,
      roomId: String,
      text: String,
      fileUrl: String,
      fileName: String,
      type: { type: String, default: "text" },
      deletedAt: { type: Date, default: null }, // Soft Delete UC10
    },
    { timestamps: true },
  ),
);

const Room = mongoose.model(
  "Room",
  new mongoose.Schema({
    name: String,
    type: { type: String, enum: ["direct", "group"] },
    members: [String],
    admins: [String], // Đáp ứng Mục 6.2
  }),
);

// --- CẤU HÌNH MINIO & AUTO-PUBLIC POLICY ---
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "minio",
  port: 9000,
  useSSL: false,
  accessKey: "admin",
  secretKey: "password123",
});
const bucket = "chat-uploads";

async function initMinio() {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) await minioClient.makeBucket(bucket);
    const policy = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: "*",
          Action: ["s3:GetObject"],
          Resource: [`arn:aws:s3:::${bucket}/*`],
        },
      ],
    };
    await minioClient.setBucketPolicy(bucket, JSON.stringify(policy));
    console.log("✅ MinIO Public Policy Ready");
  } catch (err) {
    setTimeout(initMinio, 5000);
  }
}
initMinio();

// --- HÀM CHUẨN HOÁ TÊN FILE (PASCAL CASE & KHÔNG DẤU) ---
function formatFileName(str) {
  if (!str) return "File";
  let cleanStr = str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, "a")
    .replace(/[èéẹẻẽêềếệểễ]/g, "e")
    .replace(/[ìíịỉĩ]/g, "i")
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, "o")
    .replace(/[ùúụủũưừứựửữ]/g, "u")
    .replace(/[ỳýỵỷỹ]/g, "y");
  return cleanStr
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .filter((w) => w.length > 0)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

// --- MULTER (CHẶN > 10MB & SAI ĐỊNH DẠNG) ---
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /image\/(jpeg|png|gif|webp)|application\/pdf/;
    if (allowed.test(file.mimetype)) cb(null, true);
    else cb(new Error("INVALID_FILE_TYPE"));
  },
});

// --- API ROUTES ---

// Upload file với thông báo lỗi đỏ Mục 6.2
app.post("/api/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      const code =
        err.code === "LIMIT_FILE_SIZE" ? "FILE_TOO_LARGE" : "INVALID_FILE_TYPE";
      const msg =
        err.code === "LIMIT_FILE_SIZE" ? "Vượt quá 10MB" : "Chỉ nhận Image/PDF";
      return res
        .status(400)
        .json({ success: false, error: code, message: msg });
    }
    if (!req.file)
      return res
        .status(400)
        .json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Chưa chọn file",
        });
    try {
      const ext = path.extname(req.file.originalname);
      const formattedName =
        formatFileName(path.basename(req.file.originalname, ext)) + ext;
      await minioClient.fPutObject(bucket, formattedName, req.file.path);
      fs.unlinkSync(req.file.path);
      res.json({
        success: true,
        data: {
          url: `http://localhost:9000/${bucket}/${formattedName}`,
          name: formattedName,
        },
      });
    } catch (e) {
      res
        .status(500)
        .json({ success: false, error: "SERVER_ERROR", message: e.message });
    }
  });
});

// Tạo phòng chuẩn Mục 6.2 (Direct/Group/Admins)
app.post("/api/chat/rooms", async (req, res) => {
  try {
    const { type, name, memberIds, senderId } = req.body;
    if (type === "group" && (!name || name.trim() === ""))
      return res
        .status(400)
        .json({
          success: false,
          error: "VALIDATION_ERROR",
          message: "Thiếu tên nhóm",
        });

    if (type === "direct") {
      const sorted = [senderId, memberIds[0]].sort();
      const exists = await Room.findOne({
        type: "direct",
        members: { $all: sorted, $size: 2 },
      });
      if (exists)
        return res
          .status(409)
          .json({
            success: false,
            error: "ROOM_EXISTS",
            message: "Phòng chat đôi đã tồn tại",
          });
    }
    const room = await Room.create({
      type,
      name,
      members: [senderId, ...memberIds],
      admins: [senderId],
    });
    res.status(201).json({ success: true, data: room });
  } catch (err) {
    res
      .status(500)
      .json({ success: false, error: "SERVER_ERROR", message: err.message });
  }
});

// Socket.io xử lý tin nhắn và xoá phân quyền
io.on("connection", (socket) => {
  socket.on("join_room", (roomId) => {
    socket.join(roomId);
    socket.emit("new_message", {
      type: "system",
      text: `[HỆ THỐNG] - Đã vào phòng: ${roomId}`,
    });
  });

  socket.on("send_message", async (data) => {
    // Sửa lỗi dòng 147: Kiểm tra tin nhắn trống không dùng ?.
    const hasText = data.text && data.text.trim().length > 0;
    const hasFile = data.fileUrl && data.fileUrl.length > 0;
    if (!hasText && !hasFile)
      return socket.emit(
        "error_msg",
        "[CONTENT_EMPTY] - Tin nhắn không được để trống",
      );

    const msg = await Message.create(data);
    io.to(data.roomId).emit("new_message", msg);
  });

  socket.on("delete_message", async ({ messageId, userId }) => {
    const msg = await Message.findById(messageId);
    if (msg && msg.senderId === userId) {
      msg.deletedAt = new Date();
      await msg.save();
      io.to(msg.roomId).emit("message_deleted", messageId);
    } else {
      socket.emit("error_msg", "[FORBIDDEN] - BẠN KHÔNG CÓ QUYỀN XÓA");
    }
  });
});

app.get("/test", (req, res) => res.sendFile(path.join(__dirname, "test.html")));
server.listen(3002, () => console.log("🚀 Chat Service v7.9 Online on 3002"));
