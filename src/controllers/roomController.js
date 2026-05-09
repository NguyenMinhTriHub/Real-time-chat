const roomRepository = require("../repositories/roomRepository");
const ErrorHandler = require("../utils/errorHandler");

class RoomController {
    /**
     * Lấy danh sách phòng của user [cite: UC05]
     * GET /api/chat/rooms
     */
    static async getRooms(req, res) {
        try {
            const userId = req.user.id;
            const rooms = await roomRepository.findByMember(userId);

            console.log(
                `✓ Rooms retrieved for user ${userId}: ${rooms.length} rooms`,
            );

            return res.json({
                success: true,
                data: {
                    rooms,
                    total: rooms.length,
                },
                error: null,
                message: "Rooms retrieved successfully",
            });
        } catch (error) {
            console.error(
                `Get rooms error: ${error.message} (userId: ${req.user.id})`,
                error.stack,
            );
            return res
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
     * Tạo phòng chat mới [cite: UC04]
     * POST /api/chat/rooms
     * Supports Direct (1-to-1) và Group chats
     */
    static async createRoom(req, res) {
        try {
            const { type, name, members, memberIds } = req.body;
            const creatorId = req.user.id;
            const rawMembers = members || memberIds;

            // 1. Validation loại phòng [cite: 191]
            if (!type || !["direct", "group"].includes(type)) {
                console.warn(
                    `Invalid room type attempted: ${type} by user ${creatorId}`,
                );
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
                console.warn(
                    `Group room creation without name attempted by user ${creatorId}`,
                );
                return res
                    .status(400)
                    .json(
                        ErrorHandler.formatErrorResponse(
                            "VALIDATION_ERROR",
                            "Group rooms must have a name",
                        ),
                    );
            }

            if (!rawMembers || !Array.isArray(rawMembers) || rawMembers.length < 1) {
                console.warn(
                    `Room creation without members attempted by user ${creatorId}`,
                );
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
            const allMembers = [...new Set([creatorId, ...rawMembers])];

            // 4. Kiểm tra nếu là phòng Direct đã tồn tại [cite: 197]
            if (type === "direct" && allMembers.length === 2) {
                const existingRoom = await roomRepository.findDirectRoom(
                    allMembers[0],
                    allMembers[1],
                );
                if (existingRoom) {
                    console.warn(
                        `Direct room already exists: ${existingRoom._id} (members: ${allMembers.join(", ")})`,
                    );
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

            console.log(
                `✓ Room created: ${room._id} (type: ${type}, members: ${allMembers.length})`,
            );

            return res.status(201).json({
                success: true,
                data: { room },
                error: null,
                message: "Room created successfully",
            });
        } catch (error) {
            console.error(
                `Create room error: ${error.message} (creatorId: ${req.user.id})`,
                error.stack,
            );
            return res
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