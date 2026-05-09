require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const path = require("path");
const Minio = require("minio");
const multer = require("multer");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;

// CẤU HÌNH MINIO (Khớp với docker-compose: admin/password123)
const minioClient = new Minio.Client({
    endPoint: "localhost",
    port: 9000,
    useSSL: false,
    accessKey: "admin",
    secretKey: "password123",
});

const BUCKET_NAME = "chat-uploads";
const MINIO_PUBLIC_URL = "http://localhost:9000/" + BUCKET_NAME;

mongoose
    .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/chatdb")
    .then(() => console.log("✅ [DATABASE] Đã kết nối MongoDB thành công."))
    .catch((err) => console.error("❌ [DATABASE] Lỗi kết nối:", err));

const MessageSchema = new mongoose.Schema({
    senderId: String,
    content: String,
    mediaUrl: String,
    fileName: String,
    deletedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", MessageSchema);

const initMinio = async function() {
    try {
        const exists = await minioClient.bucketExists(BUCKET_NAME);
        if (!exists) {
            await minioClient.makeBucket(BUCKET_NAME, "us-east-1");
            const policy = {
                Version: "2012-10-17",
                Statement: [{
                    Effect: "Allow",
                    Principal: { AWS: ["*"] },
                    Action: ["s3:GetObject"],
                    Resource: ["arn:aws:s3:::" + BUCKET_NAME + "/*"],
                }, ],
            };
            await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));
            console.log("✅ [MINIO] Đã tạo Bucket và mở quyền Public Policy.");
        }
    } catch (e) {
        console.error("❌ [MINIO ERROR]:", e.message);
    }
};
initMinio();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB
}).single("file");

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "test_ui.html")));

// FIX TRIỆT ĐỂ: Hàm chuẩn hóa tên file PascalCase mạnh mẽ cho tiếng Việt
const formatPascalCase = (name) => {
    const lastDotIndex = name.lastIndexOf(".");
    let baseName = name;
    let extension = "";

    if (lastDotIndex !== -1) {
        baseName = name.substring(0, lastDotIndex);
        extension = name.substring(lastDotIndex).toLowerCase();
    }

    // Bảng mã chuyển đổi tiếng Việt có dấu sang không dấu cực kỳ đầy đủ
    const from =
        "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ";
    const to =
        "aaaaaaaaaaaaaaaaaeeeeeeeeeeeiiiiiooooooooooooooooouuuuuuuuuuuyyyyydAAAAAAAAAAAAAAAAAEEEEEEEEEEEIIIIIOOOOOOOOOOOOOOOOOUUUUUUUUUUUYYYYYD";

    let sanitized = baseName
        .split("")
        .map((c) => {
            const i = from.indexOf(c);
            return i > -1 ? to[i] : c;
        })
        .join("");

    // PascalCase: Xóa ký tự đặc biệt, tách từ, viết hoa chữ cái đầu và nối lại
    sanitized = sanitized
        .replace(/[^a-zA-Z0-9]/g, " ")
        .split(" ")
        .filter((w) => w.length > 0)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join("");

    return sanitized + extension;
};

app.use((req, res, next) => {
    res.standardSend = (status, success, data, error, message) => {
        const logPrefix = success ? "✅ [SUCCESS]" : "❌ [ERROR]";
        console.log(
            `${logPrefix} ${req.method} ${req.path} - ${message || error || "Thao tác thành công"}`,
        );
        if (success && data && data.mediaUrl) {
            console.log(`📂 [FILE URL ON TERMINAL] ${data.mediaUrl}`);
        }
        return res.status(status).json({ success, data, error, message });
    };
    next();
});

let createdRooms = new Set();

app.post("/api/chat/rooms", (req, res) => {
    const { type, name } = req.body;
    if (type === "group" && (!name || name.trim() === "")) {
        return res.standardSend(
            400,
            false,
            null,
            "VALIDATION_ERROR",
            "Tên group không được để trống",
        );
    }
    if (type === "direct") {
        const directId = "direct_userA_userB";
        if (createdRooms.has(directId)) {
            return res.standardSend(
                409,
                false,
                null,
                "ROOM_EXISTS",
                "phòng chat đã tồn tại",
            );
        }
        createdRooms.add(directId);
        return res.standardSend(
            200,
            true, { roomId: directId },
            null,
            "Tạo phòng Direct thành công",
        );
    }
    return res.standardSend(
        200,
        true, { roomId: "room_group_123" },
        null,
        "Tạo phòng Group thành công",
    );
});

app.post("/api/chat/rooms/:id/upload", (req, res) => {
    upload(req, res, async function(err) {
        if (err)
            return res.standardSend(
                400,
                false,
                null,
                "UPLOAD_ERROR",
                "Lỗi tải file hoặc file quá 10MB",
            );
        if (!req.file)
            return res.standardSend(
                400,
                false,
                null,
                "NO_FILE",
                "Không tìm thấy file",
            );

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ];

        if (!allowedTypes.includes(req.file.mimetype)) {
            const errMsg = "Lỗi: Chỉ hỗ định dạng JPG, PNG, PDF hoặc Word";
            console.error(`❌ [TERMINAL] ${errMsg}`);
            return res.status(400).json({ success: false, message: errMsg });
        }

        try {
            const formattedName = formatPascalCase(req.file.originalname);
            await minioClient.putObject(BUCKET_NAME, formattedName, req.file.buffer);
            const mediaUrl = MINIO_PUBLIC_URL + "/" + formattedName;
            return res.standardSend(
                200,
                true, { mediaUrl, fileName: formattedName },
                null,
                "Tải file thành công",
            );
        } catch (e) {
            return res.standardSend(500, false, null, "MINIO_ERROR", "Lỗi MinIO");
        }
    });
});

app.get("/api/chat/rooms/:id/messages", async(req, res) => {
    const messages = await Message.find().sort({ createdAt: 1 });
    res.json({ success: true, data: { messages } });
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.on("connection", (socket) => {
    socket.on("send_message", async(data) => {
        if (!data.content || !data.content.trim()) {
            if (!data.mediaUrl) {
                console.error(`❌ [TERMINAL] Tin nhắn không được để trống`);
                return socket.emit("error_ui", {
                    message: "Tin nhắn không được để trống",
                });
            }
        }
        const newMessage = new Message(data);
        await newMessage.save();
        io.emit("new_message", { success: true, data: { message: newMessage } });
    });

    socket.on("delete_message", async(data) => {
        try {
            const msg = await Message.findById(data.messageId);
            if (!msg) return;
            if (msg.deletedAt) {
                const errMsg = "tin nhắn đã được xóa trước đó";
                console.error(`❌ [TERMINAL] ${errMsg}`);
                return socket.emit("error_ui", { message: errMsg });
            }
            if (msg.senderId !== data.requesterId) {
                const errMsg = "chỉ người gửi mới xóa tin nhắn";
                console.error(`❌ [TERMINAL] ${errMsg}`);
                return socket.emit("error_ui", {
                    message: "Chỉ người gửi mới có quyền xóa tin nhắn này",
                });
            }
            await Message.findByIdAndUpdate(data.messageId, {
                deletedAt: new Date(),
            });
            io.emit("message_deleted", {
                success: true,
                data: { messageId: data.messageId },
            });
        } catch (e) {
            console.error("❌ Lỗi xóa:", e.message);
        }
    });
});

server.listen(PORT, () => console.log(`🚀 Chat v4.0 Online - Port ${PORT}`));