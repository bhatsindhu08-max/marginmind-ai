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


def seed_food_demonstration(db: Session, business_id: Optional[int] = None) -> Business:
    """
    Seeds a complete, production-grade Food Processing & Packaging Manufacturing dataset.
    If business_id is provided, seeds food products, BOMs, worker headcounts, wages,
    materials, and orders for that specific registered tenant.
    If business_id is None, seeds NatureFresh Agro-Foods as the demo enterprise.
    """
    # 1. Initialize External Markets
    mkt_service = MarketIntelligenceService(db)
    mkt_service.seed_historical_market_observations()

    # 2. Get or create Business
    if business_id is not None:
        business = db.query(Business).filter(Business.id == business_id).first()
        if not business:
            raise ValueError(f"Business ID {business_id} not found.")
        has_prods = db.query(Product).filter(Product.business_id == business.id).first()
        if has_prods:
            return business
    else:
        existing = db.query(Business).filter(Business.slug == "naturefresh-agro-foods").first()
        if existing:
            return existing

        business = Business(
            name="NatureFresh Agro-Foods & Beverages Processing Ltd.",
            slug="naturefresh-agro-foods",
            industry_type="food_processing",
            currency="INR",
            location_hub="NASHIK_AGRO_PARK",
            address="Plot 55, Agro Processing Mega Food Park, Dindori Road, Nashik - 422004, Maharashtra, India",
            settings_json={
                "default_target_margin": 26.0,
                "critical_margin_threshold": 15.0,
                "auto_evaluate_orders": True,
                "demo_mode": True
            }
        )
        db.add(business)
        db.flush()

        # Users for NatureFresh Agro-Foods demo
        users = [
            User(
                business_id=business.id,
                email="owner@naturefreshfoods.com",
                hashed_password=get_password_hash("password123"),
                full_name="Vijayraj Deshmukh (Managing Director)",
                role="business_owner"
            ),
            User(
                business_id=business.id,
                email="finance@naturefreshfoods.com",
                hashed_password=get_password_hash("password123"),
                full_name="Pooja Kulkarni (VP Financial Control & Costing)",
                role="finance_manager"
            ),
            User(
                business_id=business.id,
                email="procurement@naturefreshfoods.com",
                hashed_password=get_password_hash("password123"),
                full_name="Sanjay Gaikwad (Head of APMC Mandi Procurement)",
                role="procurement_manager"
            ),
            User(
                business_id=business.id,
                email="production@naturefreshfoods.com",
                hashed_password=get_password_hash("password123"),
                full_name="Dr. Hemant Salunkhe (Food Processing & QA Director)",
                role="production_manager"
            )
        ]
        db.add_all(users)
        db.flush()

    # 3. Materials Specific to Food Processing & Aseptic Packaging
    materials_data = [
        {
            "code": "MAT-RAW-MANGO",
            "name": "Farm-Gate Grade-A Ratnagiri Alphonso Mangoes",
            "category": "Farm Produce & Fruit Base",
            "unit": "kg",
            "cost": 85.0,
            "market": 85.0,
            "stock": 12000.0,
            "index": "WPI_FOOD",
            "multiplier": 0.52,
            "notes": "Farm-gate sorted high-brix alphonso mangoes for aseptic processing."
        },
        {
            "code": "MAT-RAW-URAD-DAL",
            "name": "Organic Black Urad Whole Lentils (Mandi Auction)",
            "category": "Grains & Pulses",
            "unit": "kg",
            "cost": 105.0,
            "market": 105.0,
            "stock": 8500.0,
            "index": "WPI_FOOD",
            "multiplier": 0.65,
            "notes": "Direct farmer auction pulses for shelf-stable ready-to-eat products."
        },
        {
            "code": "MAT-DAIRY-BUTTER",
            "name": "Pasteurized Cultured Dairy Butter & Fresh Cream (82% Fat)",
            "category": "Dairy Ingredients",
            "unit": "kg",
            "cost": 460.0,
            "market": 460.0,
            "stock": 1800.0,
            "index": "WPI_FOOD",
            "multiplier": 2.85,
            "notes": "Fresh cold-chain dairy cream; sensitive to seasonal milk flush and fodder costs."
        },
        {
            "code": "MAT-SEED-MUSTARD",
            "name": "High-Oil Content Black Mustard Seeds (Brassica Juncea)",
            "category": "Oilseeds",
            "unit": "kg",
            "cost": 62.0,
            "market": 62.0,
            "stock": 15000.0,
            "index": "WPI_FOOD",
            "multiplier": 0.38,
            "notes": "Rajasthan mandi mustard seeds for cold-press Kachi Ghani extraction."
        },
        {
            "code": "MAT-GRAIN-MAIZE",
            "name": "Non-GMO Degermed Yellow Corn Grits & Barley Malt",
            "category": "Grains & Cereals",
            "unit": "kg",
            "cost": 34.0,
            "market": 34.0,
            "stock": 18000.0,
            "index": "WPI_FOOD",
            "multiplier": 0.21,
            "notes": "High starch grain grits for industrial food extrusion and breakfast flakes."
        },
        {
            "code": "MAT-NUT-MIX",
            "name": "California Almonds & Kashmiri Walnut Halves",
            "category": "Nuts & Dry Fruits",
            "unit": "kg",
            "cost": 720.0,
            "market": 720.0,
            "stock": 1400.0,
            "index": "RBI_USDINR",
            "multiplier": 8.50,
            "notes": "Premium tree nuts; heavily influenced by US Dollar import exchange rates."
        },
        {
            "code": "MAT-PKG-RETORT-POUCH",
            "name": "4-Layer Food-Grade Retort Pouch Film (PET/Alu/PA/Cast PP)",
            "category": "Flexible Packaging",
            "unit": "piece",
            "cost": 6.80,
            "market": 6.80,
            "stock": 35000.0,
            "index": "BRENT_CRUDE",
            "multiplier": 0.082,
            "notes": "121°C steam-retortable flexible pouch laminate; petrochemical polymer sensitive."
        },
        {
            "code": "MAT-PKG-TIN-3KG",
            "name": "Food-Grade OTS Tinplate Aseptic Can with Easy-Open Lid (3.1 kg)",
            "category": "Rigid Packaging",
            "unit": "piece",
            "cost": 42.0,
            "market": 42.0,
            "stock": 6000.0,
            "index": "WPI_STEEL",
            "multiplier": 0.27,
            "notes": "Double-lacquered sanitary tinplate food cans for bulk fruit pulp exports."
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
            min_safety_stock=300.0,
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
            freight_basis=1.2,
            notes=md["notes"]
        ))

        # Initial Inventory
        db.add(Inventory(
            business_id=business.id,
            material_id=mat.id,
            current_stock=md["stock"],
            unit=md["unit"],
            weighted_average_cost=md["cost"],
            reorder_level=600.0,
            safety_stock=300.0
        ))

    # 4. Suppliers & Quotations
    suppliers_data = [
        {"code": "SUP-MAHA-APMC", "name": "Maharashtra State Agricultural Marketing Board", "email": "mandi.auctions@msamb.com", "lead": 4, "rating": "LOW", "score": 0.98, "terms": "Immediate RTGS"},
        {"code": "SUP-AMUL-DAIRY", "name": "Gujarat Co-operative Milk Marketing Federation", "email": "commercial.bulk@amul.coop", "lead": 6, "rating": "LOW", "score": 0.99, "terms": "Net 15"},
        {"code": "SUP-UFLEX-PACK", "name": "UFlex Limited Sterile Packaging Division", "email": "retort.packaging@uflexltd.com", "lead": 10, "rating": "LOW", "score": 0.96, "terms": "Net 30"},
        {"code": "SUP-RAJ-OILSEED", "name": "Rajasthan Oilseeds Mandi Consortium (Alwar)", "email": "mustard.supply@rajoilseeds.org", "lead": 5, "rating": "MEDIUM", "score": 0.94, "terms": "Net 15"}
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
        supplier_id=supp_map["SUP-MAHA-APMC"].id,
        material_id=mat_map["MAT-RAW-MANGO"].id,
        quotation_ref="QT-APMC-2026-118",
        quote_price=85.0,
        currency="INR",
        min_order_qty=5000.0,
        valid_from=now - timedelta(days=60),
        valid_to=now + timedelta(days=30),
        is_active=True
    ))
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-AMUL-DAIRY"].id,
        material_id=mat_map["MAT-DAIRY-BUTTER"].id,
        quotation_ref="QT-AMUL-2026-402",
        quote_price=460.0,
        currency="INR",
        min_order_qty=500.0,
        valid_from=now - timedelta(days=45),
        valid_to=now + timedelta(days=25),
        is_active=True
    ))

    # 5. Products, BOMs and Production Costs (WITH Workers, Daily Wages, Retort Steam, QC & Cold Storage)

    # PRODUCT 1: Aseptic Packaged Alphonso Mango Puree (3.1 kg Can)
    prod_mango = Product(
        business_id=business.id,
        code="PRD-FOD-MNG-3KG",
        name="Aseptic Packaged Alphonso Mango Puree (3.1 kg Cans)",
        sku="FOD-MNG-3100-ASEP",
        category="Processed Fruit Pulp & Purees",
        selling_price=750.0,
        target_margin_percent=26.0,
        critical_margin_threshold=15.0,
        is_active=True
    )
    db.add(prod_mango)
    db.flush()

    bom_mango = BOM(business_id=business.id, product_id=prod_mango.id, version="1.0", is_active=True, notes="Export Grade 100% Pure Alphonso Mango Puree")
    db.add(bom_mango)
    db.flush()
    # 5.2 kg raw mango yields 3.1 kg puree (peel, seed destoning waste 40%)
    db.add(BOMItem(bom_id=bom_mango.id, material_id=mat_map["MAT-RAW-MANGO"].id, quantity=5.2, unit="kg", scrap_percent=5.0, process_stage="Washing, Ripening & Destoning Line"))
    db.add(BOMItem(bom_id=bom_mango.id, material_id=mat_map["MAT-PKG-TIN-3KG"].id, quantity=1.0, unit="piece", scrap_percent=1.0, process_stage="Automated Can Filling & Seaming"))

    # Production cost: 28 fruit grading, destoning & aseptic crew @ ₹580/day across 800 cans/day => ₹20.30 direct labour/can
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_mango.id,
        worker_count=28,
        wage_per_worker_daily=580.0,
        daily_output_units=800.0,
        direct_labour_hours=0.28,
        labour_rate_hourly=72.50,
        processing_jobwork_cost_per_unit=18.0,  # Continuous aseptic flash sterilization (108°C) & deaeration
        inspection_qc_cost_per_unit=6.0,       # FSSAI microbiological yeast/mold incubation & brix refractometer testing
        consumables_cost_per_unit=14.0,        # Cold storage pre-chilling & food-grade nitrogen head flushing
        boiler_steam_fuel_per_unit=12.50,      # Steam boiler fuel for pasteurization jacket kettles
        machine_hours=0.22,
        machine_rate_hourly=60.0,
        energy_kwh=1.8,
        energy_rate_kwh=7.80,
        fixed_overhead_per_unit=42.0,          # Cold storage plant depreciation, CIP sanitation & overhead
        packaging_freight_per_unit=15.0,        # Litho printed master export carton (6 cans/box) & dispatch freight
        cost_breakdown_json={
            "description": "Continuous aseptic puree extraction and hermetic seaming line",
            "fruit_grading_sorters": 14,
            "sterilization_operators": 8,
            "packaging_crew": 6,
            "brix_testing_qc": 6.0,
            "retort_pasteurization_steam": 12.50
        }
    ))

    # PRODUCT 2: Retort Shelf-Stable Ready-to-Eat Dal Makhani (300g Pouches)
    prod_dal = Product(
        business_id=business.id,
        code="PRD-FOD-DAL-300",
        name="Retort Shelf-Stable Ready-to-Eat Dal Makhani (300g Pouch)",
        sku="FOD-RTE-DAL-300G",
        category="Ready-to-Eat & Retort Meals",
        selling_price=145.0,
        target_margin_percent=32.0,
        critical_margin_threshold=18.0,
        is_active=True
    )
    db.add(prod_dal)
    db.flush()

    bom_dal = BOM(business_id=business.id, product_id=prod_dal.id, version="1.0", is_active=True, notes="Commercial Autoclave Retort Cooked Dal Makhani")
    db.add(bom_dal)
    db.flush()
    db.add(BOMItem(bom_id=bom_dal.id, material_id=mat_map["MAT-RAW-URAD-DAL"].id, quantity=0.14, unit="kg", scrap_percent=2.0, process_stage="Soaking & Slow Steam Kettle Cooking"))
    db.add(BOMItem(bom_id=bom_dal.id, material_id=mat_map["MAT-DAIRY-BUTTER"].id, quantity=0.045, unit="kg", scrap_percent=1.0, process_stage="Cream & Butter Emulsification"))
    db.add(BOMItem(bom_id=bom_dal.id, material_id=mat_map["MAT-PKG-RETORT-POUCH"].id, quantity=1.0, unit="piece", scrap_percent=1.5, process_stage="Pouch Filling & Ultrasonic Sealing"))

    # Production cost: 24 batch cooks & retort line crew @ ₹600/day across 1800 pouches/day => ₹8.00 direct labour/pouch
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_dal.id,
        worker_count=24,
        wage_per_worker_daily=600.0,
        daily_output_units=1800.0,
        direct_labour_hours=0.11,
        labour_rate_hourly=75.0,
        processing_jobwork_cost_per_unit=7.50,  # High-pressure steam autoclave retort sterilization (121°C F0=8)
        inspection_qc_cost_per_unit=2.50,       # 14-day incubator sterility holding test & burst seal tensile test
        consumables_cost_per_unit=4.50,         # Pure spices, Himalayan pink salt & food-grade tomato paste
        boiler_steam_fuel_per_unit=5.50,        # Steam boiler fuel for pressurized retort autoclaves
        machine_hours=0.08,
        machine_rate_hourly=40.0,
        energy_kwh=0.6,
        energy_rate_kwh=7.80,
        fixed_overhead_per_unit=12.0,           # Food hygiene certification, plant rent & QC lab amortisation
        packaging_freight_per_unit=4.50,        # Monocarton outer sleeve, shrink wrap & master shipper freight
        cost_breakdown_json={
            "description": "Autoclave retort sterilization 24-month ambient shelf life line",
            "kettle_cooks": 6,
            "retort_operators": 10,
            "packaging_inspection": 8,
            "retort_steam_sterilization": 7.50
        }
    ))

    # PRODUCT 3: Cold-Pressed Kachi Ghani Mustard Oil (1L Bottle)
    prod_oil = Product(
        business_id=business.id,
        code="PRD-FOD-OIL-1L",
        name="Cold-Pressed Kachi Ghani Mustard Oil (1L Bottle)",
        sku="FOD-OIL-MST-1L",
        category="Edible Oils & Fats",
        selling_price=220.0,
        target_margin_percent=28.0,
        critical_margin_threshold=16.0,
        is_active=True
    )
    db.add(prod_oil)
    db.flush()

    bom_oil = BOM(business_id=business.id, product_id=prod_oil.id, version="1.0", is_active=True, notes="Traditional Cold Screw Press Natural Pungent Mustard Oil")
    db.add(bom_oil)
    db.flush()
    # 2.85 kg mustard seeds yields 1 litre oil (35% extraction, remaining is cattle oil cake)
    db.add(BOMItem(bom_id=bom_oil.id, material_id=mat_map["MAT-SEED-MUSTARD"].id, quantity=2.85, unit="kg", scrap_percent=1.0, process_stage="Cold Expeller Screw Pressing"))

    # Production cost: 16 screw press & bottling operators @ ₹620/day across 1200 bottles/day => ₹8.27 direct labour/bottle
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_oil.id,
        worker_count=16,
        wage_per_worker_daily=620.0,
        daily_output_units=1200.0,
        direct_labour_hours=0.11,
        labour_rate_hourly=77.50,
        processing_jobwork_cost_per_unit=5.50,  # Multi-stage bag micro-filtration & gravity settling
        inspection_qc_cost_per_unit=2.80,       # Pungency testing (allyl isothiocyanate assay) & free fatty acid test
        consumables_cost_per_unit=18.0,         # Heavy flint glass bottle, induction seal cap, front/back label
        boiler_steam_fuel_per_unit=0.0,
        machine_hours=0.10,
        machine_rate_hourly=45.0,
        energy_kwh=0.9,
        energy_rate_kwh=7.80,
        fixed_overhead_per_unit=16.0,           # Expeller oil mill space & machinery depreciation
        packaging_freight_per_unit=6.50,        # 12-bottle partitioned corrugated shipper carton freight
        cost_breakdown_json={
            "description": "Cold expeller extraction without chemical solvent refining",
            "press_operators": 8,
            "filtration_technicians": 4,
            "bottling_crew": 4
        }
    ))

    # PRODUCT 4: Fortified Extruded Corn Flakes & Multigrain Cereal (500g Box)
    prod_cereal = Product(
        business_id=business.id,
        code="PRD-FOD-CRL-500",
        name="Fortified Organic Extruded Corn Flakes & Multigrain Cereal (500g)",
        sku="FOD-CRL-CRN-500G",
        category="Breakfast Cereals & Extruded Foods",
        selling_price=280.0,
        target_margin_percent=34.0,
        critical_margin_threshold=20.0,
        is_active=True
    )
    db.add(prod_cereal)
    db.flush()

    bom_cereal = BOM(business_id=business.id, product_id=prod_cereal.id, version="1.0", is_active=True, notes="Twin Screw Extrusion & Rotary Flaking Cereal")
    db.add(bom_cereal)
    db.flush()
    db.add(BOMItem(bom_id=bom_cereal.id, material_id=mat_map["MAT-GRAIN-MAIZE"].id, quantity=0.48, unit="kg", scrap_percent=3.0, process_stage="Twin Screw Continuous Extrusion"))

    # Production cost: 18 continuous extrusion & flaking crew @ ₹640/day across 1500 boxes/day => ₹7.68 direct labour/box
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_cereal.id,
        worker_count=18,
        wage_per_worker_daily=640.0,
        daily_output_units=1500.0,
        direct_labour_hours=0.10,
        labour_rate_hourly=80.0,
        processing_jobwork_cost_per_unit=12.0,  # Rotary gas toasting, flaking rolls & continuous drying
        inspection_qc_cost_per_unit=3.50,       # Vitamin assay, moisture content analyzer & crispness texture audit
        consumables_cost_per_unit=14.50,        # Metallized heat-sealed barrier pouch, printed duplex outer box
        boiler_steam_fuel_per_unit=4.50,        # Steam conditioning for grain grits prior to extrusion
        machine_hours=0.12,
        machine_rate_hourly=55.0,
        energy_kwh=1.4,
        energy_rate_kwh=7.80,
        fixed_overhead_per_unit=22.0,           # Extrusion plant depreciation & hygiene management
        packaging_freight_per_unit=5.50,        # Corrugated master shipper carton & palletized distribution
        cost_breakdown_json={
            "description": "Twin-screw extrusion and rotary toasting cereal line",
            "extrusion_operators": 6,
            "toasting_crew": 6,
            "packing_line": 6
        }
    ))

    # PRODUCT 5: Freeze-Dried Organic Fruit & Nut Trail Mix (200g Pouch)
    prod_trail = Product(
        business_id=business.id,
        code="PRD-FOD-TRL-200",
        name="Freeze-Dried Organic Fruit & Nut Energy Trail Mix (200g)",
        sku="FOD-SNK-TRL-200G",
        category="Health Snacks & Dry Fruits",
        selling_price=480.0,
        target_margin_percent=36.0,
        critical_margin_threshold=22.0,
        is_active=True
    )
    db.add(prod_trail)
    db.flush()

    bom_trail = BOM(business_id=business.id, product_id=prod_trail.id, version="1.0", is_active=True, notes="Vacuum Sublimation Freeze-Dried Fruits & Roasted Tree Nuts")
    db.add(bom_trail)
    db.flush()
    db.add(BOMItem(bom_id=bom_trail.id, material_id=mat_map["MAT-NUT-MIX"].id, quantity=0.14, unit="kg", scrap_percent=1.0, process_stage="Rotary Hot Air Roasting"))
    # Freeze dried mango chunks (0.6 kg fresh mango sublimates into 0.06 kg dry fruit)
    db.add(BOMItem(bom_id=bom_trail.id, material_id=mat_map["MAT-RAW-MANGO"].id, quantity=0.60, unit="kg", scrap_percent=3.0, process_stage="Blast Freezing (-40°C) & Vacuum Sublimation"))

    # Production cost: 22 vacuum freeze drying & packing crew @ ₹680/day across 600 pouches/day => ₹24.93 direct labour/pouch
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_trail.id,
        worker_count=22,
        wage_per_worker_daily=680.0,
        daily_output_units=600.0,
        direct_labour_hours=0.29,
        labour_rate_hourly=85.0,
        processing_jobwork_cost_per_unit=45.0,  # Industrial vacuum sublimation freeze-dryer cycle (24 hrs)
        inspection_qc_cost_per_unit=8.50,       # Water activity (aw < 0.20) moisture testing & X-ray foreign body audit
        consumables_cost_per_unit=16.0,         # Heavy aluminum-foil standup zipper pouch, nitrogen purge, oxygen absorber
        boiler_steam_fuel_per_unit=0.0,
        machine_hours=0.45,
        machine_rate_hourly=110.0,              # Vacuum freeze drying condenser refrigeration electricity
        energy_kwh=6.5,
        energy_rate_kwh=7.80,
        fixed_overhead_per_unit=55.0,           # High-vacuum chamber amortisation & clean packing room
        packaging_freight_per_unit=9.0,         # High-barrier desiccant shipper box
        cost_breakdown_json={
            "description": "High-vacuum sublimation freeze drying snack line",
            "vacuum_dryer_technicians": 10,
            "multihead_weigher_operators": 6,
            "qa_sanitation": 6,
            "vacuum_sublimation_power": 45.0
        }
    ))

    # 6. Customer Orders (Real National FMCG Brands & Retailers)
    orders_data = [
        {
            "order_number": "ORD-ITC-MNG",
            "customer": "ITC Limited Foods Division (Kitchens of India)",
            "product": prod_mango,
            "quantity": 3000.0,
            "agreed_price": 750.0,
            "lead_days": 21,
            "status": "APPROVED"
        },
        {
            "order_number": "ORD-TATA-DAL",
            "customer": "Tata Consumer Products Ltd. (Tata Sampann)",
            "product": prod_dal,
            "quantity": 10000.0,
            "agreed_price": 145.0,
            "lead_days": 18,
            "status": "APPROVED"
        },
        {
            "order_number": "ORD-DMART-OIL",
            "customer": "Avenue Supermarts Ltd. (DMart Private Label)",
            "product": prod_oil,
            "quantity": 5000.0,
            "agreed_price": 220.0,
            "lead_days": 14,
            "status": "PENDING"
        },
        {
            "order_number": "ORD-RELI-CRL",
            "customer": "Reliance Retail Smart Superstores",
            "product": prod_cereal,
            "quantity": 4000.0,
            "agreed_price": 280.0,
            "lead_days": 25,
            "status": "PENDING"
        },
        {
            "order_number": "ORD-HALD-TRL",
            "customer": "Haldiram Snacks Pvt. Ltd. (Export Division)",
            "product": prod_trail,
            "quantity": 2500.0,
            "agreed_price": 480.0,
            "lead_days": 30,
            "status": "PENDING"
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

    # 7. Food-Specific Market Events
    events_data = [
        {
            "title": "Unseasonal Hailstorms in Western Maharashtra Impact Alphonso Flowering by 22%",
            "source": "State Horticulture Directorate / APMC Mandi Bulletin",
            "summary": "Inclement weather and sudden hail in the Konkan belt damaged early fruit setting, resulting in mandi farm-gate mango auction price estimates increasing by 14% for the upcoming processing window.",
            "category": "COMMODITY_SURGE",
            "severity": "HIGH",
            "affected_materials": ["MAT-RAW-MANGO"],
            "days_ago": 3
        },
        {
            "title": "Edible Oil Import Duty Rationalization; Domestic Mustard Seed Crushing Margins Strengthen",
            "source": "Ministry of Consumer Affairs, Food & Public Distribution",
            "summary": "Customs tariff adjustments on crude palm oil imports have boosted domestic demand for cold-pressed mustard oil, driving wholesale oilseed mandi prices up by ₹1.80/kg across Alwar and Bharatpur trading centres.",
            "category": "POLICY_CHANGE",
            "severity": "MEDIUM",
            "affected_materials": ["MAT-SEED-MUSTARD"],
            "days_ago": 8
        }
    ]

    for ev in events_data:
        db.add(MarketEvent(
            source_name=ev["source"],
            source_url="https://agricoop.nic.in/reports",
            event_type=ev["category"],
            title=ev["title"],
            summary=ev["summary"],
            published_date=now - timedelta(days=ev["days_ago"]),
            severity=ev["severity"],
            affected_materials_json=ev["affected_materials"],
            affected_industries_json=["food_processing"],
            confidence_score=0.95,
            is_verified=True
        ))

    db.commit()
    return business
