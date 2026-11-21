import os
import io
import pytest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.document_parser import DocumentIntelligenceParser

client = TestClient(app)


def test_csv_supplier_quote_parsing(tmp_path):
    # Create sample CSV
    csv_file = tmp_path / "supplier_quote_test.csv"
    df = pd.DataFrame([
        {"Material": "Aluminium Alloy 6061-T6", "Unit Rate": 285.50, "Quantity": 500, "Supplier": "Hindalco Industries"},
        {"Material": "Special Stainless Steel 316L", "Unit Rate": 410.00, "Quantity": 200, "Supplier": "Jindal Stainless"},
        {"Material": "Structural Steel EN8", "Unit Rate": 78.00, "Quantity": 1000, "Supplier": "Tata Steel"}
    ])
    df.to_csv(csv_file, index=False)

    res = DocumentIntelligenceParser.parse_document(str(csv_file), document_type="SUPPLIER_QUOTE")
    assert res["success"] is True
    records = res["records"]
    assert len(records) == 3

    # Check normalization and extraction
    alu_rec = records[0]
    assert "Aluminium" in alu_rec["material_name"]
    assert alu_rec["unit_price"] == 285.50
    assert alu_rec["quantity"] == 500.0

    # Check confidence scores
    conf = res["confidence_scores"]
    assert conf["overall"] >= 0.85
    assert conf["field_average"] >= 0.80

    # Check provenance
    prov = res["provenance_data"]
    assert prov["rows_parsed"] == 3


def test_excel_bom_parsing(tmp_path):
    xlsx_file = tmp_path / "sample_bom.xlsx"
    df = pd.DataFrame([
        {"Item Description": "Steel Rod EN8", "Unit Rate": 82.0, "Quantity": 15.0, "UOM": "kg"},
        {"Item Description": "Aluminium Ingot", "Unit Rate": 260.0, "Quantity": 4.5, "UOM": "kg"}
    ])
    df.to_excel(xlsx_file, index=False)

    res = DocumentIntelligenceParser.parse_document(str(xlsx_file), document_type="BOM")
    assert res["success"] is True
    assert len(res["records"]) == 2
    assert res["records"][0]["quantity"] == 15.0
    assert res["records"][1]["unit_price"] == 260.0


def test_document_upload_and_human_correction_api(tmp_path):
    # 1. Login as Procurement Manager
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "procurement@apexforge.com", "password": "password123"}
    )
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Upload CSV via API
    csv_content = b"Material,Rate,Quantity\nHigh Carbon Steel,95.5,1200\n"
    files = {"file": ("quote_batch_101.csv", io.BytesIO(csv_content), "text/csv")}
    upload_resp = client.post(
        "/api/v1/documents/upload",
        files=files,
        data={"document_type": "SUPPLIER_QUOTE"},
        headers=headers
    )
    assert upload_resp.status_code == 200
    doc_data = upload_resp.json()
    assert doc_data["filename"] == "quote_batch_101.csv"
    assert doc_data["status"] in ["EXTRACTED", "REVIEW_REQUIRED"]
    doc_id = doc_data["id"]

    # 3. List documents
    list_resp = client.get("/api/v1/documents", headers=headers)
    assert list_resp.status_code == 200
    docs = list_resp.json()
    assert any(d["id"] == doc_id for d in docs)

    # 4. Human Verification & Correction: User adjusts unit price from 95.5 to 94.0
    corrected_payload = {
        "corrected_data": {
            "records": [
                {"material_name": "High Carbon Steel", "unit_price": 94.0, "quantity": 1200, "verified_by": "procurement@apexforge.com"}
            ]
        },
        "confirm_and_apply": True
    }
    correct_resp = client.put(
        f"/api/v1/documents/{doc_id}/correct",
        json=corrected_payload,
        headers=headers
    )
    assert correct_resp.status_code == 200
    updated_doc = correct_resp.json()
    assert updated_doc["status"] == "CONFIRMED"
    assert updated_doc["extracted_data_json"]["records"][0]["unit_price"] == 94.0
    assert updated_doc["confidence_scores_json"]["status"] == "Human Verified"
