const { Client } = require("minio");

class MinioService {
  constructor() {
    this.minioClient = new Client({
      endPoint: process.env.MINIO_ENDPOINT || "localhost",
      port: parseInt(process.env.MINIO_PORT) || 9000,
      useSSL: process.env.MINIO_USE_SSL === "true",
      accessKey: process.env.MINIO_ACCESS_KEY,
      secretKey: process.env.MINIO_SECRET_KEY,
    });
    // Đồng bộ biến MINIO_BUCKET
    this.bucket = process.env.MINIO_BUCKET || "chat-uploads";
  }

  async uploadFile(fileBuffer, fileName, mimeType) {
    try {
      const objectName = `${Date.now()}-${fileName}`;
      await this.minioClient.putObject(this.bucket, objectName, fileBuffer, {
        "Content-Type": mimeType,
      });
      return `http://${process.env.MINIO_ENDPOINT}:9000/${this.bucket}/${objectName}`;
    } catch (error) {
      console.error("MinIO upload error:", error);
      throw new Error("FILE_UPLOAD_FAILED");
    }
  }

  async ensureBucketExists() {
    try {
      const exists = await this.minioClient.bucketExists(this.bucket);
      if (!exists) {
        await this.minioClient.makeBucket(this.bucket);
        console.log(`✅ Bucket ${this.bucket} created`);
      }
    } catch (error) {
      console.error("MinIO bucket check error:", error);
    }
  }
}

module.exports = new MinioService();
