from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel


class DocumentBase(BaseModel):
    document_type: str = "SUPPLIER_QUOTE"


class DocumentOut(BaseModel):
    id: int
    business_id: int
    filename: str
    file_path: str
    document_type: str
    file_size: int
    status: str
    extracted_data_json: Dict[str, Any]
    confidence_scores_json: Dict[str, Any]
    provenance_data_json: Dict[str, Any]
    error_message: Optional[str]
    uploaded_at: datetime

    class Config:
        from_attributes = True


class DocumentCorrectionUpdate(BaseModel):
    corrected_data: Dict[str, Any]
    confirm_and_apply: bool = False
