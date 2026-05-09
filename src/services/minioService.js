const Minio = require("minio");
const multer = require("multer");
const path = require("path");

const minioClient = new Minio.Client({
    endPoint: "127.0.0.1",
    port: 9000,
    useSSL: false,
    accessKey: "admin",
    secretKey: "password123",
});

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // Giới hạn 10MB[cite: 19]
});

// Hàm chuẩn hóa: Không dấu, PascalCase, viết liền
const formatFileName = function(fileName) {
    if (!fileName) return "Untitled";
    const parsed = path.parse(fileName);
    const normalizedName = parsed.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/đ/g, "d")
        .replace(/Đ/g, "D");
    const formatted = normalizedName
        .split(/[^a-zA-Z0-9]+/)
        .filter(function(word) {
            return word.length > 0;
        })
        .map(function(word) {
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join("");
    return formatted + parsed.ext;
};

const uploadToMinio = async function(file) {
    const bucketName = "chat-uploads";
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) await minioClient.makeBucket(bucketName);

    const fileName = Date.now() + "-" + formatFileName(file.originalname);
    const metaData = { "Content-Type": file.mimetype }; // Sửa lỗi phông chữ

    await minioClient.putObject(
        bucketName,
        fileName,
        file.buffer,
        file.size,
        metaData,
    );
    const mediaUrl = `http://127.0.0.1:9000/${bucketName}/${fileName}`;
    return {
        mediaUrl,
        fileName,
        fileType: file.mimetype,
        fileSize: file.size,
    };
};

module.exports = {
    upload,
    uploadToMinio,
    uploadFile: uploadToMinio,
    formatFileName,
};