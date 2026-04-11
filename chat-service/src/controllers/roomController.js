const roomRepository = require("../repositories/roomRepository");
const ErrorHandler = require("../utils/errorHandler");

class RoomController {
  /**
   * Lấy danh sách phòng của user
   * GET /api/chat/rooms
   */
  static async getRooms(req, res) {
    try {
      const userId = req.user.id;
      const rooms = await roomRepository.findByMember(userId);

      res.json({
        success: true,
        data: {
          rooms,
          total: rooms.length,
        },
        error: null,
        message: "Rooms retrieved successfully",
      });
    } catch (error) {
      console.error("Get rooms error:", error);
      res
        .status(500)
        .json(
          ErrorHandler.formatErrorResponse(
            "INTERNAL_ERROR",
            "Failed to retrieve rooms",
          ),
        );
    }
  }

  /**
   * Tạo phòng chat mới (Direct hoặc Group)
   * POST /api/chat/rooms
   */
  static async createRoom(req, res) {
    try {
      const { type, name, members } = req.body;
      const creatorId = req.user.id;

      // 1. Validation loại phòng [cite: 191]
      if (!type || !["direct", "group"].includes(type)) {
        return res
          .status(400)
          .json(
            ErrorHandler.formatErrorResponse(
              "VALIDATION_ERROR",
              "Invalid room type",
            ),
          );
      }

      // 2. Group bắt buộc có tên [cite: 192, 197]
      if (type === "group" && !name) {
        return res
          .status(400)
          .json(
            ErrorHandler.formatErrorResponse(
              "VALIDATION_ERROR",
              "Group rooms must have a name",
            ),
          );
      }

      if (!members || !Array.isArray(members) || members.length < 1) {
        return res
          .status(400)
          .json(
            ErrorHandler.formatErrorResponse(
              "VALIDATION_ERROR",
              "At least one member required",
            ),
          );
      }

      // 3. Thêm người tạo vào danh sách thành viên [cite: 88]
      const allMembers = [...new Set([creatorId, ...members])];

      // 4. Kiểm tra nếu là phòng Direct đã tồn tại [cite: 197]
      if (type === "direct" && allMembers.length === 2) {
        const existingRoom = await roomRepository.findDirectRoom(
          allMembers[0],
          allMembers[1],
        );
        if (existingRoom) {
          return res
            .status(409)
            .json(
              ErrorHandler.formatErrorResponse(
                "ROOM_EXISTS",
                "Direct room already exists between these users",
              ),
            );
        }
      }

      const room = await roomRepository.create({
        type,
        name: type === "group" ? name : null,
        members: allMembers,
        createdAt: new Date(),
      });

      res.status(201).json({
        success: true,
        data: { room },
        error: null,
        message: "Room created successfully",
      });
    } catch (error) {
      console.error("Create room error:", error);
      res
        .status(500)
        .json(
          ErrorHandler.formatErrorResponse(
            "INTERNAL_ERROR",
            "Failed to create room",
          ),
        );
    }
  }
}

module.exports = RoomController;
