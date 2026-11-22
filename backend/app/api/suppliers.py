from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from datetime import datetime, timezone, timedelta
from backend.app.models import Supplier, SupplierQuotation, PurchaseHistory, Material
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
    current_user = Depends(require_role([UserRole.PROCUREMENT_MANAGER, UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    q_price = data.quote_price
    m_name = (data.material_name or "").strip()
    m_id = data.material_id
    u_val = data.unit or "kg"

    supp_dict = data.model_dump(exclude={"material_name", "material_id", "quote_price", "unit"})
    supp = Supplier(business_id=tenant_id, **supp_dict)
    db.add(supp)
    db.flush()

    if q_price is not None and float(q_price) > 0:
        price_val = float(q_price)
        mat = None
        if m_id:
            mat = db.query(Material).filter(Material.id == m_id, Material.business_id == tenant_id).first()
        elif m_name:
            mat = db.query(Material).filter(Material.name.ilike(f"%{m_name}%"), Material.business_id == tenant_id).first()
            if not mat:
                mat = Material(
                    business_id=tenant_id,
                    code=f"MAT-{supp.code[:6]}",
                    name=m_name,
                    category="Raw Material",
                    unit=u_val,
                    standard_cost=price_val,
                    current_market_price=price_val,
                    min_safety_stock=100.0,
                    is_active=True
                )
                db.add(mat)
                db.flush()

        if mat:
            quote = SupplierQuotation(
                business_id=tenant_id,
                supplier_id=supp.id,
                material_id=mat.id,
                quotation_ref=f"QUOTE-{supp.code}",
                quote_price=price_val,
                currency="INR",
                min_order_qty=100.0,
                valid_from=datetime.now(timezone.utc),
                valid_to=datetime.now(timezone.utc) + timedelta(days=90),
                is_active=True
            )
            db.add(quote)

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
