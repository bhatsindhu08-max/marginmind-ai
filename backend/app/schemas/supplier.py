from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class SupplierQuotationBase(BaseModel):
    material_id: int
    quotation_ref: Optional[str] = None
    quote_price: float
    currency: str = "INR"
    min_order_qty: float = 1.0
    lead_time_days: int = 14
    valid_from: datetime
    valid_to: datetime
    is_active: bool = True


class SupplierQuotationCreate(SupplierQuotationBase):
    supplier_id: int


class SupplierQuotationOut(SupplierQuotationBase):
    id: int
    supplier_id: int
    material_name: Optional[str] = None
    supplier_name: Optional[str] = None

    class Config:
        from_attributes = True


class SupplierBase(BaseModel):
    code: str
    name: str
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    lead_time_days: int = 14
    reliability_score: float = 0.95
    risk_rating: str = "LOW"  # LOW, MEDIUM, HIGH
    payment_terms: str = "Net 30"


class SupplierCreate(SupplierBase):
    material_name: Optional[str] = None
    material_id: Optional[int] = None
    quote_price: Optional[float] = None
    unit: Optional[str] = "kg"


class SupplierUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    lead_time_days: Optional[int] = None
    reliability_score: Optional[float] = None
    risk_rating: Optional[str] = None
    payment_terms: Optional[str] = None


class SupplierOut(SupplierBase):
    id: int
    business_id: int
    created_at: datetime
    quotations: List[SupplierQuotationOut] = []

    class Config:
        from_attributes = True
