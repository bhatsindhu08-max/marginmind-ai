from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.services.supplyshock_service import SupplyShockService
from backend.app.api.deps import get_current_tenant

router = APIRouter(prefix="/supplyshock", tags=["SupplyShock Module"])


@router.get("/vulnerabilities")
def get_supply_vulnerabilities(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    service = SupplyShockService(db, tenant_id)
    return service.assess_supply_vulnerabilities()
