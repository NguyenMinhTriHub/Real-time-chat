const mongoose = require("mongoose");

/**
 * Kết nối tới MongoDB
 * Sử dụng MONGODB_URI từ biến môi trường hoặc giá trị mặc định của Docker
 */
const connectDB = async () => {
  try {
    // Ưu tiên MONGODB_URI, nếu không có sẽ dùng mặc định cho Docker [cite: 482]
    const uri = process.env.MONGODB_URI || "mongodb://mongodb:27017/chatdb";

    // Cấu hình các tùy chọn để kết nối ổn định hơn
    const options = {
      autoIndex: true, // Tự động tạo index để tối ưu truy vấn [cite: 465]
    };

    await mongoose.connect(uri, options);
    console.log(`✅ MongoDB Connected: ${uri}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Dừng tiến trình nếu không thể kết nối DB quan trọng
    process.exit(1);
  }
};

module.exports = { connectDB };
