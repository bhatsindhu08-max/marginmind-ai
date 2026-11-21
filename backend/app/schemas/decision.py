from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel


class PreparedDecisionBase(BaseModel):
    decision_type: str  # PRICE_ADJUSTMENT, ORDER_EVALUATION, SUPPLIER_SWITCH, PRODUCT_VIABILITY
    title: str
    summary: str
    rationale: str
    affected_entities_json: Dict[str, Any] = {}
    financial_impact_json: Dict[str, Any] = {}
    assumptions_json: Dict[str, Any] = {}
    confidence_level: float = 0.88
    risk_level: str = "MEDIUM"
    recommended_action_json: Dict[str, Any] = {}


class PreparedDecisionCreate(PreparedDecisionBase):
    pass


class DecisionApprovalCreate(BaseModel):
    action_taken: str  # APPROVE, EDIT, REJECT, RECALCULATE
    edited_payload_json: Optional[Dict[str, Any]] = None
    comments: Optional[str] = None


class DecisionApprovalOut(BaseModel):
    id: int
    decision_id: int
    user_id: int
    user_name: Optional[str] = None
    action_taken: str
    original_payload_json: Dict[str, Any]
    edited_payload_json: Optional[Dict[str, Any]]
    comments: Optional[str]
    timestamp: datetime

    class Config:
        from_attributes = True


class PreparedDecisionOut(PreparedDecisionBase):
    id: int
    business_id: int
    status: str
    created_at: datetime
    approvals: List[DecisionApprovalOut] = []

    class Config:
        from_attributes = True
