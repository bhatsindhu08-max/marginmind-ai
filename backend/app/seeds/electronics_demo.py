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


def seed_electronics_demonstration(db: Session, business_id: Optional[int] = None) -> Business:
    """
    Seeds a complete, production-grade Electronics Assembly & SMT Manufacturing dataset.
    If business_id is provided, seeds PCBA products, BOMs, worker headcounts, wages,
    materials, and orders for that specific registered tenant.
    If business_id is None, seeds Sahasra Integrated Electronics as the demo enterprise.
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
        existing = db.query(Business).filter(Business.slug == "sahasra-integrated-electronics").first()
        if existing:
            return existing

        business = Business(
            name="Sahasra Integrated Electronics & SMT Technologies Ltd.",
            slug="sahasra-integrated-electronics",
            industry_type="electronics_assembly",
            currency="INR",
            location_hub="BENGALURU_ELECTRONIC_CITY",
            address="Plot 18, Electronics City Phase 1, Hosur Road, Bengaluru - 560100, Karnataka, India",
            settings_json={
                "default_target_margin": 32.0,
                "critical_margin_threshold": 18.0,
                "auto_evaluate_orders": True,
                "demo_mode": True
            }
        )
        db.add(business)
        db.flush()

        # Users for Sahasra Electronics demo
        users = [
            User(
                business_id=business.id,
                email="owner@sahasraelectronics.com",
                hashed_password=get_password_hash("password123"),
                full_name="Dr. Arvind Varma (Managing Director)",
                role="business_owner"
            ),
            User(
                business_id=business.id,
                email="finance@sahasraelectronics.com",
                hashed_password=get_password_hash("password123"),
                full_name="Kavita Ranganathan (Chief Financial Officer)",
                role="finance_manager"
            ),
            User(
                business_id=business.id,
                email="procurement@sahasraelectronics.com",
                hashed_password=get_password_hash("password123"),
                full_name="Girish Venkatesh (Head of Global Semiconductor Sourcing)",
                role="procurement_manager"
            ),
            User(
                business_id=business.id,
                email="production@sahasraelectronics.com",
                hashed_password=get_password_hash("password123"),
                full_name="Srinivas Murthy (SMT Plant & Cleanroom Director)",
                role="production_manager"
            )
        ]
        db.add_all(users)
        db.flush()

    # 3. Materials Specific to SMT & Electronics Assembly
    materials_data = [
        {
            "code": "MAT-PCB-FR4-6L",
            "name": "6-Layer High-TG FR4 Bare PCB (Gold ENIG finish)",
            "category": "Bare Printed Circuit Boards",
            "unit": "piece",
            "cost": 380.0,
            "market": 380.0,
            "stock": 2500.0,
            "index": "LME_COPPER",
            "multiplier": 0.040,
            "notes": "Multilayer bare PCB with controlled impedance; sensitive to global LME copper foil prices."
        },
        {
            "code": "MAT-MCU-ARM-M4",
            "name": "32-bit ARM Cortex-M4 Microcontroller IC (120 MHz, 512KB)",
            "category": "Active Semiconductors",
            "unit": "piece",
            "cost": 920.0,
            "market": 920.0,
            "stock": 4000.0,
            "index": "RBI_USDINR",
            "multiplier": 10.85,
            "notes": "High performance embedded controller; 100% imported in USD currency."
        },
        {
            "code": "MAT-PWR-IGBT-MOD",
            "name": "1200V / 50A Trench-Stop IGBT Power Module",
            "category": "Power Semiconductors",
            "unit": "piece",
            "cost": 1650.0,
            "market": 1650.0,
            "stock": 1200.0,
            "index": "RBI_USDINR",
            "multiplier": 19.50,
            "notes": "Heavy industrial motor drive module; USD currency and global silicon lead-time sensitive."
        },
        {
            "code": "MAT-SLD-SAC305",
            "name": "Lead-Free Solder Paste (Sn96.5 / Ag3.0 / Cu0.5 SAC305 Type 4)",
            "category": "Solder & Chemical Consumables",
            "unit": "kg",
            "cost": 6400.0,
            "market": 6400.0,
            "stock": 180.0,
            "index": "LME_COPPER",
            "multiplier": 0.68,
            "notes": "Premium silver-alloy no-clean solder paste for automated SMT stencil printing."
        },
        {
            "code": "MAT-MOD-LTE-GNSS",
            "name": "4G Cat-1 Cellular + GNSS Telematics Module (AEC-Q)",
            "category": "Wireless Modules",
            "unit": "piece",
            "cost": 1150.0,
            "market": 1150.0,
            "stock": 1500.0,
            "index": "RBI_USDINR",
            "multiplier": 13.60,
            "notes": "Automotive qualified communication chipset with integrated GPS receiver."
        },
        {
            "code": "MAT-PCB-FR4-4L",
            "name": "4-Layer Heavy Copper FR4 Bare PCB (2oz Copper)",
            "category": "Bare Printed Circuit Boards",
            "unit": "piece",
            "cost": 290.0,
            "market": 290.0,
            "stock": 3200.0,
            "index": "LME_COPPER",
            "multiplier": 0.032,
            "notes": "Heavy copper board for power supply and high-current traces."
        },
        {
            "code": "MAT-PASS-REEL-KIT",
            "name": "SMD Passive Kit (0402/0603 MLCC Capacitors & Resistors Reel)",
            "category": "Passive Components",
            "unit": "set",
            "cost": 185.0,
            "market": 185.0,
            "stock": 5000.0,
            "index": "RBI_USDINR",
            "multiplier": 2.18,
            "notes": "Automated tape and reel passives for high speed Pick-and-Place."
        },
        {
            "code": "MAT-ENC-ALU-HS",
            "name": "Extruded Aluminium Heatsink & Die-Cast Shielded Chassis",
            "category": "Mechanical Hardware & Enclosures",
            "unit": "piece",
            "cost": 340.0,
            "market": 340.0,
            "stock": 1800.0,
            "index": "LME_ALU",
            "multiplier": 0.125,
            "notes": "Anodized structural cooling chassis for power electronics."
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
            min_safety_stock=200.0,
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
            freight_basis=4.5,
            notes=md["notes"]
        ))

        # Initial Inventory
        db.add(Inventory(
            business_id=business.id,
            material_id=mat.id,
            current_stock=md["stock"],
            unit=md["unit"],
            weighted_average_cost=md["cost"],
            reorder_level=500.0,
            safety_stock=200.0
        ))

    # 4. Suppliers & Quotations
    suppliers_data = [
        {"code": "SUP-ARROW-ASIA", "name": "Arrow Electronics India Distribution Ltd.", "email": "semiconductor.orders@arrow.com", "lead": 14, "rating": "LOW", "score": 0.98, "terms": "Net 30"},
        {"code": "SUP-AT&S-PCB", "name": "AT&S Circuit Technologies India Pvt. Ltd.", "email": "oem.pcb@ats.net", "lead": 12, "rating": "LOW", "score": 0.97, "terms": "Net 45"},
        {"code": "SUP-INDI-SOLDER", "name": "Indium Corporation SMT Chemical Materials", "email": "sales@indiumcorp.in", "lead": 7, "rating": "LOW", "score": 0.96, "terms": "Net 30"},
        {"code": "SUP-QUECTEL-IND", "name": "Quectel Wireless Telematics Consortium", "email": "india.support@quectel.com", "lead": 10, "rating": "MEDIUM", "score": 0.94, "terms": "Net 30"}
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
        supplier_id=supp_map["SUP-AT&S-PCB"].id,
        material_id=mat_map["MAT-PCB-FR4-6L"].id,
        quotation_ref="QT-ATS-2026-770",
        quote_price=380.0,
        currency="INR",
        min_order_qty=500.0,
        valid_from=now - timedelta(days=60),
        valid_to=now + timedelta(days=30),
        is_active=True
    ))
    db.add(SupplierQuotation(
        business_id=business.id,
        supplier_id=supp_map["SUP-ARROW-ASIA"].id,
        material_id=mat_map["MAT-MCU-ARM-M4"].id,
        quotation_ref="QT-ARR-2026-904",
        quote_price=920.0,
        currency="INR",
        min_order_qty=1000.0,
        valid_from=now - timedelta(days=45),
        valid_to=now + timedelta(days=25),
        is_active=True
    ))

    # 5. Products, BOMs and Production Costs (WITH Workers, Daily Wages, Jobwork & Testing)

    # PRODUCT 1: IoT Smart Energy Grid Gateway PCBA
    prod_iot = Product(
        business_id=business.id,
        code="PRD-ELC-IOT-GW",
        name="IoT Smart Energy Grid Gateway PCBA (4G + RS485)",
        sku="ELC-IOT-GW-4G",
        category="Industrial Telemetry & Smart Grid",
        selling_price=3850.0,
        target_margin_percent=32.0,
        critical_margin_threshold=18.0,
        is_active=True
    )
    db.add(prod_iot)
    db.flush()

    bom_iot = BOM(business_id=business.id, product_id=prod_iot.id, version="1.0", is_active=True, notes="Smart Grid Metering Substation Gateway PCBA")
    db.add(bom_iot)
    db.flush()
    db.add(BOMItem(bom_id=bom_iot.id, material_id=mat_map["MAT-PCB-FR4-6L"].id, quantity=1.0, unit="piece", scrap_percent=1.5, process_stage="SMT Surface Mount Loading"))
    db.add(BOMItem(bom_id=bom_iot.id, material_id=mat_map["MAT-MCU-ARM-M4"].id, quantity=1.0, unit="piece", scrap_percent=0.5, process_stage="High-Speed Chip Shooter"))
    db.add(BOMItem(bom_id=bom_iot.id, material_id=mat_map["MAT-MOD-LTE-GNSS"].id, quantity=1.0, unit="piece", scrap_percent=0.5, process_stage="Fine-Pitch Multi-Feeder"))
    db.add(BOMItem(bom_id=bom_iot.id, material_id=mat_map["MAT-SLD-SAC305"].id, quantity=0.015, unit="kg", scrap_percent=2.0, process_stage="Automatic Solder Paste Screen Printing"))
    db.add(BOMItem(bom_id=bom_iot.id, material_id=mat_map["MAT-PASS-REEL-KIT"].id, quantity=1.0, unit="set", scrap_percent=1.0, process_stage="Dual Gantry Pick-and-Place"))

    # Production cost: 16 cleanroom SMT line operators & tech crew @ ₹820/day across 300 units/day => ₹43.73 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_iot.id,
        worker_count=16,
        wage_per_worker_daily=820.0,
        daily_output_units=300.0,
        direct_labour_hours=0.42,
        labour_rate_hourly=104.12,
        processing_jobwork_cost_per_unit=45.0,  # Nitrogen reflow soldering + 3D Automated Optical Inspection (AOI)
        inspection_qc_cost_per_unit=35.0,      # Flying probe & In-Circuit Testing (ICT) bed of nails
        consumables_cost_per_unit=28.0,        # Silicone moisture-barrier conformal coating spray
        boiler_steam_fuel_per_unit=0.0,
        machine_hours=0.35,
        machine_rate_hourly=220.0,              # High-speed Yamaha/ASM SMT pick-and-place line hour
        energy_kwh=4.5,
        energy_rate_kwh=8.20,
        fixed_overhead_per_unit=110.0,          # Class 100,000 cleanroom HVAC & ESD flooring overhead
        packaging_freight_per_unit=22.0,        # Antistatic ESD shielded bubble bag & conductively coated carton
        cost_breakdown_json={
            "description": "High-speed SMT assembly with nitrogen reflow & AOI",
            "smt_operators": 8,
            "test_technicians": 5,
            "cleanroom_helpers": 3,
            "aoi_inspection_cost": 25.0,
            "nitrogen_consumption": 20.0
        }
    ))

    # PRODUCT 2: Industrial Dual-Axis AC Servo Motor Drive Controller
    prod_servo = Product(
        business_id=business.id,
        code="PRD-ELC-SRV-DRV",
        name="Industrial Dual-Axis AC Servo Motor Drive Controller (400V / 25A)",
        sku="ELC-SRV-400V-25A",
        category="Motion Control & Factory Automation",
        selling_price=8500.0,
        target_margin_percent=35.0,
        critical_margin_threshold=20.0,
        is_active=True
    )
    db.add(prod_servo)
    db.flush()

    bom_servo = BOM(business_id=business.id, product_id=prod_servo.id, version="1.0", is_active=True, notes="Heavy Power Electronics Inverter & Motion Drive")
    db.add(bom_servo)
    db.flush()
    db.add(BOMItem(bom_id=bom_servo.id, material_id=mat_map["MAT-PCB-FR4-4L"].id, quantity=1.0, unit="piece", scrap_percent=1.0, process_stage="Heavy Copper SMT Layer"))
    db.add(BOMItem(bom_id=bom_servo.id, material_id=mat_map["MAT-PWR-IGBT-MOD"].id, quantity=1.0, unit="piece", scrap_percent=0.2, process_stage="Selective Soldering & Thermal Pad Mounting"))
    db.add(BOMItem(bom_id=bom_servo.id, material_id=mat_map["MAT-MCU-ARM-M4"].id, quantity=1.0, unit="piece", scrap_percent=0.5, process_stage="Digital DSP Control Card SMT"))
    db.add(BOMItem(bom_id=bom_servo.id, material_id=mat_map["MAT-ENC-ALU-HS"].id, quantity=1.0, unit="piece", scrap_percent=0.0, process_stage="Anodized Heatsink Enclosure Integration"))
    db.add(BOMItem(bom_id=bom_servo.id, material_id=mat_map["MAT-SLD-SAC305"].id, quantity=0.035, unit="kg", scrap_percent=2.0, process_stage="Selective Wave Solder Pot"))

    # Production cost: 24 assembly & testing technicians @ ₹880/day across 150 units/day => ₹140.80 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_servo.id,
        worker_count=24,
        wage_per_worker_daily=880.0,
        daily_output_units=150.0,
        direct_labour_hours=1.28,
        labour_rate_hourly=110.0,
        processing_jobwork_cost_per_unit=95.0,  # Selective wave soldering & automated torque-controlled heatsink mounting
        inspection_qc_cost_per_unit=65.0,       # High-voltage dielectric flash testing & full-load dynamometer run
        consumables_cost_per_unit=75.0,         # High-thermal conductivity phase change TIM & heavy brass terminal lugs
        boiler_steam_fuel_per_unit=0.0,
        machine_hours=0.8,
        machine_rate_hourly=280.0,
        energy_kwh=12.0,
        energy_rate_kwh=8.20,
        fixed_overhead_per_unit=240.0,          # High-voltage safety lab, power analyzer amortisation & cleanroom
        packaging_freight_per_unit=55.0,        # Foam-in-place molded polyurethane & heavy duty export carton
        cost_breakdown_json={
            "description": "High-voltage industrial power drive fabrication",
            "power_assembly_crew": 12,
            "burnin_technicians": 8,
            "packaging_crew": 4,
            "dielectric_flash_qc": 65.0
        }
    ))

    # PRODUCT 3: Automotive Telematics Control Unit (AIS-140 GPS Tracker)
    prod_tcu = Product(
        business_id=business.id,
        code="PRD-ELC-TCU-140",
        name="Automotive Telematics Control Unit (AIS-140 Certified GPS Tracker)",
        sku="ELC-TCU-AIS140-CV",
        category="Automotive Electronics & Telematics",
        selling_price=4200.0,
        target_margin_percent=28.0,
        critical_margin_threshold=17.0,
        is_active=True
    )
    db.add(prod_tcu)
    db.flush()

    bom_tcu = BOM(business_id=business.id, product_id=prod_tcu.id, version="1.0", is_active=True, notes="Automotive Fleet Security & GNSS Tracker PCBA")
    db.add(bom_tcu)
    db.flush()
    db.add(BOMItem(bom_id=bom_tcu.id, material_id=mat_map["MAT-PCB-FR4-4L"].id, quantity=1.0, unit="piece", scrap_percent=1.0, process_stage="Automotive SMT Placement"))
    db.add(BOMItem(bom_id=bom_tcu.id, material_id=mat_map["MAT-MOD-LTE-GNSS"].id, quantity=1.0, unit="piece", scrap_percent=0.5, process_stage="Cellular Module Soldering"))
    db.add(BOMItem(bom_id=bom_tcu.id, material_id=mat_map["MAT-PASS-REEL-KIT"].id, quantity=1.0, unit="set", scrap_percent=1.0, process_stage="High Density Passive Array"))
    db.add(BOMItem(bom_id=bom_tcu.id, material_id=mat_map["MAT-SLD-SAC305"].id, quantity=0.012, unit="kg", scrap_percent=2.0, process_stage="Reflow Stencil Printing"))

    # Production cost: 18 SMT & wire crimp crew @ ₹800/day across 250 units/day => ₹57.60 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_tcu.id,
        worker_count=18,
        wage_per_worker_daily=800.0,
        daily_output_units=250.0,
        direct_labour_hours=0.55,
        labour_rate_hourly=104.72,
        processing_jobwork_cost_per_unit=38.0,  # Ultrasonic automotive enclosure welding & hermetic seal test
        inspection_qc_cost_per_unit=42.0,       # GSM/GNSS RF spectrum analyzer calibration & eSIM provisioning
        consumables_cost_per_unit=52.0,         # Tamper-evident polyurethane potting resin & automotive wire harness
        boiler_steam_fuel_per_unit=0.0,
        machine_hours=0.45,
        machine_rate_hourly=240.0,
        energy_kwh=3.5,
        energy_rate_kwh=8.20,
        fixed_overhead_per_unit=120.0,          # Automotive IATF-16949 compliance lab overhead
        packaging_freight_per_unit=20.0,        # Anti-static thermoformed blister pack & barcoded shipper
        cost_breakdown_json={
            "description": "Automotive electronics certified line",
            "rf_testing_calibration": 42.0,
            "polyurethane_potting": 52.0
        }
    ))

    # PRODUCT 4: Medical ICU Multi-Parameter Patient Monitor Mainboard
    prod_med = Product(
        business_id=business.id,
        code="PRD-ELC-MED-MON",
        name="Medical ICU Multi-Parameter Patient Monitor Mainboard (Class 3)",
        sku="ELC-MED-ICU-M01",
        category="Medical Devices & Healthcare Electronics",
        selling_price=14500.0,
        target_margin_percent=40.0,
        critical_margin_threshold=25.0,
        is_active=True
    )
    db.add(prod_med)
    db.flush()

    bom_med = BOM(business_id=business.id, product_id=prod_med.id, version="1.0", is_active=True, notes="ISO 13485 Certified Medical Grade Computing & ECG Acquisition Board")
    db.add(bom_med)
    db.flush()
    db.add(BOMItem(bom_id=bom_med.id, material_id=mat_map["MAT-PCB-FR4-6L"].id, quantity=1.0, unit="piece", scrap_percent=0.5, process_stage="Medical Grade ENIG PCB SMT"))
    db.add(BOMItem(bom_id=bom_med.id, material_id=mat_map["MAT-MCU-ARM-M4"].id, quantity=2.0, unit="piece", scrap_percent=0.2, process_stage="Dual Redundant Processor Mounting"))
    db.add(BOMItem(bom_id=bom_med.id, material_id=mat_map["MAT-PASS-REEL-KIT"].id, quantity=2.0, unit="set", scrap_percent=0.5, process_stage="High Precision Low-Noise Analog Passives"))
    db.add(BOMItem(bom_id=bom_med.id, material_id=mat_map["MAT-SLD-SAC305"].id, quantity=0.025, unit="kg", scrap_percent=1.0, process_stage="Nitrogen Cleanroom Reflow"))

    # Production cost: 20 IPC-A-610 certified cleanroom specialists @ ₹950/day across 80 units/day => ₹237.50 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_med.id,
        worker_count=20,
        wage_per_worker_daily=950.0,
        daily_output_units=80.0,
        direct_labour_hours=2.0,
        labour_rate_hourly=118.75,
        processing_jobwork_cost_per_unit=180.0, # 100% 3D X-Ray Computed Tomography BGA void analysis
        inspection_qc_cost_per_unit=220.0,      # 48-hour thermal chamber burn-in cycling (-20°C to +70°C) & patient leakage test
        consumables_cost_per_unit=90.0,         # IPC-CC-830 certified moisture conformal silicone coating & gold headers
        boiler_steam_fuel_per_unit=0.0,
        machine_hours=1.1,
        machine_rate_hourly=320.0,
        energy_kwh=14.0,
        energy_rate_kwh=8.20,
        fixed_overhead_per_unit=450.0,          # ISO 13485 cleanroom validation, calibration & regulatory compliance
        packaging_freight_per_unit=65.0,        # Medical grade sterile barrier double-sealed packaging
        cost_breakdown_json={
            "description": "High-reliability Class 3 medical device manufacturing",
            "xray_bga_inspection": 180.0,
            "environmental_burnin_test": 220.0,
            "ipc_specialists": 20
        }
    ))

    # PRODUCT 5: 1200W Titanium High-Efficiency Server Power Supply PCBA
    prod_psu = Product(
        business_id=business.id,
        code="PRD-ELC-SRV-PSU",
        name="1200W Titanium High-Efficiency Server Power Supply PCBA",
        sku="ELC-PSU-1200W-TIT",
        category="Data Center & Cloud Computing Hardware",
        selling_price=9800.0,
        target_margin_percent=30.0,
        critical_margin_threshold=18.0,
        is_active=True
    )
    db.add(prod_psu)
    db.flush()

    bom_psu = BOM(business_id=business.id, product_id=prod_psu.id, version="1.0", is_active=True, notes="80-Plus Titanium Server Switched-Mode Power Supply")
    db.add(bom_psu)
    db.flush()
    db.add(BOMItem(bom_id=bom_psu.id, material_id=mat_map["MAT-PCB-FR4-4L"].id, quantity=1.0, unit="piece", scrap_percent=1.0, process_stage="Heavy Copper Power Traces"))
    db.add(BOMItem(bom_id=bom_psu.id, material_id=mat_map["MAT-PWR-IGBT-MOD"].id, quantity=1.0, unit="piece", scrap_percent=0.2, process_stage="GaN / Trench Power Inverter Stage"))
    db.add(BOMItem(bom_id=bom_psu.id, material_id=mat_map["MAT-ENC-ALU-HS"].id, quantity=1.0, unit="piece", scrap_percent=0.0, process_stage="Extruded Thermal Heatsink Casing"))
    db.add(BOMItem(bom_id=bom_psu.id, material_id=mat_map["MAT-SLD-SAC305"].id, quantity=0.030, unit="kg", scrap_percent=1.5, process_stage="Automated Selective Soldering"))

    # Production cost: 22 power electronics crew @ ₹860/day across 140 units/day => ₹135.14 direct labour/pc
    db.add(ProductionCost(
        business_id=business.id,
        product_id=prod_psu.id,
        worker_count=22,
        wage_per_worker_daily=860.0,
        daily_output_units=140.0,
        direct_labour_hours=1.25,
        labour_rate_hourly=108.11,
        processing_jobwork_cost_per_unit=110.0, # Chroma Automated Power Analyzer 96% efficiency verification test
        inspection_qc_cost_per_unit=85.0,       # High-pot 3kV electrical safety insulation & thermal imaging
        consumables_cost_per_unit=145.0,        # High-voltage potting silicone, planar transformer & output gold terminal busbars
        boiler_steam_fuel_per_unit=0.0,
        machine_hours=0.9,
        machine_rate_hourly=260.0,
        energy_kwh=10.5,
        energy_rate_kwh=8.20,
        fixed_overhead_per_unit=260.0,          # Clean energy engineering & burn-in rack power absorption
        packaging_freight_per_unit=45.0,        # Anti-static molded EPE cushion & export carton
        cost_breakdown_json={
            "description": "High-efficiency data center server hardware line",
            "chroma_power_test": 110.0,
            "silicone_potting": 145.0
        }
    ))

    # 6. Customer Orders (Real Tier-1 Electronics OEMs)
    orders_data = [
        {
            "order_number": "ORD-SCHN-801",
            "customer": "Schneider Electric India Pvt. Ltd.",
            "product": prod_iot,
            "quantity": 1500.0,
            "agreed_price": 3850.0,
            "lead_days": 25,
            "status": "APPROVED"
        },
        {
            "order_number": "ORD-ABB-420",
            "customer": "ABB India Industrial Drives Division",
            "product": prod_servo,
            "quantity": 600.0,
            "agreed_price": 8500.0,
            "lead_days": 30,
            "status": "APPROVED"
        },
        {
            "order_number": "ORD-TATA-TCU",
            "customer": "Tata Motors Commercial Vehicles Fleet Solutions",
            "product": prod_tcu,
            "quantity": 2000.0,
            "agreed_price": 4200.0,
            "lead_days": 21,
            "status": "PENDING"
        },
        {
            "order_number": "ORD-BEL-MED",
            "customer": "Bharat Electronics Ltd (BEL) Healthcare Division",
            "product": prod_med,
            "quantity": 300.0,
            "agreed_price": 14500.0,
            "lead_days": 40,
            "status": "PENDING"
        },
        {
            "order_number": "ORD-DELTA-PSU",
            "customer": "Delta Power Electronics India Pvt. Ltd.",
            "product": prod_psu,
            "quantity": 800.0,
            "agreed_price": 9800.0,
            "lead_days": 28,
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
            order_date=now - timedelta(days=4),
            promised_delivery_date=now + timedelta(days=od["lead_days"]),
            status=od["status"],
            margin_guard_status="ATTRACTIVE" if od["status"] == "APPROVED" else "NOT_EVALUATED"
        ))

    # 7. Electronics-Specific Market Events
    events_data = [
        {
            "title": "LME Copper Prices Surge 6.2% on Smelter Curtailments and AI Data Center Demand",
            "source": "London Metal Exchange (LME) Market Intelligence",
            "summary": "Benchmark LME copper cash settlement jumped to $9,450/MT, impacting bare multilayer PCB laminate and magnet wire pricing across Tier-1 electronics manufacturers.",
            "category": "COMMODITY_SURGE",
            "severity": "HIGH",
            "affected_materials": ["MAT-PCB-FR4-6L", "MAT-PCB-FR4-4L", "MAT-SLD-SAC305"],
            "days_ago": 2
        },
        {
            "title": "US Dollar Hits 84.85 against Indian Rupee; Imported IC & Microcontroller Bills Rise",
            "source": "Reserve Bank of India (RBI) Foreign Exchange Bulletin",
            "summary": "Dollar appreciation has raised landed import costs for active semiconductor microcontrollers, power IGBT modules, and automotive wireless modems by 2.4% over the past fortnight.",
            "category": "CURRENCY_SHIFT",
            "severity": "MEDIUM",
            "affected_materials": ["MAT-MCU-ARM-M4", "MAT-PWR-IGBT-MOD", "MAT-MOD-LTE-GNSS"],
            "days_ago": 6
        }
    ]

    for ev in events_data:
        db.add(MarketEvent(
            source_name=ev["source"],
            source_url="https://rbi.org.in/scripts/BS_PressReleaseDisplay.aspx",
            event_type=ev["category"],
            title=ev["title"],
            summary=ev["summary"],
            published_date=now - timedelta(days=ev["days_ago"]),
            severity=ev["severity"],
            affected_materials_json=ev["affected_materials"],
            affected_industries_json=["electronics_assembly"],
            confidence_score=0.96,
            is_verified=True
        ))

    db.commit()
    return business
