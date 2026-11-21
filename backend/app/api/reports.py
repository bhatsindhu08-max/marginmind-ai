import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Dict, Any
from backend.app.core.database import get_db
from backend.app.models import Business, Product, CustomerOrder
from backend.app.services.report_generator import ReportGeneratorService
from backend.app.services.marginguard_service import MarginGuardService
from backend.app.api.deps import get_current_tenant

router = APIRouter(prefix="/reports", tags=["Report Generation & Exports"])


@router.post("/export-excel")
def export_excel_report(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    biz = db.query(Business).filter(Business.id == tenant_id).first()
    biz_name = biz.name if biz else "Manufacturing Enterprise"

    mg_service = MarginGuardService(db, tenant_id)
    mg_data = mg_service.get_portfolio_margin_overview()

    products_data = [
        {
            "product_name": p["name"],
            "sku": p["sku"],
            "selling_price": p["selling_price"],
            "total_unit_cost": p["total_cost"],
            "gross_profit": p["gross_profit"],
            "margin_percent": p["margin_percent"],
            "target_margin": p["target_margin"],
            "health_status": p["health"],
            "material_share_percent": p["material_share"]
        }
        for p in mg_data["all_products"]
    ]

    assumptions = [
        "Product costs reflect active Bills of Materials, scrap allowances, and standard energy tariffs.",
        "Overheads include direct machinist labour, CNC depreciation, and internal freight allocations.",
        "Margin health alerts trigger automatically when gross margin breaches critical threshold."
    ]

    file_path = ReportGeneratorService.generate_excel_report(
        business_name=biz_name,
        report_title="Portfolio Margin Health & Costing Report",
        data_sections={"Product_Margins": products_data},
        assumptions=assumptions
    )

    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )


@router.post("/export-pdf")
def export_pdf_report(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    biz = db.query(Business).filter(Business.id == tenant_id).first()
    biz_name = biz.name if biz else "Manufacturing Enterprise"

    mg_service = MarginGuardService(db, tenant_id)
    mg_data = mg_service.get_portfolio_margin_overview()

    headers = ["Product Name", "SKU", "Selling Price", "Unit Cost", "Margin %", "Health"]
    rows = [
        [
            p["name"][:28],
            p["sku"],
            f"INR {p['selling_price']:,.0f}",
            f"INR {p['total_cost']:,.0f}",
            f"{p['margin_percent']:.1f}%",
            p["health"]
        ]
        for p in mg_data["all_products"]
    ]

    summary = (
        f"This executive dossier presents the continuous financial margin health evaluation for {biz_name}. "
        f"Out of {mg_data['total_products']} active manufactured lines, {mg_data['healthy_count']} are operating at target margin, "
        f"{mg_data['warning_count']} are in warning zone, and {mg_data['critical_count']} require immediate price revision or procurement renegotiation."
    )

    assumptions = [
        "Calculated using deterministic multi-tier BOM explosion and standard production overhead absorption.",
        "External commodity benchmarks sourced from World Bank Development Prospects Group.",
        "Requires authorized executive signature prior to external price escalation notification."
    ]

    import os
    file_path = ReportGeneratorService.generate_pdf_report(
        business_name=biz_name,
        report_title="Executive Margin Health Dossier",
        summary_text=summary,
        table_headers=headers,
        table_rows=rows,
        assumptions=assumptions
    )

    return FileResponse(
        path=file_path,
        filename=os.path.basename(file_path),
        media_type="application/pdf"
    )
