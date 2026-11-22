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
        old_ind = biz.industry_type
        biz.industry_type = update_data.industry_type
        if old_ind != update_data.industry_type:
            from backend.app.models import Product
            if db.query(Product).filter(Product.business_id == tenant_id).count() == 0:
                norm_industry = update_data.industry_type.lower().strip()
                if norm_industry in ["textile_garment", "textile_garments", "textile", "garment", "apparel"]:
                    from backend.app.seeds.textile_demo import seed_textile_demonstration
                    seed_textile_demonstration(db, business_id=biz.id)
                elif norm_industry in ["electronics_assembly", "electronics", "smt"]:
                    from backend.app.seeds.electronics_demo import seed_electronics_demonstration
                    seed_electronics_demonstration(db, business_id=biz.id)
                elif norm_industry in ["food_processing", "food", "agri"]:
                    from backend.app.seeds.food_demo import seed_food_demonstration
                    seed_food_demonstration(db, business_id=biz.id)
                elif norm_industry in ["metal_steel", "metal", "steel"]:
                    from backend.app.seeds.metal_demo import seed_metal_demonstration
                    seed_metal_demonstration(db, business_id=biz.id)
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


@router.get("/locations")
def list_available_locations():
    """Lists pre-configured Indian manufacturing clusters with wage benchmarks and freight rates."""
    from backend.app.core.location_benchmarks import list_location_hubs
    return list_location_hubs()


@router.get("/location")
def get_current_business_location(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """Returns current enterprise manufacturing location hub and regional cost assumptions."""
    from backend.app.core.location_benchmarks import get_location_hub
    biz = db.query(Business).filter(Business.id == tenant_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")
    hub = get_location_hub(biz.location_hub or "PUNE_MIDC")
    return {
        "business_id": biz.id,
        "business_name": biz.name,
        "address": biz.address,
        "location_hub_id": biz.location_hub,
        "location_hub": hub,
        "regional_wage_benchmark": hub.get("daily_wage_benchmark", 750.0),
        "freight_basis_per_kg": hub.get("freight_basis_per_kg", 2.0)
    }


@router.put("/location")
def update_business_location(
    data: Dict[str, Any],
    tenant_id: int = Depends(get_current_tenant),
    current_user: User = Depends(require_role([UserRole.BUSINESS_OWNER, UserRole.FINANCE_MANAGER])),
    db: Session = Depends(get_db)
):
    """
    Updates enterprise manufacturing location hub and optionally calibrates
    worker wages across all products to match the new location's wage benchmark.
    """
    from backend.app.core.location_benchmarks import get_location_hub
    from backend.app.models import ProductionCost
    biz = db.query(Business).filter(Business.id == tenant_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    new_hub_id = data.get("location_hub")
    if new_hub_id:
        hub = get_location_hub(new_hub_id)
        biz.location_hub = new_hub_id

        if data.get("address"):
            biz.address = data["address"]

        # If calibrate_wages is true, update wage_per_worker_daily across all products
        if data.get("calibrate_wages", True):
            target_wage = float(data.get("custom_daily_wage") or hub.get("daily_wage_benchmark", 750.0))
            costs = db.query(ProductionCost).filter(ProductionCost.business_id == tenant_id).all()
            for c in costs:
                c.wage_per_worker_daily = target_wage

        db.commit()
        db.refresh(biz)
        return {
            "status": "success",
            "message": f"Manufacturing hub updated to {hub['name']}",
            "location_hub": hub,
            "business": {
                "id": biz.id,
                "name": biz.name,
                "location_hub": biz.location_hub,
                "address": biz.address
            }
        }
    raise HTTPException(status_code=400, detail="location_hub is required")


@router.get("/opex")
def get_plant_opex(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Returns the company's plant-level operating expenses (Rent, Water, Power, Admin)
    and per-unit overhead absorption calculation.
    """
    biz = db.query(Business).filter(Business.id == tenant_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    settings = biz.settings_json or {}
    opex = settings.get("plant_opex", {
        "monthly_rent": 120000.0,
        "monthly_water_bill": 18000.0,
        "monthly_electricity_bill": 75000.0,
        "monthly_maintenance_admin": 45000.0,
        "monthly_production_units": 8000.0,
    })

    total_monthly = (
        float(opex.get("monthly_rent", 0)) +
        float(opex.get("monthly_water_bill", 0)) +
        float(opex.get("monthly_electricity_bill", 0)) +
        float(opex.get("monthly_maintenance_admin", 0))
    )
    units = max(float(opex.get("monthly_production_units", 1)), 1.0)
    unit_overhead = round(total_monthly / units, 2)

    return {
        "plant_opex": opex,
        "total_monthly_expenses": round(total_monthly, 2),
        "monthly_production_units": units,
        "calculated_unit_overhead": unit_overhead,
        "currency": biz.currency or "INR"
    }


@router.put("/opex")
def update_plant_opex(
    data: Dict[str, Any],
    tenant_id: int = Depends(get_current_tenant),
    current_user: User = Depends(require_role([UserRole.BUSINESS_OWNER, UserRole.FINANCE_MANAGER])),
    db: Session = Depends(get_db)
):
    """
    Updates the plant monthly bills (Rent, Water, Electricity, Admin)
    and optionally distributes the resulting unit overhead across all products.
    """
    from backend.app.models import ProductionCost
    biz = db.query(Business).filter(Business.id == tenant_id).first()
    if not biz:
        raise HTTPException(status_code=404, detail="Business not found")

    settings = dict(biz.settings_json or {})
    opex = {
        "monthly_rent": float(data.get("monthly_rent", 0)),
        "monthly_water_bill": float(data.get("monthly_water_bill", 0)),
        "monthly_electricity_bill": float(data.get("monthly_electricity_bill", 0)),
        "monthly_maintenance_admin": float(data.get("monthly_maintenance_admin", 0)),
        "monthly_production_units": max(float(data.get("monthly_production_units", 1)), 1.0),
    }

    total_monthly = (
        opex["monthly_rent"] +
        opex["monthly_water_bill"] +
        opex["monthly_electricity_bill"] +
        opex["monthly_maintenance_admin"]
    )
    units = opex["monthly_production_units"]
    unit_overhead = round(total_monthly / units, 2)
    opex["calculated_unit_overhead"] = unit_overhead

    settings["plant_opex"] = opex
    biz.settings_json = settings

    # If apply_to_products is True, update fixed_overhead_per_unit in all ProductionCosts
    updated_prods = 0
    if data.get("apply_to_products", True):
        costs = db.query(ProductionCost).filter(ProductionCost.business_id == tenant_id).all()
        for c in costs:
            c.fixed_overhead_per_unit = unit_overhead
            updated_prods += 1

    db.commit()
    db.refresh(biz)

    return {
        "status": "success",
        "message": f"Plant OPEX updated. Unit overhead ₹{unit_overhead} allocated.",
        "plant_opex": opex,
        "total_monthly_expenses": round(total_monthly, 2),
        "calculated_unit_overhead": unit_overhead,
        "updated_products_count": updated_prods
    }
