from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.core.database import get_db
from backend.app.models import Material, MaterialIndexMapping, Inventory
from backend.app.schemas.material import (
    MaterialOut, MaterialCreate, MaterialUpdate,
    MaterialIndexMappingCreate, MaterialIndexMappingOut,
    InventoryOut, InventoryUpdate
)
from backend.app.api.deps import get_current_user, get_current_tenant, require_role
from backend.app.core.rbac import UserRole

router = APIRouter(prefix="/materials", tags=["Materials & Inventory"])


@router.get("", response_model=List[MaterialOut])
def list_materials(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Material).filter(Material.business_id == tenant_id).all()


@router.post("", response_model=MaterialOut)
def create_material(
    data: MaterialCreate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PROCUREMENT_MANAGER, UserRole.PRODUCTION_MANAGER])),
    db: Session = Depends(get_db)
):
    mat = Material(business_id=tenant_id, **data.model_dump())
    db.add(mat)
    db.flush()

    # Create initial inventory record
    inv = Inventory(
        business_id=tenant_id,
        material_id=mat.id,
        current_stock=0.0,
        unit=mat.unit,
        weighted_average_cost=mat.standard_cost
    )
    db.add(inv)
    db.commit()
    db.refresh(mat)
    return mat


@router.put("/{material_id}", response_model=MaterialOut)
def update_material(
    material_id: int,
    data: MaterialUpdate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PROCUREMENT_MANAGER, UserRole.FINANCE_MANAGER])),
    db: Session = Depends(get_db)
):
    mat = db.query(Material).filter(Material.id == material_id, Material.business_id == tenant_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(mat, k, v)

    db.commit()
    db.refresh(mat)
    return mat


@router.get("/inventory", response_model=List[InventoryOut])
def list_inventory(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Inventory).filter(Inventory.business_id == tenant_id).all()


@router.put("/inventory/{material_id}", response_model=InventoryOut)
def update_inventory(
    material_id: int,
    data: InventoryUpdate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PRODUCTION_MANAGER, UserRole.PROCUREMENT_MANAGER])),
    db: Session = Depends(get_db)
):
    inv = db.query(Inventory).filter(Inventory.material_id == material_id, Inventory.business_id == tenant_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Inventory record not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(inv, k, v)

    db.commit()
    db.refresh(inv)
    return inv


@router.post("/index-mappings", response_model=MaterialIndexMappingOut)
def create_index_mapping(
    data: MaterialIndexMappingCreate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.FINANCE_MANAGER, UserRole.PROCUREMENT_MANAGER])),
    db: Session = Depends(get_db)
):
    mapping = MaterialIndexMapping(business_id=tenant_id, **data.model_dump())
    db.add(mapping)
    db.commit()
    db.refresh(mapping)
    return mapping


@router.post("/sync-external-prices")
def sync_external_material_prices(
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.FINANCE_MANAGER, UserRole.PROCUREMENT_MANAGER, UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    """
    Automated Market Intelligence Price Sync:
    Fetches the latest official market observations (LME, MCX, WPI, World Bank)
    for all indexed materials of the tenant, applies multiplier + regional location freight basis,
    and updates current_market_price automatically.
    """
    from backend.app.models import Business, MarketObservation
    from backend.app.core.location_benchmarks import get_location_hub

    biz = db.query(Business).filter(Business.id == tenant_id).first()
    hub = get_location_hub(biz.location_hub if biz else "PUNE_MIDC")
    location_freight = hub.get("freight_basis_per_kg", 2.0)

    materials = db.query(Material).filter(Material.business_id == tenant_id).all()
    updated = []

    for m in materials:
        mapping = db.query(MaterialIndexMapping).filter(
            MaterialIndexMapping.business_id == tenant_id,
            MaterialIndexMapping.material_id == m.id
        ).first()

        if not mapping:
            continue

        latest_obs = (
            db.query(MarketObservation)
            .filter(MarketObservation.indicator_code == mapping.indicator_code)
            .order_by(MarketObservation.observation_date.desc())
            .first()
        )

        if not latest_obs:
            continue

        prev_price = m.current_market_price
        freight_to_use = mapping.freight_basis if mapping.freight_basis > 0 else location_freight
        new_price = round(
            (latest_obs.value * mapping.multiplier) + mapping.basis_spread + freight_to_use,
            2
        )
        change_pct = round(((new_price - prev_price) / prev_price * 100.0), 2) if prev_price > 0 else 0.0

        m.current_market_price = new_price

        updated.append({
            "material_id": m.id,
            "material_code": m.code,
            "material_name": m.name,
            "indicator_code": mapping.indicator_code,
            "indicator_value": latest_obs.value,
            "previous_market_price": prev_price,
            "new_market_price": new_price,
            "change_percent": change_pct,
            "location_hub": hub["name"],
            "formula_applied": f"({latest_obs.value} × {mapping.multiplier}) + {mapping.basis_spread} + ₹{freight_to_use} freight"
        })

    db.commit()
    return {
        "status": "success",
        "tenant_id": tenant_id,
        "location_hub": hub["name"],
        "regional_freight_basis": location_freight,
        "synced_count": len(updated),
        "updated_materials": updated
    }
