import json
import uuid
import jwt
from fastapi import FastAPI, Depends, UploadFile, File, Response, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
import redis
from minio import Minio

from models import UserProfile, Friendship
from schemas import StandardResponse, UserPublic, ProfileUpdate, FriendAction
from database import get_db

app = FastAPI()

@app.get("/", include_in_schema=False)
def read_root():
    return RedirectResponse(url="/docs")

redis_client = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)

minio_client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

# --- Cấu hình MinIO Public ---
policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {"AWS": ["*"]},
            "Action": ["s3:GetBucketLocation", "s3:ListBucket"],
            "Resource": ["arn:aws:s3:::avatars"]
        },
        {
            "Effect": "Allow",
            "Principal": {"AWS": ["*"]},
            "Action": ["s3:GetObject"],
            "Resource": ["arn:aws:s3:::avatars/*"]
        }
    ]
}
try:
    if not minio_client.bucket_exists("avatars"):
        minio_client.make_bucket("avatars")
    minio_client.set_bucket_policy("avatars", json.dumps(policy))
    print("✅ Cấu hình MinIO Public thành công!")
except Exception as e:
    print(f"❌ Lỗi cấu hình MinIO: {e}")

SECRET_KEY = "SECRET_YOUR_TEAM_CHOSE" # Key này phải khớp với Auth Service

# --- HÀM XÁC THỰC NGƯỜI DÙNG (Bản chuẩn cho Demo MVP) ---
def get_current_user_id(request: Request) -> str:
    # 1. ƯU TIÊN: Kiểm tra Header giả lập từ Dropdown React (X-Mock-User)
    # Cách này giúp cậu "biến hình" giữa Thư, Trí, Tấn, Long cực nhanh khi demo
    mock_id = request.headers.get("X-Mock-User")
    if mock_id:
        return mock_id

    # 2. PHỤ: Kiểm tra Token JWT (Khi nào nhóm ráp Auth Service thì dùng cái này)
    auth_header = request.headers.get("Authorization")
    if auth_header:
        try:
            token = auth_header.split(" ")[1]
            # SECRET_KEY phải khai báo ở trên rồi nhé cậu
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            return payload.get("user_id")
        except:
            pass # Nếu token lỗi hoặc hết hạn, nó sẽ chạy xuống bước 3
    
    # 3. MẶC ĐỊNH: Nếu không có gì, trả về ID của Thư (ID chủ lực để cậu test)
    return "11111111-1111-1111-1111-111111111111"

def check_online_status(user_id: str) -> bool:
    return redis_client.exists(f"user:online:{user_id}") == 1

