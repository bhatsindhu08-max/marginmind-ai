from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel


class ForecastScenarioOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    material_id: Optional[int] = None
    indicator_code: Optional[str] = None
    horizon: str  # 0-3m, 3-12m, 1-3y, 3-5y
    scenario_type: str  # FAVOURABLE, BASE, STRESS
    forecasted_value: float
    unit: str
    confidence_lower: float
    confidence_upper: float
    assumptions_json: Dict[str, Any]
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True


class MultiHorizonForecastResult(BaseModel):
    target_id: int
    target_name: str
    target_type: str  # PRODUCT or MATERIAL
    current_value: float
    unit: str
    horizons: Dict[str, Dict[str, Any]]  # horizon -> {FAVOURABLE: ..., BASE: ..., STRESS: ...}
    assumptions: List[str]
    cost_drivers: List[str]
    data_quality_score: float
    model_metrics: Dict[str, float]  # MAE, RMSE, MAPE
    limitations: str
