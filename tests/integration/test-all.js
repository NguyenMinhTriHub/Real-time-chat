const mongoose = require("mongoose");
const { Client } = require("minio");
const redis = require("redis");
require("dotenv").config();

async function runIntegrationTest() {
  console.log("🧪 --- BẮT ĐẦU KIỂM THỬ TÍCH HỢP ---");
  let errors = 0;

  // 1. Kiểm tra MongoDB
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chatdb",
    );
    console.log("✅ MongoDB: Kết nối thành công.");
    await mongoose.disconnect();
  } catch (e) {
    console.error("❌ MongoDB: Lỗi -", e.message);
    errors++;
  }

  // 2. Kiểm tra Redis
  const redisClient = redis.createClient({
    url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  });
  try {
    await redisClient.connect();
    console.log("✅ Redis: Kết nối thành công.");
    await redisClient.quit();
  } catch (e) {
    console.error("❌ Redis: Lỗi -", e.message);
    errors++;
  }

  // 3. Kiểm tra MinIO
  const minioClient = new Client({
    endPoint: "127.0.0.1",
    port: 9000,
    useSSL: false,
    accessKey: "admin",
    secretKey: "password123",
  });
  try {
    const exists = await minioClient.bucketExists(
      process.env.MINIO_BUCKET || "chat-uploads",
    );
    console.log(`✅ MinIO: Bucket '${process.env.MINIO_BUCKET}' tồn tại.`);
  } catch (e) {
    console.error("❌ MinIO: Lỗi -", e.message);
    errors++;
  }

  console.log("------------------------------------");
  if (errors === 0) {
    console.log("🎉 TẤT CẢ CÁC DỊCH VỤ ĐÃ SẴN SÀNG!");
  } else {
    console.log(`⚠️ PHÁT HIỆN ${errors} LỖI CẦN XỬ LÝ.`);
  }
  process.exit(errors > 0 ? 1 : 0);
}

runIntegrationTest();
