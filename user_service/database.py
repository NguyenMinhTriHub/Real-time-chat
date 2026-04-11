from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base

# Chuỗi kết nối đã được thiết lập chuẩn theo docker-compose của cậu
SQLALCHEMY_DATABASE_URL = "postgresql://admin:password@localhost:5432/user_service_db"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Lệnh này sẽ tự động tạo bảng user_profiles và friendships vào Database
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()