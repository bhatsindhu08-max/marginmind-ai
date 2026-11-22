from typing import Optional, List, Dict, Any
from datetime import datetime
from pydantic import BaseModel
from backend.app.schemas.material import MaterialOut


class BOMItemBase(BaseModel):
    material_id: int
    quantity: float
    unit: str = "kg"
    scrap_percent: float = 0.0
    process_stage: Optional[str] = None


class BOMItemCreate(BOMItemBase):
    pass


class BOMItemOut(BOMItemBase):
    id: int
    bom_id: int
    material: Optional[MaterialOut] = None

    class Config:
        from_attributes = True


class BOMBase(BaseModel):
    version: str = "1.0"
    is_active: bool = True
    notes: Optional[str] = None


class BOMCreate(BOMBase):
    product_id: int
    items: List[BOMItemCreate] = []


class BOMOut(BOMBase):
    id: int
    product_id: int
    created_at: datetime
    items: List[BOMItemOut] = []

    class Config:
        from_attributes = True


class ProductionCostBase(BaseModel):
    direct_labour_hours: float = 1.0
    labour_rate_hourly: float = 300.0
    machine_hours: float = 1.0
    machine_rate_hourly: float = 600.0
    energy_kwh: float = 10.0
    energy_rate_kwh: float = 8.0
    fixed_overhead_per_unit: float = 150.0
    packaging_freight_per_unit: float = 50.0
    worker_count: int = 1
    wage_per_worker_daily: float = 500.0
    daily_output_units: float = 100.0
    processing_jobwork_cost_per_unit: float = 0.0
    inspection_qc_cost_per_unit: float = 0.0
    consumables_cost_per_unit: float = 0.0
    boiler_steam_fuel_per_unit: float = 0.0
    cost_breakdown_json: Optional[Dict[str, Any]] = None


class ProductionCostCreate(ProductionCostBase):
    product_id: int


class ProductionCostOut(ProductionCostBase):
    id: int
    product_id: int

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    code: str
    name: str
    sku: str
    category: Optional[str] = None
    selling_price: float
    target_margin_percent: float = 25.0
    critical_margin_threshold: float = 15.0
    is_active: bool = True


class ProductCreate(ProductBase):
    raw_material_name: Optional[str] = None
    material_cost: Optional[float] = None
    material_unit: Optional[str] = "kg"
    direct_labour_cost: Optional[float] = None
    fixed_overhead: Optional[float] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    selling_price: Optional[float] = None
    target_margin_percent: Optional[float] = None
    critical_margin_threshold: Optional[float] = None
    is_active: Optional[bool] = None


class ProductCostBreakdown(BaseModel):
    product_id: int
    product_name: str
    sku: str
    selling_price: float
    material_cost: float
    labour_cost: float
    machine_overhead: float
    energy_cost: float
    fixed_overhead: float
    freight_packaging_cost: float
    scrap_cost: float
    total_cost: float
    gross_profit: float
    gross_margin_percent: float
    target_margin_percent: float
    critical_margin_threshold: float
    margin_health: str  # HEALTHY, WARNING, CRITICAL
    material_cost_share_percent: float
    # Detailed worker & processing costs
    labour_calc_method: Optional[str] = None
    worker_count: Optional[int] = 1
    wage_per_worker_daily: Optional[float] = 0.0
    daily_output_units: Optional[float] = 0.0
    processing_jobwork_cost: Optional[float] = 0.0
    inspection_qc_cost: Optional[float] = 0.0
    consumables_cost: Optional[float] = 0.0
    boiler_steam_fuel: Optional[float] = 0.0


class ProductOut(ProductBase):
    id: int
    business_id: int
    created_at: datetime
    boms: List[BOMOut] = []
    production_costs: Optional[ProductionCostOut] = None

    class Config:
        from_attributes = True
