from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.services.marginguard_service import MarginGuardService
from backend.app.api.deps import get_current_tenant

router = APIRouter(prefix="/marginguard", tags=["MarginGuard Module"])


@router.get("/overview")
def get_marginguard_overview(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    service = MarginGuardService(db, tenant_id)
    return service.get_portfolio_margin_overview()