@app.get("/api/users/me", response_model=StandardResponse)
def get_my_profile(response: Response, db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    user = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    if not user:
        response.status_code = 404
        return StandardResponse(success=False, error="NOT_FOUND", message="Không tìm thấy thông tin hồ sơ người dùng.")
    
    data = {
        "id": str(user.id),
        "email": "user@example.com", 
        "displayName": user.display_name,
        "avatarUrl": user.avatar_url,
        "bio": user.bio,
        "isOnline": check_online_status(str(user.id)),
        "createdAt": user.created_at
    }
    return StandardResponse(success=True, data=data, message="Tải thông tin cá nhân thành công.")

@app.patch("/api/users/me", response_model=StandardResponse)
def update_profile(update_data: ProfileUpdate, response: Response, db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    user = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    if update_data.displayName: user.display_name = update_data.displayName
    if update_data.bio is not None: user.bio = update_data.bio
    db.commit()
    db.refresh(user)
    return StandardResponse(success=True, data={"id": str(user.id)}, message="Thông tin hồ sơ đã được cập nhật.")

@app.post("/api/users/me/avatar", response_model=StandardResponse)
def upload_avatar(response: Response, avatar: UploadFile = File(...), db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    if not avatar.content_type.startswith("image/"):
        response.status_code = 400
        return StandardResponse(success=False, error="INVALID_FILE_TYPE", message="Định dạng tập tin không hợp lệ. Vui lòng chọn ảnh.")
    
    file_data = avatar.file.read()
    file_size = len(file_data)
    avatar.file.seek(0)
    file_name = f"{current_user_id}_{avatar.filename}"
    minio_client.put_object("avatars", file_name, avatar.file, file_size, content_type=avatar.content_type)
    
    avatar_url = f"http://localhost:9000/avatars/{file_name}"
    user = db.query(UserProfile).filter(UserProfile.id == current_user_id).first()
    user.avatar_url = avatar_url
    db.commit()
    return StandardResponse(success=True, data={"avatarUrl": avatar_url}, message="Ảnh đại diện đã được cập nhật.")

@app.get("/api/users/friends", response_model=StandardResponse)
def get_friends_list(db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    friendships = db.query(Friendship).filter(
        and_(or_(Friendship.requester_id == current_user_id, Friendship.addressee_id == current_user_id),
             Friendship.status == 'accepted')
    ).all()
    
    friends_data = []
    for f in friendships:
        f_id = f.addressee_id if str(f.requester_id) == current_user_id else f.requester_id
        u = db.query(UserProfile).filter(UserProfile.id == f_id).first()
        friends_data.append({
            "id": str(u.id), "displayName": u.display_name, "avatarUrl": u.avatar_url,
            "isOnline": check_online_status(str(u.id)), "friendshipId": str(f.id)
        })
    return StandardResponse(success=True, data={"friends": friends_data}, message="Tải danh sách bạn bè thành công.")

@app.get("/api/users/search", response_model=StandardResponse)
def search_users(q: str, response: Response, limit: int = 10, db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    if len(q) < 2:
        response.status_code = 400
        return StandardResponse(success=False, error="KEYWORD_TOO_SHORT", message="Vui lòng nhập từ khóa tìm kiếm dài hơn (tối thiểu 2 ký tự).")
        
    users = db.query(UserProfile).filter(
        UserProfile.display_name.ilike(f"%{q}%"),
        UserProfile.is_public == True,
        UserProfile.id != current_user_id
    ).limit(limit).all()
    
    results = [{"id": str(u.id), "displayName": u.display_name, "avatarUrl": u.avatar_url} for u in users]
    return StandardResponse(success=True, data={"users": results, "total": len(results)}, message="Kết quả tìm kiếm phù hợp.")

@app.get("/api/users/friends/pending", response_model=StandardResponse)
def get_pending_requests(db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    requests = db.query(Friendship).filter(
        Friendship.addressee_id == current_user_id,
        Friendship.status == 'pending'
    ).all()
    
    results = []
    for req in requests:
        u = db.query(UserProfile).filter(UserProfile.id == req.requester_id).first()
        results.append({
            "friendshipId": str(req.id), "requesterId": str(u.id),
            "displayName": u.display_name, "avatarUrl": u.avatar_url
        })
    return StandardResponse(success=True, data={"pendingRequests": results}, message="Đã tải các yêu cầu kết bạn đang chờ.")

# --- Gửi lời mời kết bạn (ĐÃ CẬP NHẬT CÂU CHỮ) ---
@app.post("/api/users/{target_id}/friends", response_model=StandardResponse)
def send_friend_request(target_id: str, response: Response, db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    if current_user_id == target_id:
        response.status_code = 400
        return StandardResponse(success=False, error="SELF_REQUEST", message="Bạn không thể gửi yêu cầu kết bạn cho chính mình.")
        
    existing = db.query(Friendship).filter(
        or_(
            and_(Friendship.requester_id == current_user_id, Friendship.addressee_id == target_id),
            and_(Friendship.requester_id == target_id, Friendship.addressee_id == current_user_id)
        )
    ).first()
    
    if existing:
        if existing.status == 'accepted':
            response.status_code = 400
            return StandardResponse(success=False, error="ALREADY_FRIENDS", message="Hai bạn đã trở thành bạn bè.")
        elif existing.status == 'pending':
            response.status_code = 400
            return StandardResponse(success=False, error="REQUEST_PENDING", message="Yêu cầu kết bạn đang chờ đối phương xác nhận.")

    new_req = Friendship(requester_id=current_user_id, addressee_id=target_id, status='pending')
    db.add(new_req)
    db.commit()
    return StandardResponse(success=True, data=None, message="Đã gửi yêu cầu kết bạn thành công.")

@app.patch("/api/users/friends/{friendship_id}", response_model=StandardResponse)
def handle_friend_request(friendship_id: str, action_data: FriendAction, response: Response, db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    friendship = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    
    if not friendship:
        response.status_code = 404
        return StandardResponse(success=False, error="NOT_FOUND", message="Yêu cầu kết bạn không tồn tại hoặc đã bị hủy.")
        
    if str(friendship.addressee_id) != current_user_id:
        response.status_code = 403
        return StandardResponse(success=False, error="FORBIDDEN", message="Bạn không có quyền thực hiện thao tác này.")
        
    if action_data.action == "accept":
        friendship.status = "accepted"
        msg = "Đã chấp nhận yêu cầu kết bạn."
    else:
        friendship.status = "rejected"
        msg = "Đã từ chối yêu cầu kết bạn."
        
    db.commit()
    return StandardResponse(success=True, data=None, message=msg)

# --- 1. Tính năng Hủy kết bạn (Mới) ---
@app.delete("/api/users/friends/{friendship_id}", response_model=StandardResponse)
def unfriend(friendship_id: str, db: Session = Depends(get_db), current_user_id: str = Depends(get_current_user_id)):
    friendship = db.query(Friendship).filter(Friendship.id == friendship_id).first()
    
    if not friendship:
        return StandardResponse(success=False, error="NOT_FOUND", message="Mối quan hệ không tồn tại.")
        
    # Kiểm tra quyền: Chỉ người trong cuộc mới được hủy
    if str(friendship.requester_id) != current_user_id and str(friendship.addressee_id) != current_user_id:
        return StandardResponse(success=False, error="FORBIDDEN", message="Bạn không có quyền thực hiện thao tác này.")
    
    db.delete(friendship)
    db.commit()
    return StandardResponse(success=True, data=None, message="Đã hủy kết bạn thành công.")

# --- 2. API Cập nhật Trạng thái cho Chat Service gọi (Mới) ---
@app.post("/api/users/status")
def update_user_status(user_id: str, status: str):
    # status truyền vào là "online" hoặc "offline"
    if status == "online":
        # Lưu vào Redis, để 300 giây (5 phút) tự xóa nếu không refresh
        redis_client.set(f"user:online:{user_id}", "true", ex=300)
    else:
        redis_client.delete(f"user:online:{user_id}")
    return {"success": True, "message": f"User {user_id} is now {status}"}

@app.get("/api/users/{userId}", response_model=StandardResponse)
def get_user_profile(userId: str, response: Response, db: Session = Depends(get_db)):
    user = db.query(UserProfile).filter(UserProfile.id == userId).first()
    if not user:
        response.status_code = 404
        return StandardResponse(success=False, error="NOT_FOUND", message="Không tìm thấy người dùng này.")
    return StandardResponse(success=True, data={"id": str(user.id), "displayName": user.display_name, "avatarUrl": user.avatar_url}, message="Tải hồ sơ thành công.")

@app.post("/seed_test_data")
def seed_test_data(db: Session = Depends(get_db)):
    try:
        db.query(UserProfile).delete()
        members = [
            {"id": uuid.UUID("11111111-1111-1111-1111-111111111111"), "name": "Phạm Thị Anh Thư", "bio": "Interaction Design Student"},
            {"id": uuid.UUID("22222222-2222-2222-2222-222222222222"), "name": "Nguyễn Minh Trí", "bio": "Team Member"},
            {"id": uuid.UUID("33333333-3333-3333-3333-333333333333"), "name": "Nguyễn Trọng Tấn", "bio": "Team Member"},
            {"id": uuid.UUID("44444444-4444-4444-4444-444444444444"), "name": "Nguyễn Ngọc Quốc Long", "bio": "Team Member"},
        ]

        for m in members:
            new_user = UserProfile(id=m["id"], display_name=m["name"], bio=m["bio"])
            db.add(new_user)
        
        db.commit()
        return {"success": True, "message": "Dữ liệu đội ngũ đã được thiết lập sẵn sàng."}
    except Exception as e:
        db.rollback()
        return {"success": False, "error": str(e)}