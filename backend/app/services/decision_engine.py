from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models import PreparedDecision, DecisionApproval, Product, CustomerOrder, User, Material
from backend.app.services.relationship_engine import BusinessRelationshipEngine
from backend.app.services.financial_engine import FinancialCalculationEngine


class DecisionPreparationEngine:
    """
    Decision Preparation Engine for MarginMind AI.
    Prepares evidence-backed business proposals with complete financial dossiers,
    alternative options, and uncertainty bounds for human executive approval.
    """

    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id

    def generate_decisions_from_market_shock(
        self,
        indicator_code: str,
        percentage_change: float,
        event_title: str
    ) -> List[Dict[str, Any]]:
        """
        Analyzes market shock, identifies breached products and risky orders,
        and generates formal prepared decision proposals.
        """
        rel_engine = BusinessRelationshipEngine(self.db, self.business_id)
        prop_res = rel_engine.propagate_market_indicator_change(indicator_code, percentage_change)

        prepared = []

        # 1. Product Selling Price Revision Proposals
        for prod_data in prop_res["affected_products"]:
            if prod_data["is_critical_breach"] or prod_data["margin_erosion_points"] > 4.0:
                title = f"Revise Selling Price for {prod_data['product_name']}"
                summary = (
                    f"Due to a {percentage_change:+.1f}% shift in {indicator_code} ({event_title}), "
                    f"unit cost rises by INR {prod_data['unit_cost_increase']:.2f}, causing gross margin "
                    f"to erode from {prod_data['previous_margin_percent']:.1f}% to {prod_data['new_margin_percent']:.1f}%. "
                    f"A price adjustment to INR {prod_data['suggested_new_price']:.2f} is proposed to restore target margin."
                )
                rationale = (
                    f"Material cost pass-through is necessary to preserve enterprise cash flow. "
                    f"Current selling price of INR {prod_data['selling_price']:.2f} will breach the critical "
                    f"profitability threshold of the product catalog."
                )

                dec = PreparedDecision(
                    business_id=self.business_id,
                    decision_type="PRICE_ADJUSTMENT",
                    title=title,
                    summary=summary,
                    rationale=rationale,
                    affected_entities_json={
                        "product_id": prod_data["product_id"],
                        "product_code": prod_data["product_code"],
                        "product_name": prod_data["product_name"],
                        "sku": prod_data["sku"],
                        "indicator_code": indicator_code,
                        "open_orders_affected": len(prod_data["open_orders"])
                    },
                    financial_impact_json={
                        "current_price": prod_data["selling_price"],
                        "suggested_price": prod_data["suggested_new_price"],
                        "price_delta": round(prod_data["suggested_new_price"] - prod_data["selling_price"], 2),
                        "unit_cost_before": prod_data["previous_unit_cost"],
                        "unit_cost_after": prod_data["new_unit_cost"],
                        "margin_before_pct": prod_data["previous_margin_percent"],
                        "margin_after_pct": prod_data["new_margin_percent"],
                        "margin_restored_pct": 25.0
                    },
                    assumptions_json={
                        "market_indicator": indicator_code,
                        "shock_magnitude_pct": percentage_change,
                        "event_trigger": event_title,
                        "overhead_inflation_rate": "3.5% p.a."
                    },
                    confidence_level=0.92,
                    risk_level="HIGH" if prod_data["is_critical_breach"] else "MEDIUM",
                    status="PENDING_APPROVAL",
                    recommended_action_json={
                        "action": "UPDATE_SELLING_PRICE",
                        "product_id": prod_data["product_id"],
                        "new_selling_price": prod_data["suggested_new_price"],
                        "effective_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
                        "alternative_options": [
                            "Absorb cost increase in short term by dipping into existing inventory buffer.",
                            "Renegotiate with primary suppliers for a 30-day price hold.",
                            "Split price increase 50/50 with customer under long-term contract."
                        ]
                    }
                )
                self.db.add(dec)
                self.db.flush()
                prepared.append(dec)

        # 2. Customer Order Review Proposals
        for prod_data in prop_res["affected_products"]:
            for ord in prod_data["open_orders"]:
                if ord["shocked_margin"] < 15.0 or ord["recommendation"] in ["VERIFY", "RISKY"]:
                    title = f"Review Open Order {ord['order_number']} ({ord['customer_name']})"
                    summary = (
                        f"Order {ord['order_number']} for {ord['quantity']} units faces an estimated cost inflation "
                        f"of INR {ord['cost_impact']:.2f}. Projected margin drops from {ord['current_margin']:.1f}% "
                        f"to {ord['shocked_margin']:.1f}%."
                    )
                    rationale = (
                        f"Contracted selling price does not include an index-linked escalation clause. "
                        f"Executing at current spot prices threatens order-level gross contribution."
                    )

                    dec = PreparedDecision(
                        business_id=self.business_id,
                        decision_type="ORDER_EVALUATION",
                        title=title,
                        summary=summary,
                        rationale=rationale,
                        affected_entities_json={
                            "order_id": ord["order_id"],
                            "order_number": ord["order_number"],
                            "customer_name": ord["customer_name"],
                            "product_name": prod_data["product_name"],
                            "quantity": ord["quantity"]
                        },
                        financial_impact_json={
                            "order_quantity": ord["quantity"],
                            "agreed_price": ord["agreed_price"],
                            "cost_impact_inr": ord["cost_impact"],
                            "projected_order_margin": ord["shocked_margin"],
                            "previous_margin": ord["current_margin"]
                        },
                        assumptions_json={
                            "market_event": event_title,
                            "spot_procurement_required": True
                        },
                        confidence_level=0.90,
                        risk_level="HIGH" if ord["shocked_margin"] < 10.0 else "MEDIUM",
                        status="PENDING_APPROVAL",
                        recommended_action_json={
                            "action": "NEGOTIATE_SURCHARGE_OR_EXPEDITE",
                            "order_id": ord["order_id"],
                            "suggested_surcharge_per_unit": round(ord["cost_impact"] / ord["quantity"], 2) if ord["quantity"] > 0 else 0.0,
                            "alternative_options": [
                                "Fulfill order from existing safety stock without applying surcharge.",
                                "Request 15-day delivery extension to wait for raw material price stabilization.",
                                "Cancel order under commercial force majeure clause if customer rejects surcharge."
                            ]
                        }
                    )
                    self.db.add(dec)
                    self.db.flush()
                    prepared.append(dec)

        self.db.commit()
        return [
            {
                "id": d.id,
                "title": d.title,
                "decision_type": d.decision_type,
                "summary": d.summary,
                "status": d.status,
                "confidence_level": d.confidence_level,
                "risk_level": d.risk_level
            }
            for d in prepared
        ]
