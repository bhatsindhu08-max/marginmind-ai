from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from backend.app.core.database import get_db
from backend.app.services.ordersure_service import OrderSureService
from backend.app.api.deps import get_current_tenant

router = APIRouter(prefix="/ordersure", tags=["OrderSure Module"])


@router.get("/evaluate")
def evaluate_new_order(
    product_id: int = Query(...),
    quantity: float = Query(...),
    agreed_price: float = Query(...),
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    service = OrderSureService(db, tenant_id)
    return service.evaluate_order(product_id=product_id, order_quantity=quantity, agreed_unit_price=agreed_price)


@router.get("/open-orders")
def evaluate_open_orders(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    service = OrderSureService(db, tenant_id)
    return service.evaluate_all_open_orders()
