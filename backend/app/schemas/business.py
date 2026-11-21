from typing import Optional, Dict, Any, List
from datetime import datetime
from pydantic import BaseModel


class BusinessBase(BaseModel):
    name: str
    industry_type: str = "metal_steel"
    currency: str = "INR"
    address: Optional[str] = None
    settings_json: Optional[Dict[str, Any]] = None


class BusinessCreate(BusinessBase):
    pass


class BusinessUpdate(BaseModel):
    name: Optional[str] = None
    industry_type: Optional[str] = None
    currency: Optional[str] = None
    address: Optional[str] = None
    settings_json: Optional[Dict[str, Any]] = None


class BusinessOut(BusinessBase):
    id: int
    slug: str
    created_at: datetime

    class Config:
        from_attributes = True


class IndustryTemplateOut(BaseModel):
    id: str
    name: str
    description: str
    material_categories: List[str]
    default_units: List[str]
    default_target_margin: float
    critical_margin_threshold: float
