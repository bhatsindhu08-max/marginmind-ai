from datetime import datetime, timedelta, timezone
from typing import Optional
from sqlalchemy.orm import Session
from backend.app.models import (
    Business, User, Material, MaterialIndexMapping, Supplier,
    SupplierQuotation, Inventory, Product, BOM, BOMItem,
    ProductionCost, CustomerOrder, PurchaseHistory, MarketEvent
)
from backend.app.core.security import get_password_hash
from backend.app.services.market_intelligence import MarketIntelligenceService


def seed_textile_demonstration(db: Session, business_id: Optional[int] = None) -> Business:
    """
    Seeds a complete, production-grade Textile & Apparel Manufacturing dataset.
    If business_id is provided, seeds garments, BOMs, worker headcounts, wages,
    materials, and orders for that specific registered tenant.
    If business_id is None, seeds Vardhman Heritage Textiles as the default demo enterprise.
    """
    # 1. Initialize External Markets (cotton, textiles, fx)
    mkt_service = MarketIntelligenceService(db)
    mkt_service.seed_historical_market_observations()

    # 2. Get or create Business
    if business_id is not None:
        business = db.query(Business).filter(Business.id == business_id).first()
        if not business:
            raise ValueError(f"Business ID {business_id} not found.")
        # Check if already seeded
        has_prods = db.query(Product).filter(Product.business_id == business.id).first()
        if has_prods:
            return business
    else:
        existing = db.query(Business).filter(Business.slug == "vardhman-heritage-textiles").first()
        if existing:
            return existing

        business = Business(
            name="Vardhman Heritage Textiles & Garments Ltd.",
            slug="vardhman-heritage-textiles",
            industry_type="textile_garment",
            currency="INR",
            address="Focal Point Phase IV, Ludhiana - 141010, Punjab, India",
            settings_json={
                "default_target_margin": 28.0,
                "critical_margin_threshold": 18.0,
                "auto_evaluate_orders": True,
                "demo_mode": True
            }
        )
        db.add(business)
        db.flush()

        # Users for Vardhman demo
        users = [
            User(
                business_id=business.id,
                email="owner@vardhmantextiles.com",
                hashed_password=get_password_hash("password123"),
                full_name="Karan Oswal (Managing Director)",
                role="business_owner"
            ),
            User(
                business_id=business.id,
                email="finance@vardhmantextiles.com",
                hashed_password=get_password_hash("password123"),
                full_name="Meenakshi Iyer (VP Finance & Costing)",
                role="finance_manager"
            ),
            User(
                business_id=business.id,
                email="procurement@vardhmantextiles.com",
                hashed_password=get_password_hash("password123"),
                full_name="Ramesh Nair (Head of Fabric Sourcing)",
                role="procurement_manager"
            ),
            User(
                business_id=business.id,
                email="production@vardhmantextiles.com",
                hashed_password=get_password_hash("password123"),
                full_name="Sunil Pillai (Apparel Plant General Manager)",
                role="production_manager"
            )
        ]
        db.add_all(users)
        db.flush()

    # 3. Materials Specific to Apparel & Garment Manufacturing
    materials_data = [
        {
            "code": "MAT-CTN-JERSEY",
            "name": "100% Combed Cotton Single Jersey (180 GSM)",
            "category": "Knitted Fabrics",
            "unit": "kg",
            "cost": 340.0,
            "market": 340.0,
            "stock": 3500.0,
            "index": "COTTON_CANDY",
            "multiplier": 0.0055,
            "notes": "Premium combed compact yarn knit for high-end T-shirts."
        },
        {
            "code": "MAT-DNM-TWILL",
            "name": "Indigo Ring Spun Stretch Denim (12.5 oz Twill)",
            "category": "Woven Fabrics",
            "unit": "meter",
            "cost": 245.0,
            "market": 245.0,
            "stock": 2800.0,
            "index": "COTTON_CANDY",
            "multiplier": 0.0040,
            "notes": "98% Cotton / 2% Spandex rope-dyed authentic indigo denim."
        },
        {
            "code": "MAT-GZA-OXF",
            "name": "100% Giza Long-Staple Cotton Oxford Fabric (80s/2)",
            "category": "Premium Woven",
            "unit": "meter",
            "cost": 380.0,
            "market": 380.0,
            "stock": 1500.0,
            "index": "WB_COTTON_A_INDEX",
            "multiplier": 1.85,
            "notes": "Luxury two-fold long-staple Egyptian cotton for executive dress shirts."
        },
        {
            "code": "MAT-RYN-CHALLIS",
            "name": "Viscose Rayon Challis Woven Fabric (140 GSM)",
            "category": "Cellulosic Woven",
            "unit": "meter",
            "cost": 165.0,
            "market": 165.0,
            "stock": 2200.0,
            "index": "WPI_TEXTILE",
            "multiplier": 1.10,
            "notes": "Soft drape reactive print base fabric for women's dresses."
        },
        {
            "code": "MAT-CNV-DUCK",
            "name": "Heavy Cotton Duck Canvas Fabric (350 GSM / 10 oz)",
            "category": "Technical Woven",
            "unit": "meter",
            "cost": 320.0,
            "market": 320.0,
            "stock": 1200.0,
            "index": "COTTON_CANDY",
            "multiplier": 0.0052,
            "notes": "Rugged tightly-woven plied yarn canvas for workwear jackets."
        },
        {
            "code": "MAT-RIB-SPANDEX",
            "name": "1x1 Cotton Spandex Tubular Collar Rib (240 GSM)",
            "category": "Knitted Fabrics",
            "unit": "kg",
            "cost": 390.0,
            "market": 390.0,
            "stock": 450.0,
            "index": "COTTON_CANDY",
            "multiplier": 0.0060,
            "notes": "High recovery spandex rib for knit necklines and cuffs."
        },
        {
            "code": "MAT-THRD-POLY",
            "name": "High-Tenacity Spun Polyester Sewing Thread (40/2 & 50/2)",
            "category": "Trims & Threads",
            "unit": "kg",
            "cost": 280.0,
            "market": 280.0,
            "stock": 350.0,
            "index": "BRENT_CRUDE",
            "multiplier": 3.50,
            "notes": "Durable lockstitch sewing thread; sensitive to petrochemical polymer prices."
        },
        {
            "code": "MAT-TRIM-FUSIBLE",
            "name": "Woven Fusible Collar Interlining & Pocketing (TC 65/35)",
            "category": "Trims & Interlining",
            "unit": "meter",
            "cost": 85.0,
            "market": 85.0,
            "stock": 1800.0,
            "index": "WPI_TEXTILE",
            "multiplier": 0.55,
            "notes": "Precision resin-coated fusible interlining for crisp collars and durable pocket bags."
        }
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
            min_safety_stock=150.0,
            is_active=True
        )
        db.add(mat)
        db.flush()
        mat_map[md["code"]] = mat

        # Index mapping
        db.add(MaterialIndexMapping(
            business_id=business.id,
            material_id=mat.id,
            indicator_code=md["index"],
            multiplier=md["multiplier"],
            basis_spread=0.0,
            freight_basis=1.5,
            notes=md["notes"]
        ))

        # Initial Inventory
        db.add(Inventory(
            business_id=business.id,
            material_id=mat.id,
            current_stock=md["stock"],
            unit=md["unit"],
            weighted_average_cost=md["cost"],
            reorder_level=300.0,
            safety_stock=150.0
        ))

    # 4. Suppliers & Quotations
    suppliers_data = [
        {"code": "SUP-VRD-MILLS", "name": "Vardhman Yarns & Threads Ltd.", "email": "commercial@vardhmanthreads.com", "lead": 8, "rating": "LOW", "score": 0.98, "terms": "Net 30"},
        {"code": "SUP-ARV-DENIM", "name": "Arvind Limited Denim Division", "email": "denim.orders@arvind.com", "lead": 12, "rating": "LOW", "score": 0.96, "terms": "Net 45"},
        {"code": "SUP-CBE-COTTON", "name": "Coimbatore Cotton Consortium", "email": "commercial@cbe-cotton.org", "lead": 7, "rating": "LOW", "score": 0.95, "terms": "Net 30"},
        {"code": "SUP-YKK-INDIA", "name": "YKK India Fasteners Pvt. Ltd.", "email": "oem.orders@ykkindia.com", "lead": 10, "rating": "MEDIUM", "score": 0.93, "terms": "Net 30"}
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
    # Supplier Quotations
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-CBE-COTTON"].id,
        material_id=mat_map["MAT-CTN-JERSEY"].id,
        quotation_ref="QT-CBE-2026-801",
        quote_price=340.0,
        currency="INR",
        min_order_qty=500.0,
        valid_from=now - timedelta(days=60),
        valid_to=now + timedelta(days=30),
        is_active=True
    ))
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-ARV-DENIM"].id,
        material_id=mat_map["MAT-DNM-TWILL"].id,
        quotation_ref="QT-ARV-2026-440",
        quote_price=245.0,
        currency="INR",
        min_order_qty=800.0,
        valid_from=now - timedelta(days=45),
        valid_to=now + timedelta(days=25),
        is_active=True
    ))
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-VRD-MILLS"].id,
        material_id=mat_map["MAT-GZA-OXF"].id,
        quotation_ref="QT-VRD-2026-912",
        quote_price=380.0,
        currency="INR",
        min_order_qty=400.0,
        valid_from=now - timedelta(days=30),
        valid_to=now + timedelta(days=30),
        is_active=True
    ))
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-VRD-MILLS"].id,
        material_id=mat_map["MAT-THRD-POLY"].id,
        quotation_ref="QT-VRD-2026-105",
        quote_price=280.0,
        currency="INR",
        min_order_qty=100.0,
        valid_from=now - timedelta(days=30),
        valid_to=now + timedelta(days=60),
        is_active=True
    ))

    # 5. Products, BOMs and Production Costs (WITH Workers, Daily Wages, Jobwork & All Overhead)

    # PRODUCT 1: Men's Bio-Washed Combed Cotton T-Shirt (180 GSM Single Jersey)
    prod_tshirt = Product(
        business_id=business.id,
        code="PRD-TSH-180",
        name="Men's Bio-Washed Combed Cotton T-Shirt (180 GSM)",
        sku="TSH-COM-180-BIO",
        category="Knitted Casualwear",
        selling_price=450.0,
        target_margin_percent=28.0,
        critical_margin_threshold=18.0,
        is_active=True
    )
    db.add(prod_tshirt)
    db.flush()

    bom_tshirt = BOM(business_id=business.id, product_id=prod_tshirt.id, version="1.0", is_active=True, notes="Export Grade Bio-Washed T-Shirt BOM")
    db.add(bom_tshirt)
    db.flush()
    # 0.28 kg cotton fabric with 7% cutting loss
    db.add(BOMItem(bom_id=bom_tshirt.id, material_id=mat_map["MAT-CTN-JERSEY"].id, quantity=0.28, unit="kg", scrap_percent=7.0, process_stage="Fabric Cutting"))
    db.add(BOMItem(bom_id=bom_tshirt.id, material_id=mat_map["MAT-RIB-SPANDEX"].id, quantity=0.03, unit="kg", scrap_percent=4.0, process_stage="Neck Rib Attachment"))
    db.add(BOMItem(bom_id=bom_tshirt.id, material_id=mat_map["MAT-THRD-POLY"].id, quantity=0.015, unit="kg", scrap_percent=0.0, process_stage="Overlock & Flatlock Stitching"))

    # Production cost: 24 operators + 6 helpers = 30 workers @ ₹650/day yielding 600 pieces/day => ₹32.50 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_tshirt.id,
        worker_count=30,
        wage_per_worker_daily=650.0,
        daily_output_units=600.0,
        direct_labour_hours=0.4,
        labour_rate_hourly=81.25,
        processing_jobwork_cost_per_unit=32.0,  # ₹18 enzyme bio-wash + ₹14 4-color chest screen printing
        inspection_qc_cost_per_unit=5.50,      # In-line & final trimming, checking, thread clipping
        boiler_steam_fuel_per_unit=6.50,       # Steam boiler fuel & vacuum iron pressing
        consumables_cost_per_unit=6.50,        # Biodegradable polybag, neck heat transfer, hangtag
        fixed_overhead_per_unit=22.0,          # Factory rent, supervisor salaries, admin
        packaging_freight_per_unit=8.0,        # Master corrugated shipper cartons & dispatch freight
        machine_hours=0.25,
        machine_rate_hourly=20.0,
        energy_kwh=0.8,
        energy_rate_kwh=8.0,
        cost_breakdown_json={
            "description": "Export knitwear crew line costing",
            "cutting_operators": 4,
            "sewing_operators": 20,
            "line_helpers": 6,
            "bio_wash_rate": 18.0,
            "screen_print_rate": 14.0
        }
    ))

    # PRODUCT 2: Slim-Fit Stretch Denim Jeans (12.5 oz Indigo Twill)
    prod_denim = Product(
        business_id=business.id,
        code="PRD-DNM-JNS-12",
        name="Slim-Fit Stretch Denim Jeans (12.5 oz Indigo Twill)",
        sku="DNM-SLM-125-IND",
        category="Denim & Bottomwear",
        selling_price=1650.0,
        target_margin_percent=32.0,
        critical_margin_threshold=20.0,
        is_active=True
    )
    db.add(prod_denim)
    db.flush()

    bom_denim = BOM(business_id=business.id, product_id=prod_denim.id, version="1.0", is_active=True, notes="5-Pocket Authentic Washed Denim BOM")
    db.add(bom_denim)
    db.flush()
    # 1.45 meters stretch denim with 6% cutting scrap
    db.add(BOMItem(bom_id=bom_denim.id, material_id=mat_map["MAT-DNM-TWILL"].id, quantity=1.45, unit="meter", scrap_percent=6.0, process_stage="Laser & Automated Knife Cutting"))
    db.add(BOMItem(bom_id=bom_denim.id, material_id=mat_map["MAT-TRIM-FUSIBLE"].id, quantity=0.25, unit="meter", scrap_percent=3.0, process_stage="Pocket Bags & Waistband Fusing"))
    db.add(BOMItem(bom_id=bom_denim.id, material_id=mat_map["MAT-THRD-POLY"].id, quantity=0.05, unit="kg", scrap_percent=0.0, process_stage="Heavy Chainstitch & Bar-tacking"))

    # Production cost: 38 operators + 8 helpers + 2 master cutters = 48 workers @ ₹720/day yielding 350 jeans/day => ₹98.74 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_denim.id,
        worker_count=48,
        wage_per_worker_daily=720.0,
        daily_output_units=350.0,
        direct_labour_hours=1.1,
        labour_rate_hourly=89.76,
        processing_jobwork_cost_per_unit=95.0,  # Stone enzyme wash, hand scraping, 3D whiskering & ozone tint
        inspection_qc_cost_per_unit=14.0,       # Metal detector needle check, thread trimming, measurement audit
        boiler_steam_fuel_per_unit=16.0,        # High-pressure dummy topper steam form pressing
        consumables_cost_per_unit=46.50,        # Brass shank button, 6 copper rivets, YKK #5 brass zipper, jacron patch
        fixed_overhead_per_unit=65.0,           # Plant overhead, sample room, wash plant depreciation
        packaging_freight_per_unit=24.0,        # Heavy hanger pack, desiccant pouches & outer export carton
        machine_hours=0.8,
        machine_rate_hourly=30.0,
        energy_kwh=2.5,
        energy_rate_kwh=8.0,
        cost_breakdown_json={
            "description": "5-pocket heavy denim manufacturing & laundry wash costing",
            "cutting_crew": 4,
            "sewing_operators": 36,
            "wash_technicians": 8,
            "laundry_wash_treatment": 95.0,
            "hardware_accessories": 46.50
        }
    ))

    # PRODUCT 3: Formal Executive Giza Cotton Oxford Shirt (80s 2-ply)
    prod_shirt = Product(
        business_id=business.id,
        code="PRD-SHT-GZA-80",
        name="Formal Executive Giza Cotton Oxford Shirt (80s 2-ply)",
        sku="SHT-OXF-GZA-WHT",
        category="Woven Formalwear",
        selling_price=1850.0,
        target_margin_percent=35.0,
        critical_margin_threshold=22.0,
        is_active=True
    )
    db.add(prod_shirt)
    db.flush()

    bom_shirt = BOM(business_id=business.id, product_id=prod_shirt.id, version="1.0", is_active=True, notes="Hand-Tailored High Count Formal Shirt BOM")
    db.add(bom_shirt)
    db.flush()
    # 1.6 meters Giza oxford with 5% scrap
    db.add(BOMItem(bom_id=bom_shirt.id, material_id=mat_map["MAT-GZA-OXF"].id, quantity=1.60, unit="meter", scrap_percent=5.0, process_stage="Pattern Matching & Precision Cutting"))
    db.add(BOMItem(bom_id=bom_shirt.id, material_id=mat_map["MAT-TRIM-FUSIBLE"].id, quantity=0.20, unit="meter", scrap_percent=2.0, process_stage="Collar & Cuff Micro-dot Interlining Fusing"))
    db.add(BOMItem(bom_id=bom_shirt.id, material_id=mat_map["MAT-THRD-POLY"].id, quantity=0.03, unit="kg", scrap_percent=0.0, process_stage="18-SPI Single Needle Lockstitch Assembly"))

    # Production cost: 32 tailors + 4 specialists + 6 helpers = 42 workers @ ₹750/day yielding 400 shirts/day => ₹78.75 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_shirt.id,
        worker_count=42,
        wage_per_worker_daily=750.0,
        daily_output_units=400.0,
        direct_labour_hours=0.85,
        labour_rate_hourly=92.65,
        processing_jobwork_cost_per_unit=42.0,  # Fabric pre-shrinking, liquid ammonia silk-touch wash
        inspection_qc_cost_per_unit=15.0,       # 100% loose thread vacuum suction & button pull testing
        boiler_steam_fuel_per_unit=18.0,        # Industrial collar/cuff press & vacuum steam form pressing
        consumables_cost_per_unit=24.0,         # 14 mother-of-pearl buttons, collar stays, butterfly clips, tissue insert
        fixed_overhead_per_unit=75.0,           # Clean room environment, quality audit lab, factory overhead
        packaging_freight_per_unit=28.0,        # Individual premium rigid gift box, moisture barrier, carton freight
        machine_hours=0.5,
        machine_rate_hourly=25.0,
        energy_kwh=1.5,
        energy_rate_kwh=8.0,
        cost_breakdown_json={
            "description": "High SPI executive dress shirt precision assembly",
            "collar_specialists": 6,
            "cuff_specialists": 4,
            "tailors": 26,
            "helpers": 6,
            "finishing_steam": 18.0
        }
    ))

    # PRODUCT 4: Women's Printed Viscose Rayon Casual Tunic Dress (140 GSM)
    prod_dress = Product(
        business_id=business.id,
        code="PRD-DRS-RYN-140",
        name="Women's Printed Viscose Rayon Casual Tunic Dress (140 GSM)",
        sku="DRS-CAS-RYN-FLR",
        category="Women's Ready-to-Wear",
        selling_price=950.0,
        target_margin_percent=30.0,
        critical_margin_threshold=18.0,
        is_active=True
    )
    db.add(prod_dress)
    db.flush()

    bom_dress = BOM(business_id=business.id, product_id=prod_dress.id, version="1.0", is_active=True, notes="Flared Tunic Silhouette Dress BOM")
    db.add(bom_dress)
    db.flush()
    # 2.2 meters viscose rayon with 8% cutting scrap
    db.add(BOMItem(bom_id=bom_dress.id, material_id=mat_map["MAT-RYN-CHALLIS"].id, quantity=2.20, unit="meter", scrap_percent=8.0, process_stage="Flared Skirt & Bodice Cutting"))
    db.add(BOMItem(bom_id=bom_dress.id, material_id=mat_map["MAT-THRD-POLY"].id, quantity=0.03, unit="kg", scrap_percent=0.0, process_stage="Ruffle & Seam Stitching"))

    # Production cost: 22 sewing operators + 5 helpers = 27 workers @ ₹680/day yielding 350 dresses/day => ₹52.46 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_dress.id,
        worker_count=27,
        wage_per_worker_daily=680.0,
        daily_output_units=350.0,
        direct_labour_hours=0.6,
        labour_rate_hourly=87.43,
        processing_jobwork_cost_per_unit=48.0,  # All-over floral rotary screen printing & silicon softener wash
        inspection_qc_cost_per_unit=8.50,       # Hem leveling, visual print flaw inspection & thread clipping
        boiler_steam_fuel_per_unit=9.0,         # Tunnel steam finisher & vertical drape pressing
        consumables_cost_per_unit=15.50,        # Concealed invisible YKK zipper, satin wash care label, brand tag
        fixed_overhead_per_unit=36.0,           # Factory space & utilities overhead
        packaging_freight_per_unit=12.0,        # Anti-static polybag, barcode hangtag, corrugated carton
        machine_hours=0.4,
        machine_rate_hourly=22.0,
        energy_kwh=1.0,
        energy_rate_kwh=8.0,
        cost_breakdown_json={
            "description": "Women's dress fluid fabric assembly",
            "printing_finish": 48.0,
            "invisible_zipper_hardware": 12.0
        }
    ))

    # PRODUCT 5: Heavy Canvas Duck Workwear Utility Jacket (350 GSM)
    prod_jacket = Product(
        business_id=business.id,
        code="PRD-JKT-CNV-350",
        name="Heavy Canvas Duck Workwear Utility Jacket (350 GSM)",
        sku="JKT-WRK-CNV-TAN",
        category="Outerwear & Industrial Workwear",
        selling_price=2400.0,
        target_margin_percent=28.0,
        critical_margin_threshold=17.0,
        is_active=True
    )
    db.add(prod_jacket)
    db.flush()

    bom_jacket = BOM(business_id=business.id, product_id=prod_jacket.id, version="1.0", is_active=True, notes="Industrial Triple-Stitch Canvas Jacket BOM")
    db.add(bom_jacket)
    db.flush()
    # 2.4 meters heavy duck canvas with 6% scrap
    db.add(BOMItem(bom_id=bom_jacket.id, material_id=mat_map["MAT-CNV-DUCK"].id, quantity=2.40, unit="meter", scrap_percent=6.0, process_stage="Heavy Duty Pattern Cutting"))
    db.add(BOMItem(bom_id=bom_jacket.id, material_id=mat_map["MAT-TRIM-FUSIBLE"].id, quantity=0.30, unit="meter", scrap_percent=2.0, process_stage="Collar & Pocket Flap Reinforcement"))
    db.add(BOMItem(bom_id=bom_jacket.id, material_id=mat_map["MAT-THRD-POLY"].id, quantity=0.06, unit="kg", scrap_percent=0.0, process_stage="Triple Needle Lap Seam Stitching"))

    # Production cost: 34 heavy-stitch operators + 8 helpers = 42 workers @ ₹780/day yielding 220 jackets/day => ₹148.91 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_jacket.id,
        worker_count=42,
        wage_per_worker_daily=780.0,
        daily_output_units=220.0,
        direct_labour_hours=1.5,
        labour_rate_hourly=99.27,
        processing_jobwork_cost_per_unit=65.0,  # DWR durable water repellent coating, garment enzyme break wash
        inspection_qc_cost_per_unit=18.0,       # Stress point rivet inspection, tensile seam load test, trimming
        boiler_steam_fuel_per_unit=22.0,        # Heavy industrial steam mannequin finishing & drying
        consumables_cost_per_unit=200.0,        # Quilted thermal lining, heavy #8 antique brass two-way zipper, corduroy trim
        fixed_overhead_per_unit=95.0,           # Heavy equipment depreciation, power & factory overhead
        packaging_freight_per_unit=35.0,        # Heavy duty dust cover, heavy-duty 5-ply export shipper carton
        machine_hours=1.2,
        machine_rate_hourly=40.0,
        energy_kwh=3.2,
        energy_rate_kwh=8.0,
        cost_breakdown_json={
            "description": "Heavy industrial workwear jacket construction",
            "hardware_and_thermal_lining": 200.0,
            "dwr_coating": 65.0,
            "heavy_stitching_crew": 42
        }
    ))

    # 6. Customer Orders (Real apparel brands)
    orders_data = [
        {
            "order_number": "ORD-ZARA-901",
            "customer": "Zara / Inditex Global Sourcing Hub",
            "product": prod_tshirt,
            "quantity": 2500.0,
            "agreed_price": 450.0,
            "lead_days": 21,
            "status": "APPROVED",
            "notes": "Fast-fashion high volume summer knit program. Strict delivery window."
        },
        {
            "order_number": "ORD-LEVI-442",
            "customer": "Levi's India Retail Pvt. Ltd.",
            "product": prod_denim,
            "quantity": 1200.0,
            "agreed_price": 1650.0,
            "lead_days": 28,
            "status": "APPROVED",
            "notes": "Core line indigo stretch denim. High stone-wash quality standard."
        },
        {
            "order_number": "ORD-RAYM-308",
            "customer": "Raymond Luxury Apparel Ltd.",
            "product": prod_shirt,
            "quantity": 800.0,
            "agreed_price": 1850.0,
            "lead_days": 25,
            "status": "PENDING",
            "notes": "Autumn formalwear launch. 80s two-fold Giza cotton requirement."
        },
        {
            "order_number": "ORD-MNS-115",
            "customer": "Marks & Spencer Reliance India",
            "product": prod_dress,
            "quantity": 1000.0,
            "agreed_price": 950.0,
            "lead_days": 20,
            "status": "PENDING",
            "notes": "Spring printed rayon dress collection. Color fastness test certificates mandatory."
        },
        {
            "order_number": "ORD-CAT-550",
            "customer": "Caterpillar Workwear India",
            "product": prod_jacket,
            "quantity": 500.0,
            "agreed_price": 2400.0,
            "lead_days": 35,
            "status": "PENDING",
            "notes": "Heavy canvas utility jacket for industrial personnel. DWR water repellency required."
        }
    ]

    for od in orders_data:
        db.add(CustomerOrder(
            business_id=business.id,
            order_number=od["order_number"],
            customer_name=od["customer"],
            product_id=od["product"].id,
            quantity=od["quantity"],
            agreed_unit_price=od["agreed_price"],
            order_date=now - timedelta(days=5),
            promised_delivery_date=now + timedelta(days=od["lead_days"]),
            status=od["status"],
            margin_guard_status="ATTRACTIVE" if od["status"] == "APPROVED" else "NOT_EVALUATED"
        ))

    # 7. Textile-Specific Market Events
    textile_events = [
        {
            "title": "Raw Cotton Mandi Arrivals Drop 18% in Gujarat & Punjab Amid Unseasonal Rain",
            "source": "Ministry of Textiles / Cotton Association of India (CAI)",
            "summary": "Mandi arrivals of Shankar-6 and J-34 raw cotton dropped significantly due to localized rains, triggering an 8.5% upward revision in spot cotton candy prices across northern and western spinning belts.",
            "category": "COMMODITY_SURGE",
            "severity": "HIGH",
            "affected_materials": ["MAT-CTN-JERSEY", "MAT-DNM-TWILL", "MAT-CNV-DUCK"],
            "days_ago": 3
        },
        {
            "title": "Government Extends RoSCTL Export Rebate Scheme for Made-ups & Garments up to 2028",
            "source": "Directorate General of Foreign Trade (DGFT) Notification",
            "summary": "The Ministry of Commerce & Industry extended the Rebate of State and Central Taxes and Levies (RoSCTL) scheme for apparel exports, securing duty remission predictability of 3.8% to 4.2% on FOB values.",
            "category": "POLICY_CHANGE",
            "severity": "MEDIUM",
            "affected_materials": ["MAT-CTN-JERSEY", "MAT-GZA-OXF"],
            "days_ago": 7
        },
        {
            "title": "Crude Oil Benchmark Rises to $84/bbl; Synthetic Polyester & Viscose Input Costs Firm",
            "source": "Petroleum Planning & Analysis Cell (PPAC)",
            "summary": "Upward pressure on Purified Terephthalic Acid (PTA) and Monoethylene Glycol (MEG) from higher crude oil benchmarks has led domestic filament yarn and sewing thread manufacturers to announce ₹12/kg price revisions.",
            "category": "COMMODITY_SURGE",
            "severity": "MEDIUM",
            "affected_materials": ["MAT-THRD-POLY", "MAT-RYN-CHALLIS"],
            "days_ago": 12
        }
    ]

    for ev in textile_events:
        db.add(MarketEvent(
            source_name=ev["source"],
            source_url="https://texmin.nic.in/market-bulletins",
            event_type=ev["category"],
            title=ev["title"],
            summary=ev["summary"],
            published_date=now - timedelta(days=ev["days_ago"]),
            severity=ev["severity"],
            affected_materials_json=ev["affected_materials"],
            affected_industries_json=["textile_garment", "textile_garments"],
            confidence_score=0.94,
            is_verified=True
        ))

    db.commit()
    return business
