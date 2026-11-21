from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from backend.app.models import PreparedDecision, DecisionApproval, User, AuditLog, Product, CustomerOrder


class HumanApprovalService:
    """
    Manages executive decision workflows, edits, approvals, rejections,
    and maintains an immutable audit log.
    Guarantees that no external binding action occurs without human authorization.
    """

    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id

    def process_decision_action(
        self,
        decision_id: int,
        user_id: int,
        action: str,  # APPROVE, EDIT, REJECT, RECALCULATE
        edited_payload: Optional[Dict[str, Any]] = None,
        comments: Optional[str] = None
    ) -> Dict[str, Any]:
        decision = (
            self.db.query(PreparedDecision)
            .filter(
                PreparedDecision.id == decision_id,
                PreparedDecision.business_id == self.business_id
            )
            .first()
        )
        if not decision:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision proposal not found")

        user = self.db.query(User).filter(User.id == user_id).first()
        user_name = user.full_name if user else "Executive User"

        action_upper = action.upper()
        if action_upper not in ["APPROVE", "EDIT", "REJECT", "RECALCULATE"]:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid action: {action}")

        original_snapshot = {
            "title": decision.title,
            "financial_impact": decision.financial_impact_json,
            "recommended_action": decision.recommended_action_json,
            "status": decision.status
        }

        # Update Decision Record Status
        if action_upper == "APPROVE":
            decision.status = "APPROVED"
            # If it's a price adjustment, user has authorized updating the master selling price!
            if decision.decision_type == "PRICE_ADJUSTMENT":
                prod_id = decision.affected_entities_json.get("product_id")
                new_price = decision.financial_impact_json.get("suggested_price")
                if prod_id and new_price:
                    prod = self.db.query(Product).filter(Product.id == prod_id).first()
                    if prod:
                        prod.selling_price = float(new_price)

        elif action_upper == "EDIT":
            decision.status = "APPROVED_WITH_EDITS"
            if edited_payload:
                # Update with executive's edited parameters
                decision.recommended_action_json = edited_payload
                if decision.decision_type == "PRICE_ADJUSTMENT":
                    custom_price = edited_payload.get("new_selling_price")
                    prod_id = decision.affected_entities_json.get("product_id")
                    if custom_price and prod_id:
                        prod = self.db.query(Product).filter(Product.id == prod_id).first()
                        if prod:
                            prod.selling_price = float(custom_price)

        elif action_upper == "REJECT":
            decision.status = "REJECTED"
        elif action_upper == "RECALCULATE":
            decision.status = "RECALCULATION_REQUESTED"

        # Record Approval Audit Entry
        approval_record = DecisionApproval(
            business_id=self.business_id,
            decision_id=decision.id,
            user_id=user_id,
            action_taken=action_upper,
            original_payload_json=original_snapshot,
            edited_payload_json=edited_payload or {},
            comments=comments or f"Decision {action_upper.lower()}d by {user_name}."
        )
        self.db.add(approval_record)

        # Audit Log
        audit = AuditLog(
            business_id=self.business_id,
            user_id=user_id,
            action=f"DECISION_{action_upper}",
            entity_type="PreparedDecision",
            entity_id=decision.id,
            change_summary=f"Decision '{decision.title}' {action_upper.lower()}d by {user_name}. Comments: {comments or 'None'}"
        )
        self.db.add(audit)

        self.db.commit()

        return {
            "success": True,
            "decision_id": decision.id,
            "decision_title": decision.title,
            "new_status": decision.status,
            "action_taken": action_upper,
            "performed_by": user_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "comments": comments
        }

    def get_approval_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        approvals = (
            self.db.query(DecisionApproval)
            .filter(DecisionApproval.business_id == self.business_id)
            .order_by(DecisionApproval.timestamp.desc())
            .limit(limit)
            .all()
        )

        history = []
        for app in approvals:
            dec = self.db.query(PreparedDecision).filter(PreparedDecision.id == app.decision_id).first()
            user = self.db.query(User).filter(User.id == app.user_id).first()
            history.append({
                "approval_id": app.id,
                "decision_id": app.decision_id,
                "decision_title": dec.title if dec else "Archived Decision",
                "decision_type": dec.decision_type if dec else "GENERAL",
                "action_taken": app.action_taken,
                "user_name": user.full_name if user else "Executive User",
                "user_role": user.role if user else "business_owner",
                "original_summary": app.original_payload_json.get("title", ""),
                "edited_payload": app.edited_payload_json,
                "comments": app.comments,
                "timestamp": app.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })
        return history
