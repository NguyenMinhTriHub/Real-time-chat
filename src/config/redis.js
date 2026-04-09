const redis = require("redis");

let client = null;

/**
 * Khởi tạo và kết nối Redis Client
 */
const connectRedis = async () => {
  try {
    // Kiểm tra định dạng URL Redis từ .env [cite: 482]
    const redisUrl =
      process.env.REDIS_URL ||
      `redis://${process.env.REDIS_HOST || "redis"}:${process.env.REDIS_PORT || 6379}`;

    client = redis.createClient({
      url: redisUrl,
    });

    // Lắng nghe các sự kiện lỗi của Redis để debug
    client.on("error", (err) => console.error("❌ Redis Client Error", err));

    await client.connect();
    console.log("✅ Redis Connected");
    return client;
  } catch (error) {
    console.error("❌ Redis Connection Error:", error.message);
    // Dừng tiến trình vì hệ thống Chat dựa rất nhiều vào Redis Pub/Sub [cite: 414]
    process.exit(1);
  }
};

/**
 * Trả về client hiện tại để các module khác sử dụng
 */
const getRedisClient = () => {
  if (!client) {
    throw new Error("Redis client not initialized. Call connectRedis first.");
  }
  return client;
};

module.exports = { connectRedis, getRedisClient };
