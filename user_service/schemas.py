from pydantic import BaseModel, Field
from typing import Optional, List, Generic, TypeVar, Any
from uuid import UUID
from datetime import datetime

T = TypeVar('T')

class StandardResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    message: str

class UserPublic(BaseModel):
    id: str
    displayName: str
    avatarUrl: Optional[str] = None
    isOnline: bool
    lastSeen: Optional[datetime] = None

class ProfileUpdate(BaseModel):
    displayName: Optional[str] = Field(default=None, max_length=100)
    bio: Optional[str] = None
    isPublic: Optional[bool] = None

class FriendAction(BaseModel):
    action: str

class FriendResponse(UserPublic):
    friendshipId: str
    since: datetime