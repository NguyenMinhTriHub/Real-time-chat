from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base
import uuid

Base = declarative_base()

class UserProfile(Base):
    __tablename__ = 'user_profiles'
    
    id = Column(UUID(as_uuid=True), primary_key=True)
    display_name = Column(String(100), nullable=False)
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    is_public = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class Friendship(Base):
    __tablename__ = 'friendships'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.id'), nullable=False)
    addressee_id = Column(UUID(as_uuid=True), ForeignKey('user_profiles.id'), nullable=False)
    status = Column(String(20), default='pending')
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())