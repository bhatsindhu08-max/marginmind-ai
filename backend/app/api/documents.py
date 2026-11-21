import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models import Document, Supplier, SupplierQuotation, Material
from backend.app.schemas.document import DocumentOut, DocumentCorrectionUpdate
from backend.app.services.document_parser import DocumentIntelligenceParser
from backend.app.api.deps import get_current_user, get_current_tenant

router = APIRouter(prefix="/documents", tags=["Document Intelligence & Ingestion"])


@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    file: UploadFile = File(...),
    document_type: str = Form("SUPPLIER_QUOTE"),
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    # Save file
    file_bytes = await file.read()
    file_path = os.path.join(settings.UPLOAD_DIR, f"{tenant_id}_{file.filename}")
    with open(file_path, "wb") as f:
        f.write(file_bytes)

    # Parse with Document Intelligence
    parse_result = DocumentIntelligenceParser.parse_document(file_path, document_type=document_type)

    doc_status = "EXTRACTED"
    if not parse_result.get("success", False):
        doc_status = "FAILED"
    elif parse_result.get("review_required", False):
        doc_status = "REVIEW_REQUIRED"

    doc = Document(
        business_id=tenant_id,
        filename=file.filename,
        file_path=file_path,
        document_type=document_type,
        file_size=len(file_bytes),
        status=doc_status,
        extracted_data_json={"records": parse_result.get("records", [])},
        confidence_scores_json=parse_result.get("confidence_scores", {}),
        provenance_data_json=parse_result.get("provenance_data", {}),
        error_message=parse_result.get("error")
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("", response_model=List[DocumentOut])
def list_documents(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Document).filter(Document.business_id == tenant_id).order_by(Document.uploaded_at.desc()).all()


@router.put("/{document_id}/correct", response_model=DocumentOut)
def correct_and_confirm_document(
    document_id: int,
    data: DocumentCorrectionUpdate,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.business_id == tenant_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Update extracted data with human correction
    doc.extracted_data_json = data.corrected_data
    doc.status = "CONFIRMED" if data.confirm_and_apply else "EXTRACTED"
    doc.confidence_scores_json = {"overall": 1.0, "status": "Human Verified"}

    db.commit()
    db.refresh(doc)
    return doc
