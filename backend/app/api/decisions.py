from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from backend.app.core.database import get_db
from backend.app.models import PreparedDecision, DecisionApproval, User
from backend.app.schemas.decision import PreparedDecisionOut, DecisionApprovalCreate, DecisionApprovalOut
from backend.app.services.approval_service import HumanApprovalService
from backend.app.api.deps import get_current_user, get_current_tenant, require_role
from backend.app.core.rbac import UserRole

router = APIRouter(prefix="/decisions", tags=["Decision Preparation & Human Approval"])


@router.get("/pending", response_model=List[PreparedDecisionOut])
def list_pending_decisions(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return (
        db.query(PreparedDecision)
        .filter(
            PreparedDecision.business_id == tenant_id,
            PreparedDecision.status == "PENDING_APPROVAL"
        )
        .order_by(PreparedDecision.created_at.desc())
        .all()
    )


@router.get("/all", response_model=List[PreparedDecisionOut])
def list_all_decisions(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return (
        db.query(PreparedDecision)
        .filter(PreparedDecision.business_id == tenant_id)
        .order_by(PreparedDecision.created_at.desc())
        .all()
    )


@router.post("/{decision_id}/action")
def act_on_decision(
    decision_id: int,
    approval_data: DecisionApprovalCreate,
    tenant_id: int = Depends(get_current_tenant),
    current_user: User = Depends(require_role([UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    service = HumanApprovalService(db, tenant_id)
    return service.process_decision_action(
        decision_id=decision_id,
        user_id=current_user.id,
        action=approval_data.action_taken,
        edited_payload=approval_data.edited_payload_json,
        comments=approval_data.comments
    )


@router.get("/history")
def get_approval_audit_history(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    service = HumanApprovalService(db, tenant_id)
    return service.get_approval_history()
