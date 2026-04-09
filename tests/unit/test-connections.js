const mongoose = require("mongoose");
const { createClient } = require("redis");
const { Client } = require("minio");
require("dotenv").config();

async function runTest() {
  console.log("🔍 Đang kiểm tra hệ thống...\n");

  // Test MongoDB
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB: KẾT NỐI THÀNH CÔNG");
    await mongoose.disconnect();
  } catch (e) {
    console.log("❌ MongoDB: THẤT BẠI -", e.message);
  }

  // Test Redis
  try {
    const redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    console.log("✅ Redis:   KẾT NỐI THÀNH CÔNG");
    await redis.disconnect();
  } catch (e) {
    console.log("❌ Redis:   THẤT BẠI -", e.message);
  }

  // Test MinIO
  try {
    const minio = new Client({
      endPoint: process.env.MINIO_ENDPOINT,
      port: 9000,
      useSSL: false,
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
    await minio.bucketExists(process.env.MINIO_BUCKET);
    console.log("✅ MinIO:   KẾT NỐI THÀNH CÔNG");
  } catch (e) {
    console.log("❌ MinIO:   THẤT BẠI -", e.message);
  }
}

runTest();
