from typing import Optional
from datetime import datetime
from pydantic import BaseModel
from backend.app.schemas.product import ProductBase


class CustomerOrderBase(BaseModel):
    order_number: str
    customer_name: str
    product_id: int
    quantity: float
    agreed_unit_price: float
    promised_delivery_date: datetime


class CustomerOrderCreate(CustomerOrderBase):
    pass


class CustomerOrderUpdate(BaseModel):
    status: Optional[str] = None
    agreed_unit_price: Optional[float] = None
    quantity: Optional[float] = None
    promised_delivery_date: Optional[datetime] = None


class OrderEvaluationOut(BaseModel):
    order_id: int
    order_number: str
    customer_name: str
    product_id: int
    product_name: str
    quantity: float
    agreed_unit_price: float
    total_revenue: float
    current_unit_cost: float
    total_current_cost: float
    projected_unit_cost_stress: float
    total_stress_cost: float
    current_gross_profit: float
    current_gross_margin_percent: float
    stress_gross_profit: float
    stress_gross_margin_percent: float
    material_availability_status: str  # SUFFICIENT, DEFICIT, SEVERE_SHORTAGE
    available_stock: float
    required_materials: list
    recommendation: str  # ATTRACTIVE, VERIFY, RISKY
    recommendation_reasons: list[str]
    suggested_price_floor: float


class CustomerOrderOut(CustomerOrderBase):
    id: int
    business_id: int
    order_date: datetime
    status: str
    margin_guard_status: str
    calculated_margin_percent: Optional[float] = None
    product: Optional[ProductBase] = None

    class Config:
        from_attributes = True
