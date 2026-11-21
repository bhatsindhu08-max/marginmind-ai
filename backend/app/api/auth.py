from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
import re
from backend.app.core.database import get_db
from backend.app.core.security import verify_password, get_password_hash, create_access_token
from backend.app.core.industry_templates import list_templates, get_template
from backend.app.models import User, Business
from backend.app.schemas.auth import Token, UserRegister, UserLogin, UserOut
from backend.app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication & Onboarding"])


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")

    business = db.query(Business).filter(Business.id == user.business_id).first() if user.business_id else None

    access_token = create_access_token(subject=str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "business_id": user.business_id,
        "business_name": business.name if business else None,
        "industry_type": business.industry_type if business else None
    }


@router.post("/register", response_model=Token)
def register(
    data: UserRegister,
    db: Session = Depends(get_db)
):
    existing_user = db.query(User).filter(User.email == data.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Generate slug for business
    slug = re.sub(r"[^a-zA-Z0-9]+", "-", data.business_name.lower()).strip("-")
    existing_biz = db.query(Business).filter(Business.slug == slug).first()
    if existing_biz:
        slug = f"{slug}-{int(datetime.now().timestamp())}"

    business = Business(
        name=data.business_name,
        slug=slug,
        industry_type=data.industry_type,
        currency=data.currency,
        settings_json={"default_target_margin": 25.0, "critical_margin_threshold": 16.0}
    )
    db.add(business)
    db.flush()

    user = User(
        business_id=business.id,
        email=data.email.lower().strip(),
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        role=data.role
    )
    db.add(user)
    db.commit()

    access_token = create_access_token(subject=str(user.id))
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "business_id": business.id,
        "business_name": business.name,
        "industry_type": business.industry_type
    }


@router.get("/me", response_model=UserOut)
def get_current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.get("/templates")
def get_industry_templates():
    return list_templates()
