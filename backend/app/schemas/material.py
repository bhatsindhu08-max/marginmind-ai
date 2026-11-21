from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel


class MaterialBase(BaseModel):
    code: str
    name: str
    category: str
    unit: str = "kg"
    standard_cost: float
    current_market_price: float
    min_safety_stock: float = 0.0
    is_active: bool = True


class MaterialCreate(MaterialBase):
    pass


class MaterialUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    standard_cost: Optional[float] = None
    current_market_price: Optional[float] = None
    min_safety_stock: Optional[float] = None
    is_active: Optional[bool] = None


class MaterialIndexMappingBase(BaseModel):
    indicator_code: str
    multiplier: float = 1.0
    basis_spread: float = 0.0
    freight_basis: float = 0.0
    notes: Optional[str] = None


class MaterialIndexMappingCreate(MaterialIndexMappingBase):
    material_id: int


class MaterialIndexMappingOut(MaterialIndexMappingBase):
    id: int
    material_id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class MaterialOut(MaterialBase):
    id: int
    business_id: int
    index_mappings: List[MaterialIndexMappingOut] = []

    class Config:
        from_attributes = True


class InventoryBase(BaseModel):
    current_stock: float
    unit: str = "kg"
    weighted_average_cost: float
    reorder_level: float = 0.0
    safety_stock: float = 0.0


class InventoryCreate(InventoryBase):
    material_id: int


class InventoryUpdate(BaseModel):
    current_stock: Optional[float] = None
    weighted_average_cost: Optional[float] = None
    reorder_level: Optional[float] = None
    safety_stock: Optional[float] = None


class InventoryOut(InventoryBase):
    id: int
    material_id: int
    last_counted_at: datetime
    material: Optional[MaterialBase] = None

    class Config:
        from_attributes = True
