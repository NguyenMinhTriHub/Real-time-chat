const express = require("express");
const RoomController = require("../controllers/roomController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * Các tuyến đường cho Room (Phòng chat)
 * Được bảo vệ bởi authMiddleware để đảm bảo chỉ user đã login mới truy cập được
 */
router.use(authMiddleware);

// Lấy danh sách các phòng chat mà người dùng hiện tại tham gia
// GET /api/chat/rooms/
router.get("/", RoomController.getRooms);

// Tạo một phòng chat mới (Direct Message hoặc Group Chat)
// POST /api/chat/rooms/
router.post("/", RoomController.createRoom);

module.exports = router;
