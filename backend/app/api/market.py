from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.core.database import get_db
from backend.app.models import MarketObservation, MarketEvent
from backend.app.schemas.market import (
    MarketObservationOut, MarketEventOut,
    MarketShockSimulationRequest, MarketShockSimulationResponse
)
from backend.app.services.market_intelligence import MarketIntelligenceService
from backend.app.services.event_intelligence import EventIntelligenceEngine
from backend.app.services.relationship_engine import BusinessRelationshipEngine
from backend.app.services.decision_engine import DecisionPreparationEngine
from backend.app.api.deps import get_current_user, get_current_tenant

router = APIRouter(prefix="/market", tags=["External Market Intelligence"])


@router.get("/summary")
def get_market_summary(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    service = MarketIntelligenceService(db)
    return service.get_latest_indicators_summary(business_id=tenant_id)


@router.get("/history/{indicator_code}")
def get_indicator_history(
    indicator_code: str,
    limit: int = 24,
    db: Session = Depends(get_db)
):
    service = MarketIntelligenceService(db)
    return service.get_indicator_history(indicator_code, limit=limit)


@router.get("/events")
def get_market_events(
    db: Session = Depends(get_db)
):
    events = db.query(MarketEvent).order_by(MarketEvent.published_date.desc()).limit(20).all()
    return [
        {
            "id": ev.id,
            "title": ev.title,
            "summary": ev.summary,
            "event_type": ev.event_type,
            "severity": ev.severity,
            "published_date": ev.published_date.strftime("%Y-%m-%d"),
            "source_name": ev.source_name,
            "source_url": ev.source_url,
            "affected_materials": ev.affected_materials_json,
            "affected_industries": ev.affected_industries_json,
            "confidence_score": ev.confidence_score,
            "is_verified": ev.is_verified
        }
        for ev in events
    ]


@router.post("/simulate-shock", response_model=MarketShockSimulationResponse)
def simulate_market_shock(
    data: MarketShockSimulationRequest,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    """
    Simulates an external market indicator shock (e.g. LME Aluminium +12.0%),
    propagates the impact through internal BOMs and open customer orders,
    and automatically prepares decisions for human review.
    """
    rel_engine = BusinessRelationshipEngine(db, tenant_id)
    prop_res = rel_engine.propagate_market_indicator_change(data.indicator_code, data.percentage_change)

    # Generate prepared decisions
    dec_engine = DecisionPreparationEngine(db, tenant_id)
    prepared_decisions = dec_engine.generate_decisions_from_market_shock(
        indicator_code=data.indicator_code,
        percentage_change=data.percentage_change,
        event_title=f"{data.indicator_code} Shock ({data.percentage_change:+.1f}%)"
    )

    return {
        "indicator_code": data.indicator_code,
        "percentage_change": data.percentage_change,
        "affected_materials": prop_res["affected_materials"],
        "affected_products": prop_res["affected_products"],
        "total_inventory_exposure": prop_res["total_inventory_exposure"],
        "total_order_exposure": prop_res["total_order_exposure"],
        "total_exposure": prop_res["total_exposure"],
        "products_breaching_threshold": prop_res["products_breaching_threshold"],
        "prepared_decision_count": len(prepared_decisions)
    }
