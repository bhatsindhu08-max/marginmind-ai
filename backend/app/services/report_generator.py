import os
from typing import Dict, Any, List
from datetime import datetime, timezone
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from backend.app.core.config import settings


class ReportGeneratorService:
    """
    Generates professional PDF and Excel analytical reports for MarginMind AI.
    Every report includes executive summary, deterministic calculation methodology,
    stated assumptions, data sources, and approval history.
    """

    @classmethod
    def generate_excel_report(
        cls,
        business_name: str,
        report_title: str,
        data_sections: Dict[str, List[Dict[str, Any]]],
        assumptions: List[str]
    ) -> str:
        """
        Generates a multi-tab formatted Excel workbook.
        Returns the absolute file path of the generated .xlsx file.
        """
        wb = openpyxl.Workbook()
        # Remove default sheet
        wb.remove(wb.active)

        # Style definitions
        header_fill = PatternFill(start_color="0F172A", end_color="0F172A", fill_type="solid")
        header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
        title_font = Font(name="Calibri", size=14, bold=True, color="0F172A")
        sub_font = Font(name="Calibri", size=9, italic=True, color="64748B")

        # 1. Summary & Methodology Sheet
        ws_cover = wb.create_sheet(title="Executive Summary")
        ws_cover.append([f"MARGINMIND AI — {report_title.upper()}"])
        ws_cover.cell(row=1, column=1).font = title_font
        ws_cover.append([f"Enterprise: {business_name} | Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}"])
        ws_cover.cell(row=2, column=1).font = sub_font
        ws_cover.append([])
        ws_cover.append(["GOVERNANCE & CALCULATION METHODOLOGY"])
        ws_cover.cell(row=4, column=1).font = Font(bold=True, size=11)
        ws_cover.append(["1. Costing Engine: Multi-tier deterministic BOM aggregation (direct materials + scrap + labour + energy + overhead)."])
        ws_cover.append(["2. Scenarios: Conditional outlooks (Favourable, Base, Stress) driven by official World Bank and RBI macro benchmarks."])
        ws_cover.append(["3. Safety Guarantee: All prepared decisions require explicit human authorization before execution."])
        ws_cover.append([])
        ws_cover.append(["KEY STATED ASSUMPTIONS:"])
        for assm in assumptions:
            ws_cover.append([f"• {assm}"])

        # 2. Data Section Sheets
        for section_name, rows in data_sections.items():
            if not rows:
                continue
            sheet_title = section_name[:31]  # Excel sheet title limit
            ws = wb.create_sheet(title=sheet_title)

            # Table Header
            headers = list(rows[0].keys())
            ws.append([h.replace("_", " ").title() for h in headers])
            for col_idx in range(1, len(headers) + 1):
                cell = ws.cell(row=1, column=col_idx)
                cell.fill = header_fill
                cell.font = header_font
                cell.alignment = Alignment(horizontal="center", vertical="center")

            # Table Data Rows
            for r_idx, row in enumerate(rows, start=2):
                row_vals = [row.get(h, "") for h in headers]
                ws.append(row_vals)
                for c_idx in range(1, len(headers) + 1):
                    ws.cell(row=r_idx, column=c_idx).alignment = Alignment(vertical="center")

            # Auto-fit column widths
            for col in ws.columns:
                max_len = max(len(str(cell.value or '')) for cell in col)
                col_letter = col[0].column_letter
                ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

        filename = f"MarginMind_{report_title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"
        file_path = os.path.join(settings.REPORTS_DIR, filename)
        wb.save(file_path)
        return file_path

    @classmethod
    def generate_pdf_report(
        cls,
        business_name: str,
        report_title: str,
        summary_text: str,
        table_headers: List[str],
        table_rows: List[List[str]],
        assumptions: List[str]
    ) -> str:
        """
        Generates a clean enterprise PDF executive dossier.
        Returns the absolute file path of the generated .pdf file.
        """
        filename = f"MarginMind_{report_title.replace(' ', '_')}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
        file_path = os.path.join(settings.REPORTS_DIR, filename)

        doc = SimpleDocTemplate(file_path, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
        styles = getSampleStyleSheet()

        title_style = ParagraphStyle(
            'ReportTitle',
            parent=styles['Heading1'],
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0F172A'),
            fontName='Helvetica-Bold'
        )

        sub_style = ParagraphStyle(
            'ReportSub',
            parent=styles['Normal'],
            fontSize=9,
            textColor=colors.HexColor('#64748B'),
            fontName='Helvetica'
        )

        body_style = ParagraphStyle(
            'ReportBody',
            parent=styles['Normal'],
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#1E293B'),
            fontName='Helvetica'
        )

        elements = []

        # Header Title
        elements.append(Paragraph(f"MARGINMIND AI — {report_title.upper()}", title_style))
        elements.append(Paragraph(f"Enterprise: {business_name} | Date: {datetime.now(timezone.utc).strftime('%B %d, %Y')}", sub_style))
        elements.append(Spacer(1, 14))

        # Executive Summary
        elements.append(Paragraph("<b>Executive Summary:</b>", body_style))
        elements.append(Paragraph(summary_text, body_style))
        elements.append(Spacer(1, 14))

        # Data Table
        if table_headers and table_rows:
            table_data = [table_headers] + table_rows
            t = Table(table_data, colWidths=None)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#F8FAFC'), colors.white])
            ]))
            elements.append(t)
            elements.append(Spacer(1, 14))

        # Stated Assumptions & Data Provenance
        elements.append(Paragraph("<b>Assumptions & Epistemic Boundaries:</b>", body_style))
        for assm in assumptions:
            elements.append(Paragraph(f"• {assm}", sub_style))

        elements.append(Spacer(1, 10))
        elements.append(Paragraph("<i>Prepared by MarginMind AI Connected Financial Intelligence Engine. Requires authorized human executive approval before execution.</i>", sub_style))

        doc.build(elements)
        return file_path
