const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    reaction: { type: String, required: true },
    reactedAt: { type: Date, default: Date.now },
}, { _id: false }, );

const messageSchema = new mongoose.Schema({
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true,
        index: true,
    },
    senderId: { type: String, required: true },
    type: {
        type: String,
        enum: ["text", "image", "file", "system"],
        default: "text",
    },
    content: { type: String },
    mediaUrls: [{ type: String }],
    fileName: { type: String },
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
        default: null,
    },
    reactions: {
        type: Map,
        of: reactionSchema,
        default: {},
    },
    readBy: {
        type: [String],
        default: [],
    },
    deletedAt: { type: Date, default: null },
}, { timestamps: true }, );

// Tối ưu hóa truy vấn lịch sử khi cuộn trang
messageSchema.index({ roomId: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);