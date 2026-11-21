from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from backend.app.models import Supplier, SupplierQuotation, PurchaseHistory
from backend.app.schemas.supplier import (
    SupplierOut, SupplierCreate, SupplierUpdate,
    SupplierQuotationCreate, SupplierQuotationOut
)
from backend.app.api.deps import get_current_user, get_current_tenant, require_role
from backend.app.core.rbac import UserRole

router = APIRouter(prefix="/suppliers", tags=["Suppliers & Purchasing"])


@router.get("", response_model=List[SupplierOut])
def list_suppliers(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Supplier).filter(Supplier.business_id == tenant_id).all()


@router.post("", response_model=SupplierOut)
def create_supplier(
    data: SupplierCreate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PROCUREMENT_MANAGER])),
    db: Session = Depends(get_db)
):
    supp = Supplier(business_id=tenant_id, **data.model_dump())
    db.add(supp)
    db.commit()
    db.refresh(supp)
    return supp


@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    data: SupplierUpdate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PROCUREMENT_MANAGER])),
    db: Session = Depends(get_db)
):
    supp = db.query(Supplier).filter(Supplier.id == supplier_id, Supplier.business_id == tenant_id).first()
    if not supp:
        raise HTTPException(status_code=404, detail="Supplier not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(supp, k, v)

    db.commit()
    db.refresh(supp)
    return supp


@router.post("/quotations", response_model=SupplierQuotationOut)
def create_quotation(
    data: SupplierQuotationCreate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PROCUREMENT_MANAGER])),
    db: Session = Depends(get_db)
):
    quote = SupplierQuotation(business_id=tenant_id, **data.model_dump())
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote
