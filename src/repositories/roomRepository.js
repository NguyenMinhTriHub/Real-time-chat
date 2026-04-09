const Room = require("../models/Room");

class RoomRepository {
  /**
   * Tìm phòng theo ID
   */
  async findById(id) {
    return await Room.findById(id);
  }

  /**
   * Lấy danh sách phòng mà người dùng tham gia
   * Sắp xếp theo tin nhắn mới nhất cập nhật (updatedAt)
   */
  async findByMember(userId) {
    return await Room.find({ members: userId })
      .populate("lastMessage") // Hiển thị nội dung tin nhắn cuối ở danh sách phòng
      .sort({ updatedAt: -1 });
  }

  /**
   * Tìm phòng Chat 1-1 (Direct) hiện có giữa 2 người dùng
   * Dùng để tránh tạo phòng trùng lặp theo đặc tả 6.2
   */
  async findDirectRoom(userA, userB) {
    return await Room.findOne({
      type: "direct",
      members: { $all: [userA, userB], $size: 2 },
    });
  }

  /**
   * Tìm một phòng theo điều kiện bất kỳ
   */
  async findOne(query) {
    return await Room.findOne(query);
  }

  /**
   * Tạo phòng mới
   */
  async create(roomData) {
    const room = new Room(roomData);
    return await room.save();
  }

  /**
   * Cập nhật thông tin phòng (ví dụ: đổi tên group, cập nhật lastMessage)
   */
  async update(id, updateData) {
    return await Room.findByIdAndUpdate(id, updateData, { new: true });
  }

  /**
   * Xóa phòng
   */
  async delete(id) {
    return await Room.findByIdAndDelete(id);
  }
}

module.exports = new RoomRepository();
