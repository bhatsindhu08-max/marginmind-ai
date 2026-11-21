from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models import MarketEvent, Material, Product, BOM, BOMItem
from backend.app.services.relationship_engine import BusinessRelationshipEngine


class EventIntelligenceEngine:
    """
    AI Event Intelligence Engine.
    Classifies external market shifts, extracts affected entities, and connects them
    to internal company BOMs, inventory, and customer commitments.
    Maintains rigorous epistemic classification:
    - Confirmed Facts (CBIC notifications, published official trade gazettes)
    - Market Signals (Spot price surges, shipping freight anomalies)
    - Model Predictions (Conditional time-series forecast envelopes)
    - Business Calculations (Deterministic internal exposure)
    - AI Interpretations (Suggested operational options)
    """

    EVENT_TAXONOMY = {
        "POLICY_TARIFF": "Government policy, customs duty change, or anti-dumping regulation.",
        "COMMODITY_SPIKE": "Significant spot or futures commodity price acceleration.",
        "SUPPLY_DISRUPTION": "Smelter shutdown, port congestion, or severe force majeure.",
        "CURRENCY_SHIFT": "Forex volatility impacting import raw materials or export realizations."
    }

    def __init__(self, db: Session):
        self.db = db

    def seed_initial_events(self):
        """Seeds realistic historical events relevant to Indian manufacturing."""
        count = self.db.query(MarketEvent).count()
        if count > 0:
            return

        events = [
            MarketEvent(
                title="Ministry of Finance Notifies 7.5% Customs Duty Revision on Select Primary Metals",
                summary="Official Gazette notification imposes an import tariff increase on primary aluminium billets and cold-rolled stainless sheets to safeguard domestic primary producers.",
                event_type="POLICY_TARIFF",
                severity="HIGH",
                published_date=datetime.now(timezone.utc),
                source_name="Central Board of Indirect Taxes and Customs (CBIC Notification No. 18/2026-Customs)",
                source_url="https://www.cbic.gov.in/customs/notifications",
                affected_materials_json=["Aluminium Alloy Billet (6061-T6)", "Stainless Steel (SS-304/SS-316)"],
                affected_industries_json=["metal_steel", "electronics_assembly"],
                confidence_score=0.98,
                is_verified=True
            ),
            MarketEvent(
                title="European Smelter Curtailments Drive 12% Surge in LME Aluminium Cash Settlements",
                summary="High natural gas input tariffs trigger power-rationing in central European alumina refineries, reducing spot availability and expanding prompt delivery premia.",
                event_type="COMMODITY_SPIKE",
                severity="CRITICAL",
                published_date=datetime.now(timezone.utc),
                source_name="London Metal Exchange & World Bank Pink Sheet Intelligence",
                source_url="https://www.lme.com/en/Metals/Non-ferrous/Aluminium",
                affected_materials_json=["Aluminium Alloy Billet (6061-T6)", "Cast Aluminium Ingot (A380)"],
                affected_industries_json=["metal_steel", "electronics_assembly"],
                confidence_score=0.94,
                is_verified=True
            ),
            MarketEvent(
                title="Red Sea & Suez Maritime Route Surcharges Add 8-10 Days to Imported Speciality Steel Ingot Lead Times",
                summary="Major container shipping carriers re-route vessels via Cape of Good Hope, adding container detention fees and stretching procurement lead times from 35 to 48 days.",
                event_type="SUPPLY_DISRUPTION",
                severity="MEDIUM",
                published_date=datetime.now(timezone.utc),
                source_name="Drewry World Container Index",
                source_url="https://www.drewry.co.uk/supply-chain-advisors/supply-chain-expertise/world-container-index",
                affected_materials_json=["Stainless Steel (SS-304/SS-316)", "Hot Rolled Carbon Steel (IS 2062)"],
                affected_industries_json=["metal_steel"],
                confidence_score=0.91,
                is_verified=True
            )
        ]

        self.db.add_all(events)
        self.db.commit()

    def classify_raw_news_snippet(
        self,
        headline: str,
        body: str,
        source_url: str
    ) -> Dict[str, Any]:
        """
        Classifies an incoming news or policy item into event taxonomy,
        extracts affected materials via entity matching, and assigns severity.
        """
        text = f"{headline} {body}".lower()

        # Categorisation logic
        if any(w in text for w in ["tariff", "customs duty", "anti-dumping", "notification", "tax", "gazette", "duty hike"]):
            event_type = "POLICY_TARIFF"
            severity = "HIGH" if "hike" in text or "increase" in text else "MEDIUM"
        elif any(w in text for w in ["strike", "port", "canal", "chokepoint", "curtailment", "shortage", "force majeure", "lead time"]):
            event_type = "SUPPLY_DISRUPTION"
            severity = "CRITICAL" if "shutdown" in text or "severe" in text else "HIGH"
        elif any(w in text for w in ["forex", "rupee", "usd", "inr", "depreciation", "rbi"]):
            event_type = "CURRENCY_SHIFT"
            severity = "MEDIUM"
        else:
            event_type = "COMMODITY_SPIKE"
            severity = "HIGH" if any(w in text for w in ["surge", "jump", "record high", "soar", "spike"]) else "MEDIUM"

        # Entity Extraction
        materials_found = []
        if any(w in text for w in ["aluminium", "aluminum", "bauxite", "alumina", "6061", "a380"]):
            materials_found.append("Aluminium Alloy Billet (6061-T6)")
            materials_found.append("Cast Aluminium Ingot (A380)")
        if any(w in text for w in ["steel", "iron ore", "hrc", "crca", "rebar", "is 2062", "plate"]):
            materials_found.append("Hot Rolled Carbon Steel (IS 2062)")
        if any(w in text for w in ["stainless", "ss 304", "ss 316", "nickel"]):
            materials_found.append("Stainless Steel (SS-304/SS-316)")
        if any(w in text for w in ["cotton", "yarn", "fabric", "textile"]):
            materials_found.append("Combed Cotton Yarn")
        if any(w in text for w in ["pcb", "copper", "semiconductor", "chip"]):
            materials_found.append("Bare Multilayer FR-4 PCB")

        return {
            "title": headline,
            "summary": body[:400] + ("..." if len(body) > 400 else ""),
            "event_type": event_type,
            "severity": severity,
            "published_date": datetime.now(timezone.utc),
            "source_name": "External Market Feed",
            "source_url": source_url,
            "affected_materials_json": list(set(materials_found)),
            "affected_industries_json": ["metal_steel"],
            "confidence_score": 0.89,
            "is_verified": False  # requires editorial or official verification
        }

    def evaluate_event_impact_on_business(
        self,
        event_id: int,
        business_id: int
    ) -> Dict[str, Any]:
        """
        Connects an external event to a specific business's operational exposure.
        """
        event = self.db.query(MarketEvent).filter(MarketEvent.id == event_id).first()
        if not event:
            return {"error": "Event not found"}

        rel_engine = BusinessRelationshipEngine(self.db, business_id)

        # Estimate percentage shock based on event severity
        pct_shock = 8.0
        if event.severity == "CRITICAL":
            pct_shock = 15.0
        elif event.severity == "HIGH":
            pct_shock = 10.0
        elif event.severity == "MEDIUM":
            pct_shock = 5.0
        else:
            pct_shock = 2.5

        # Determine primary indicator code from affected materials
        indicator_code = "WPI_STEEL"
        if any("Aluminium" in m for m in (event.affected_materials_json or [])):
            indicator_code = "LME_ALU"

        impact = rel_engine.propagate_market_indicator_change(indicator_code, pct_shock)

        return {
            "event_id": event.id,
            "event_title": event.title,
            "event_type": event.event_type,
            "severity": event.severity,
            "published_date": event.published_date.strftime("%Y-%m-%d"),
            "source": f"{event.source_name} ({event.source_url})",
            "epistemic_status": {
                "fact_status": "Confirmed Official Gazette / Trade Benchmark" if event.is_verified else "Market Signal / Unverified Headline",
                "is_model_prediction": False,
                "is_deterministic_calculation": True
            },
            "impact_details": impact
        }
