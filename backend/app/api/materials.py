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
