import os
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from backend.app.core.config import settings
from backend.app.core.database import get_db
from backend.app.models import Document, Supplier, SupplierQuotation, Material, PreparedDecision
from backend.app.schemas.document import DocumentOut, DocumentCorrectionUpdate
from backend.app.services.document_parser import DocumentIntelligenceParser
from backend.app.services.order_viability_service import OrderViabilityService
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

    # Automatically compute order profitability, spend breakdown, cash runway, and future price risk!
    viability_service = OrderViabilityService(db, tenant_id)
    viability_data = viability_service.evaluate_from_document_records(
        records=parse_result.get("records", [])
    )

    doc = Document(
        business_id=tenant_id,
        filename=file.filename,
        file_path=file_path,
        document_type=document_type,
        file_size=len(file_bytes),
        status=doc_status,
        extracted_data_json={
            "records": parse_result.get("records", []),
            "viability": viability_data
        },
        confidence_scores_json=parse_result.get("confidence_scores", {}),
        provenance_data_json=parse_result.get("provenance_data", {}),
        error_message=parse_result.get("error")
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/{document_id}/viability")
def get_document_viability(
    document_id: int,
    available_cash: Optional[float] = None,
    future_price_shock_pct: float = 0.0,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    doc = db.query(Document).filter(Document.id == document_id, Document.business_id == tenant_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    records = (doc.extracted_data_json or {}).get("records", [])
    viability_service = OrderViabilityService(db, tenant_id)
    return viability_service.evaluate_from_document_records(
        records=records,
        available_cash=available_cash,
        future_price_shock_pct=future_price_shock_pct
    )



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

    # Update extracted data with human correction and re-compute viability
    corrected_records = (data.corrected_data or {}).get("records", [])
    viability_service = OrderViabilityService(db, tenant_id)
    viability_data = viability_service.evaluate_from_document_records(records=corrected_records)

    doc.extracted_data_json = {
        **(data.corrected_data or {}),
        "viability": viability_data
    }
    doc.status = "CONFIRMED" if data.confirm_and_apply else "EXTRACTED"
    doc.confidence_scores_json = {"overall": 1.0, "status": "Human Verified"}

    if data.confirm_and_apply:
        records = (data.corrected_data or {}).get("records", [])
        for rec in records:
            mat_name = rec.get("material_name", "").strip()
            if not mat_name:
                continue

            unit_price = float(rec.get("unit_price", 0.0))
            supp_name = rec.get("supplier_name", "Supplier").strip()
            unit_val = rec.get("unit", "kg").strip()
            qty_val = float(rec.get("quantity", 1.0))

            # 1. Update or create Material record
            mat = db.query(Material).filter(Material.business_id == tenant_id, Material.name == mat_name).first()
            if mat:
                mat.current_market_price = unit_price
            else:
                mat = Material(
                    business_id=tenant_id,
                    code=f"MAT-{int(datetime.now().timestamp()) % 10000}",
                    name=mat_name,
                    category="Raw Material",
                    unit=unit_val,
                    standard_cost=unit_price,
                    current_market_price=unit_price,
                    min_safety_stock=100.0,
                    is_active=True
                )
                db.add(mat)
                db.flush()

            # 2. Update or create Supplier record
            supp = db.query(Supplier).filter(Supplier.business_id == tenant_id, Supplier.name == supp_name).first()
            if not supp:
                supp = Supplier(
                    business_id=tenant_id,
                    code=f"SUPP-{int(datetime.now().timestamp()) % 1000}",
                    name=supp_name,
                    reliability_score=0.95
                )
                db.add(supp)
                db.flush()

            # 3. Create active Supplier Quotation record
            quote = SupplierQuotation(
                business_id=tenant_id,
                supplier_id=supp.id,
                material_id=mat.id,
                quotation_ref=doc.filename,
                quote_price=unit_price,
                currency="INR",
                min_order_qty=qty_val,
                valid_from=datetime.now(timezone.utc),
                valid_to=datetime.now(timezone.utc) + timedelta(days=90),
                is_active=True
            )
            db.add(quote)

            # 4. Generate Prepared Decision for Decision Centre
            decision = PreparedDecision(
                business_id=tenant_id,
                decision_type="PRICE_ADJUSTMENT",
                title=f"Cost Revision Proposal: {mat_name}",
                summary=f"Supplier quote verified for '{mat_name}' at ₹{unit_price:.2f}/{unit_val} from {supp_name}.",
                rationale=f"Document '{doc.filename}' verified new input cost. System recommends updating product costing and reviewing customer price recovery.",
                financial_impact_json={
                    "material_name": mat_name,
                    "new_rate": unit_price,
                    "supplier_name": supp_name,
                    "quantity": qty_val
                },
                confidence_level=0.96,
                risk_level="MEDIUM" if unit_price > 500 else "LOW",
                status="PENDING_APPROVAL"
            )
            db.add(decision)

    db.commit()
    db.refresh(doc)
    return doc
