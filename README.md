# 💬 User Service - Real-time Chat Application

Đây là phân hệ **User Service** thuộc hệ thống ứng dụng Chat thời gian thực, được phát triển theo kiến trúc **Microservices**. Phân hệ này chịu trách nhiệm quản lý danh tính người dùng, mối quan hệ bạn bè và trạng thái hoạt động.

---

## 🚀 Tính năng chính (Core Features)

* **Quản lý hồ sơ (Profile):** Cập nhật thông tin cá nhân và tiểu sử.
* **Lưu trữ ảnh đại diện (Avatar):** Upload và lưu trữ ảnh trực tiếp lên **MinIO** (Hỗ trợ chế độ xem ảnh phóng to Lightbox).
* **Hệ thống bạn bè (Friendships):** Xử lý luồng tìm kiếm, gửi lời mời kết bạn, chấp nhận/từ chối và hủy kết bạn.
* **Trạng thái hoạt động (Online Status):** Tích hợp **Redis** để theo dõi trạng thái Online/Offline theo thời gian thực (TTL 5 phút).
* **Chế độ Demo:** Chuyển đổi nhanh các User qua Header `X-Mock-User` để test luồng kết bạn ngay trên UI.

---

## 🛠️ Công nghệ sử dụng (Tech Stack)

| Thành phần | Công nghệ | Chi tiết |
| :--- | :--- | :--- |
| **Backend** | Python (FastAPI) | Xử lý logic, API Routing, Pydantic Validation |
| **Database** | PostgreSQL 16 | Lưu trữ dữ liệu quan hệ (SQLAlchemy ORM) |
| **Caching** | Redis 7 | Quản lý trạng thái Online/Offline |
| **Storage** | MinIO | S3 Compatible Storage lưu trữ Avatar |
| **Frontend** | ReactJS + Axios | UI Glassmorphism, cấu hình Proxy tránh CORS |
| **Infrastructure**| Docker Compose | Quản lý container hạ tầng |

---

## 📦 Hướng dẫn cài đặt và chạy (Setup & Installation)

### 1. Khởi động hạ tầng (Infrastructure)
Sử dụng Docker Compose để bật các dịch vụ hỗ trợ (Postgres: 5432, Redis: 6379, MinIO: 9000). 
Mở terminal tại thư mục gốc và chạy:

```bash
docker-compose up -d
```

### 2. Cài đặt Backend (FastAPI)
Mở một terminal mới, tạo môi trường ảo và chạy server FastAPI:
```bash
# Tạo môi trường ảo
python -m venv .venv

# Kích hoạt môi trường ảo
source .venv/bin/activate  # Trên macOS/Linux
# Hoặc trên Windows: .venv\Scripts\activate

# Cài đặt thư viện
pip install -r requirements.txt

# Khởi chạy server
uvicorn main:app --reload --port 8000
```

### 3. Cài đặt Frontend (ReactJS)
Mở một terminal mới, di chuyển vào thư mục Frontend:
```bash
cd user-service-frontend
npm install
npm start
```

## 🔗 Danh sách API Endpoints chính
**1. Hồ sơ cá nhân (Profile)**
* `GET /api/users/me` - Lấy thông tin tài khoản đang đăng nhập.
* `PATCH /api/users/me` - Cập nhật thông tin (Tên hiển thị, tiểu sử).
* `POST /api/users/me/avatar` - Upload ảnh đại diện.
* `GET /api/users/{userId}` - Lấy profile công khai của một user.

**2. Quản lý Bạn bè & Tìm kiếm**
* `GET /api/users/search?q={keyword}` - Tìm kiếm người dùng (yêu cầu ≥ 2 ký tự).
* `GET /api/users/friends` - Lấy danh sách bạn bè kèm trạng thái Online/Offline.
* `GET /api/users/friends/pending` - Lấy danh sách lời mời kết bạn đang chờ (`pending`).
* `POST /api/users/{target_id}/friends` - Gửi lời mời kết bạn.
* `PATCH /api/users/friends/{friendship_id}` - Chấp nhận (`accept`) hoặc từ chối (`reject`) lời mời.
* `DELETE /api/users/friends/{friendship_id}` - Hủy kết bạn.

**3. Trạng thái (Internal/Chat Service gọi)**
* `POST /api/users/status` - Cập nhật trạng thái `online`/`offline` vào Redis.

---

## 📖 Tài liệu API (API Documentation)

Sau khi chạy Backend, truy cập tài liệu API tự động tại:
* **Swagger UI:** `http://127.0.0.1:8000/docs`
* **ReDoc:** `http://127.0.0.1:8000/redoc`
> **Lưu ý quan trọng:** Ở lần chạy đầu tiên, để có dữ liệu demo (Thư, Trí, Long), hãy sử dụng Endpoint `POST /seed_test_data` trên Swagger UI để tự động nạp vào DB.

---