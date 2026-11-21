from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.core.database import get_db
from backend.app.models import Business, User, AuditLog
from backend.app.schemas.business import BusinessOut, BusinessUpdate
from backend.app.schemas.auth import UserOut
from backend.app.api.deps import get_current_user, get_current_tenant, require_role
from backend.app.core.rbac import UserRole
from backend.app.core.security import get_password_hash

router = APIRouter(prefix="/business", tags=["Business Administration & RBAC"])


@router.get("/current", response_model=BusinessOut)
def get_current_business(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    biz = db.query(Business).filter(Business.id == tenant_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    return biz


@router.put("/current", response_model=BusinessOut)
def update_business_settings(
    update_data: BusinessUpdate,
    tenant_id: int = Depends(get_current_tenant),
    current_user: User = Depends(require_role([UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    biz = db.query(Business).filter(Business.id == tenant_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    if update_data.name is not None:
        biz.name = update_data.name
    if update_data.industry_type is not None:
        biz.industry_type = update_data.industry_type
    if update_data.currency is not None:
        biz.currency = update_data.currency
    if update_data.address is not None:
        biz.address = update_data.address
    if update_data.settings_json is not None:
        biz.settings_json = update_data.settings_json

    db.commit()
    db.refresh(biz)
    return biz


@router.get("/users", response_model=List[UserOut])
def list_business_users(
    tenant_id: int = Depends(get_current_tenant),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(User).filter(User.business_id == tenant_id).all()


@router.post("/users", response_model=UserOut)
def create_business_user(
    user_data: Dict[str, Any],
    tenant_id: int = Depends(get_current_tenant),
    current_user: User = Depends(require_role([UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    email = user_data.get("email", "").lower().strip()
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    new_user = User(
        business_id=tenant_id,
        email=email,
        hashed_password=get_password_hash(user_data.get("password", "password123")),
        full_name=user_data.get("full_name", "Team Member"),
        role=user_data.get("role", "production_manager")
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
