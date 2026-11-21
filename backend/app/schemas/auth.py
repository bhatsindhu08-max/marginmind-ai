from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    business_id: Optional[int] = None
    business_name: Optional[str] = None
    industry_type: Optional[str] = None


class TokenPayload(BaseModel):
    sub: Optional[str] = None


class UserLogin(BaseModel):
    email: str
    password: str


class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "business_owner"
    business_name: str
    industry_type: str = "metal_steel"
    currency: str = "INR"


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    business_id: Optional[int]
    is_active: bool

    class Config:
        from_attributes = True

