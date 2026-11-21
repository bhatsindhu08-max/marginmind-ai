from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class MarketObservationBase(BaseModel):
    indicator_code: str
    indicator_name: str
    observation_date: datetime
    value: float
    unit: str
    currency: str = "USD"
    is_synthetic: bool = False
    notes: Optional[str] = None


class MarketObservationCreate(MarketObservationBase):
    source_id: Optional[int] = None


class MarketObservationOut(MarketObservationBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class MarketEventBase(BaseModel):
    title: str
    summary: str
    event_type: str = "COMMODITY_SPIKE"
    severity: str = "MEDIUM"
    published_date: datetime
    source_name: str
    source_url: str
    affected_materials_json: List[str] = []
    affected_industries_json: List[str] = []
    confidence_score: float = 0.90
    is_verified: bool = True


class MarketEventCreate(MarketEventBase):
    pass


class MarketEventOut(MarketEventBase):
    id: int
    created_at: datetime
    affected_products_count: Optional[int] = 0
    estimated_total_exposure: Optional[float] = 0.0

    class Config:
        from_attributes = True


class MarketShockSimulationRequest(BaseModel):
    indicator_code: str
    percentage_change: float  # e.g. +15.0 or -10.0
    notes: Optional[str] = "Interactive simulation"


class MarketShockSimulationResponse(BaseModel):
    indicator_code: str
    percentage_change: float
    affected_materials: List[Dict[str, Any]]
    affected_products: List[Dict[str, Any]]
    total_inventory_exposure: float
    total_order_exposure: float
    total_exposure: float
    products_breaching_threshold: List[str]
    prepared_decision_count: int
