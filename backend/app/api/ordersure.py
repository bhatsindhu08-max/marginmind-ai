from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from backend.app.core.database import get_db
from backend.app.services.ordersure_service import OrderSureService
from backend.app.services.order_viability_service import OrderViabilityService
from backend.app.api.deps import get_current_tenant

router = APIRouter(prefix="/ordersure", tags=["OrderSure Module"])


@router.get("/deep-viability")
def evaluate_deep_viability(
    product_id: Optional[int] = Query(None),
    item_name: Optional[str] = Query(None),
    quantity: float = Query(100.0),
    agreed_price: Optional[float] = Query(None),
    delivery_days: int = Query(30),
    available_cash: Optional[float] = Query(None),
    future_price_shock_pct: float = Query(0.0),
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Answers: Is this order profitable? How much money must I spend (Raw Material,
    Labour, Rent, Supply, Time)? Can I afford it with my available cash?
    And should I keep this order if future raw material prices increase?
    """
    service = OrderViabilityService(db, tenant_id)
    return service.evaluate_order(
        product_id=product_id,
        item_name=item_name,
        order_quantity=quantity,
        agreed_unit_price=agreed_price,
        promised_delivery_days=delivery_days,
        available_cash=available_cash,
        future_price_shock_pct=future_price_shock_pct
    )


@router.post("/deep-viability")
def evaluate_deep_viability_post(
    payload: Dict[str, Any] = Body(...),
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    service = OrderViabilityService(db, tenant_id)
    return service.evaluate_order(
        product_id=payload.get("product_id"),
        item_name=payload.get("item_name"),
        order_quantity=float(payload.get("quantity", 100.0)),
        agreed_unit_price=float(payload["agreed_price"]) if payload.get("agreed_price") is not None else None,
        promised_delivery_days=int(payload.get("delivery_days", 30)),
        available_cash=float(payload["available_cash"]) if payload.get("available_cash") is not None else None,
        future_price_shock_pct=float(payload.get("future_price_shock_pct", 0.0)),
        custom_material_cost_per_unit=float(payload["custom_material_cost"]) if payload.get("custom_material_cost") is not None else None
    )


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
