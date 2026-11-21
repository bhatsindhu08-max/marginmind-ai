from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session
from backend.app.models import (
    Business, User, Material, MaterialIndexMapping, Supplier,
    SupplierQuotation, Inventory, Product, BOM, BOMItem,
    ProductionCost, CustomerOrder, PurchaseHistory
)
from backend.app.core.security import get_password_hash
from backend.app.services.market_intelligence import MarketIntelligenceService
from backend.app.services.event_intelligence import EventIntelligenceEngine


def seed_metal_demonstration(db: Session) -> Business:
    """
    Seeds the complete end-to-end Metal Manufacturing demonstration scenario
    for 'Apex Precision Forging & Fabrication Ltd.'
    """
    # 1. Initialize External Markets & Events
    mkt_service = MarketIntelligenceService(db)
    mkt_service.seed_historical_market_observations()

    evt_engine = EventIntelligenceEngine(db)
    evt_engine.seed_initial_events()

    # 2. Check if Business exists
    existing = db.query(Business).filter(Business.slug == "apex-precision-forging").first()
    if existing:
        return existing

    # Create Business
    business = Business(
        name="Apex Precision Forging & Fabrication Ltd.",
        slug="apex-precision-forging",
        industry_type="metal_steel",
        currency="INR",
        address="Plot 42, Bhosari Industrial Area, MIDC Pune, Maharashtra, India",
        settings_json={
            "default_target_margin": 25.0,
            "critical_margin_threshold": 16.0,
            "auto_evaluate_orders": True,
            "demo_mode": True
        }
    )
    db.add(business)
    db.flush()

    # 3. Create Users with RBAC roles
    users = [
        User(
            business_id=business.id,
            email="owner@apexforge.com",
            hashed_password=get_password_hash("password123"),
            full_name="Rajeshwar Patil (Managing Director)",
            role="business_owner"
        ),
        User(
            business_id=business.id,
            email="finance@apexforge.com",
            hashed_password=get_password_hash("password123"),
            full_name="Sunita Deshmukh (VP Finance)",
            role="finance_manager"
        ),
        User(
            business_id=business.id,
            email="procurement@apexforge.com",
            hashed_password=get_password_hash("password123"),
            full_name="Vikram Joshi (Head of Sourcing)",
            role="procurement_manager"
        ),
        User(
            business_id=business.id,
            email="production@apexforge.com",
            hashed_password=get_password_hash("password123"),
            full_name="Anand Shinde (Plant Operations Manager)",
            role="production_manager"
        )
    ]
    db.add_all(users)
    db.flush()

    # 4. Materials
    materials_data = [
        {"code": "MAT-STL-2062", "name": "Hot Rolled Carbon Steel (IS 2062)", "category": "Carbon Steel", "unit": "kg", "cost": 68.0, "market": 68.0, "stock": 4500.0, "index": "WPI_STEEL", "multiplier": 0.48},
        {"code": "MAT-ALU-6061", "name": "Aluminium Alloy Billet (6061-T6)", "category": "Aluminium Alloys", "unit": "kg", "cost": 295.0, "market": 295.0, "stock": 1200.0, "index": "LME_ALU", "multiplier": 0.11},
        {"code": "MAT-ALU-A380", "name": "Cast Aluminium Ingot (A380)", "category": "Aluminium Alloys", "unit": "kg", "cost": 260.0, "market": 260.0, "stock": 850.0, "index": "LME_ALU", "multiplier": 0.10},
        {"code": "MAT-SST-304", "name": "Stainless Steel (SS-304/SS-316)", "category": "Stainless Steel", "unit": "kg", "cost": 340.0, "market": 340.0, "stock": 600.0, "index": "WPI_STEEL", "multiplier": 0.65},
        {"code": "MAT-WLD-70S6", "name": "Welding Wire & Gas Consumables", "category": "Consumables", "unit": "kg", "cost": 210.0, "market": 210.0, "stock": 350.0, "index": "WPI_STEEL", "multiplier": 0.20}
    ]

    mat_map = {}
    for md in materials_data:
        mat = Material(
            business_id=business.id,
            code=md["code"],
            name=md["name"],
            category=md["category"],
            unit=md["unit"],
            standard_cost=md["cost"],
            current_market_price=md["market"],
            min_safety_stock=200.0,
            is_active=True
        )
        db.add(mat)
        db.flush()
        mat_map[md["code"]] = mat

        # Link to external indicator
        db.add(MaterialIndexMapping(
            business_id=business.id,
            material_id=mat.id,
            indicator_code=md["index"],
            multiplier=md["multiplier"],
            basis_spread=0.0,
            freight_basis=2.5,
            notes=f"Linked to {md['index']} with regional Pune logistics spread."
        ))

        # Initial Inventory
        db.add(Inventory(
            business_id=business.id,
            material_id=mat.id,
            current_stock=md["stock"],
            unit=md["unit"],
            weighted_average_cost=md["cost"],
            reorder_level=400.0,
            safety_stock=200.0
        ))

    # 5. Suppliers & Quotations
    suppliers_data = [
        {"code": "SUP-TATA-STL", "name": "Tata Steel Distribution Ltd.", "email": "industrial.orders@tatasteel.com", "lead": 10, "rating": "LOW", "score": 0.98, "terms": "Net 45"},
        {"code": "SUP-HINDALCO", "name": "Hindalco Industries Extrusions", "email": "commercial@hindalco.adityabirla.com", "lead": 14, "rating": "LOW", "score": 0.96, "terms": "Net 30"},
        {"code": "SUP-JINDAL-SS", "name": "Jindal Stainless Stockists", "email": "pune.branch@jindalstainless.com", "lead": 12, "rating": "MEDIUM", "score": 0.92, "terms": "Net 30"}
    ]

    supp_map = {}
    for sd in suppliers_data:
        supp = Supplier(
            business_id=business.id,
            code=sd["code"],
            name=sd["name"],
            contact_email=sd["email"],
            lead_time_days=sd["lead"],
            reliability_score=sd["score"],
            risk_rating=sd["rating"],
            payment_terms=sd["terms"]
        )
        db.add(supp)
        db.flush()
        supp_map[sd["code"]] = supp

    now = datetime.now(timezone.utc)
    # Quotes
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-TATA-STL"].id,
        material_id=mat_map["MAT-STL-2062"].id,
        quotation_ref="QT-TATA-2026-902",
        quote_price=68.0,
        currency="INR",
        min_order_qty=1000.0,
        valid_from=now - timedelta(days=60),
        valid_to=now + timedelta(days=30),
        is_active=True
    ))
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-HINDALCO"].id,
        material_id=mat_map["MAT-ALU-6061"].id,
        quotation_ref="QT-HIND-2026-118",
        quote_price=295.0,
        currency="INR",
        min_order_qty=500.0,
        valid_from=now - timedelta(days=45),
        valid_to=now + timedelta(days=20),
        is_active=True
    ))
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-HINDALCO"].id,
        material_id=mat_map["MAT-ALU-A380"].id,
        quotation_ref="QT-HIND-2026-144",
        quote_price=260.0,
        currency="INR",
        min_order_qty=500.0,
        valid_from=now - timedelta(days=45),
        valid_to=now + timedelta(days=20),
        is_active=True
    ))
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-JINDAL-SS"].id,
        material_id=mat_map["MAT-SST-304"].id,
        quotation_ref="QT-JIND-2026-441",
        quote_price=340.0,
        currency="INR",
        min_order_qty=300.0,
        valid_from=now - timedelta(days=30),
        valid_to=now + timedelta(days=15),
        is_active=True
    ))

    # 6. Products, BOMs and Production Costs
    # Product 1: Heavy Industrial Flange
    prod_flange = Product(
        business_id=business.id,
        code="PRD-HIF-200",
        name="Heavy Industrial Flange (DN200 Class 150)",
        sku="HIF-DN200-S01",
        category="Industrial Piping & Pressure Vessels",
        selling_price=4200.0,
        target_margin_percent=25.0,
        critical_margin_threshold=16.0,
        is_active=True
    )
    db.add(prod_flange)
    db.flush()

    bom_flange = BOM(business_id=business.id, product_id=prod_flange.id, version="1.0", is_active=True, notes="Standard ASTM A105 forging BOM")
    db.add(bom_flange)
    db.flush()

    db.add(BOMItem(bom_id=bom_flange.id, material_id=mat_map["MAT-STL-2062"].id, quantity=12.0, unit="kg", scrap_percent=5.0, process_stage="Forging Blank"))
    db.add(BOMItem(bom_id=bom_flange.id, material_id=mat_map["MAT-WLD-70S6"].id, quantity=0.8, unit="kg", scrap_percent=0.0, process_stage="Bevel Weld"))

    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_flange.id,
        direct_labour_hours=1.5,
        labour_rate_hourly=350.0,
        machine_hours=1.2,
        machine_rate_hourly=750.0,
        energy_kwh=18.0,
        energy_rate_kwh=8.5,
        fixed_overhead_per_unit=250.0,
        packaging_freight_per_unit=120.0
    ))

    # Product 2: Lightweight Aviation Bracket
    prod_bracket = Product(
        business_id=business.id,
        code="PRD-LAB-6061",
        name="Precision Lightweight Aviation Bracket",
        sku="LAB-6061-T6",
        category="Aerospace & Defence Components",
        selling_price=5800.0,
        target_margin_percent=30.0,
        critical_margin_threshold=18.0,
        is_active=True
    )
    db.add(prod_bracket)
    db.flush()

    bom_bracket = BOM(business_id=business.id, product_id=prod_bracket.id, version="2.1", is_active=True, notes="Precision 5-Axis CNC machined bracket")
    db.add(bom_bracket)
    db.flush()

    db.add(BOMItem(bom_id=bom_bracket.id, material_id=mat_map["MAT-ALU-6061"].id, quantity=4.5, unit="kg", scrap_percent=8.0, process_stage="CNC Milling"))
    db.add(BOMItem(bom_id=bom_bracket.id, material_id=mat_map["MAT-SST-304"].id, quantity=0.4, unit="kg", scrap_percent=2.0, process_stage="Hardened Pin Insertion"))

    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_bracket.id,
        direct_labour_hours=2.2,
        labour_rate_hourly=400.0,
        machine_hours=2.0,
        machine_rate_hourly=850.0,
        energy_kwh=24.0,
        energy_rate_kwh=8.5,
        fixed_overhead_per_unit=300.0,
        packaging_freight_per_unit=150.0
    ))

    # Product 3: Automotive Transmission Housing
    prod_housing = Product(
        business_id=business.id,
        code="PRD-ATH-902",
        name="Automotive Transmission Housing",
        sku="ATH-ALU-902",
        category="Automotive Powertrain",
        selling_price=9500.0,
        target_margin_percent=28.0,
        critical_margin_threshold=16.0,
        is_active=True
    )
    db.add(prod_housing)
    db.flush()

    bom_housing = BOM(business_id=business.id, product_id=prod_housing.id, version="1.0", is_active=True, notes="High pressure die cast aluminium housing")
    db.add(bom_housing)
    db.flush()

    db.add(BOMItem(bom_id=bom_housing.id, material_id=mat_map["MAT-ALU-A380"].id, quantity=8.0, unit="kg", scrap_percent=4.0, process_stage="Die Casting"))
    db.add(BOMItem(bom_id=bom_housing.id, material_id=mat_map["MAT-STL-2062"].id, quantity=1.5, unit="kg", scrap_percent=0.0, process_stage="Steel Bearing Bushing"))

    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_housing.id,
        direct_labour_hours=3.0,
        labour_rate_hourly=350.0,
        machine_hours=2.8,
        machine_rate_hourly=800.0,
        energy_kwh=42.0,
        energy_rate_kwh=8.5,
        fixed_overhead_per_unit=450.0,
        packaging_freight_per_unit=200.0
    ))

    # 7. Customer Orders
    db.add(CustomerOrder(
        business_id=business.id,
        order_number="ORD-2026-LT-101",
        customer_name="Larsen & Toubro Heavy Engineering",
        product_id=prod_flange.id,
        quantity=150.0,
        agreed_unit_price=4200.0,
        order_date=now - timedelta(days=10),
        promised_delivery_date=now + timedelta(days=25),
        status="ACCEPTED",
        margin_guard_status="ATTRACTIVE",
        calculated_margin_percent=26.4
    ))

    db.add(CustomerOrder(
        business_id=business.id,
        order_number="ORD-2026-HAL-102",
        customer_name="Hindustan Aeronautics Component Division",
        product_id=prod_bracket.id,
        quantity=60.0,
        agreed_unit_price=5800.0,
        order_date=now - timedelta(days=5),
        promised_delivery_date=now + timedelta(days=20),
        status="PENDING_REVIEW",
        margin_guard_status="VERIFY",
        calculated_margin_percent=30.8
    ))

    db.add(CustomerOrder(
        business_id=business.id,
        order_number="ORD-2026-MAH-103",
        customer_name="Mahindra & Mahindra Powertrain Division",
        product_id=prod_housing.id,
        quantity=120.0,
        agreed_unit_price=9500.0,
        order_date=now - timedelta(days=2),
        promised_delivery_date=now + timedelta(days=35),
        status="PENDING_REVIEW",
        margin_guard_status="ATTRACTIVE",
        calculated_margin_percent=27.2
    ))

    db.commit()
    return business
