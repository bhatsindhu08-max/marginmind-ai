from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from backend.app.core.database import get_db
from backend.app.models import CustomerOrder, Product
from backend.app.schemas.order import CustomerOrderOut, CustomerOrderCreate, CustomerOrderUpdate
from backend.app.api.deps import get_current_user, get_current_tenant, require_role
from backend.app.core.rbac import UserRole

router = APIRouter(prefix="/orders", tags=["Customer Orders"])


@router.get("", response_model=List[CustomerOrderOut])
def list_customer_orders(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(CustomerOrder).filter(CustomerOrder.business_id == tenant_id).all()


@router.post("", response_model=CustomerOrderOut)
def create_customer_order(
    data: CustomerOrderCreate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == data.product_id, Product.business_id == tenant_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    order = CustomerOrder(business_id=tenant_id, **data.model_dump())
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@router.put("/{order_id}", response_model=CustomerOrderOut)
def update_customer_order(
    order_id: int,
    data: CustomerOrderUpdate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.FINANCE_MANAGER, UserRole.PRODUCTION_MANAGER])),
    db: Session = Depends(get_db)
):
    order = db.query(CustomerOrder).filter(CustomerOrder.id == order_id, CustomerOrder.business_id == tenant_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(order, k, v)

    db.commit()
    db.refresh(order)
    return order
