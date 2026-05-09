const mongoose = require("mongoose");

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5000;
let retryCount = 0;

const connectDB = async function() {
    try {
        const uri =
            process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/chat_service";
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            retryWrites: true,
            retryReads: true,
        };

        if (retryCount === 0) {
            console.log("🔄 Đang kết nối đến MongoDB...");
        }

        await mongoose.connect(uri, options);
        console.log("✅ THÀNH CÔNG: MongoDB Connected");
        retryCount = 0;
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            retryCount++;
            console.log("⏳ Thử lại lần " + retryCount + " sau 5s...");
            setTimeout(function() {
                connectDB();
            }, RETRY_DELAY_MS);
        } else {
            process.exit(1);
        }
    }
};

module.exports = { connectDB };