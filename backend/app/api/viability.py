from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.services.viability_service import ProductViabilityService
from backend.app.api.deps import get_current_tenant

router = APIRouter(prefix="/viability", tags=["Product Viability & Price Simulation"])


@router.get("/{product_id}")
def assess_product_viability(
    product_id: int,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    service = ProductViabilityService(db, tenant_id)
    return service.assess_product_viability(product_id)


@router.get("/{product_id}/simulate-price")
def simulate_price(
    product_id: int,
    new_price: float = Query(...),
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    service = ProductViabilityService(db, tenant_id)
    return service.simulate_price_adjustment(product_id, new_price)
