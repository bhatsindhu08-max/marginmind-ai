from typing import Dict, Any, List

INDUSTRY_TEMPLATES: Dict[str, Dict[str, Any]] = {
    "metal_steel": {
        "id": "metal_steel",
        "name": "Metal & Steel Manufacturing",
        "description": "Precision fabrication, forging, stamping, casting and CNC machining of ferrous and non-ferrous components.",
        "material_categories": [
            "Hot Rolled Carbon Steel",
            "Cold Rolled Sheet Metal",
            "Stainless Steel (SS-304/SS-316)",
            "Aluminium Alloys (6061-T6, 7075)",
            "Copper & Brass Alloys",
            "Welding Wire & Gas",
            "Surface Treatment & Coatings"
        ],
        "default_units": ["kg", "metric_ton", "sheet", "metre", "piece"],
        "cost_drivers": [
            {"id": "direct_labour_machinist", "name": "Skilled Machinist Labour", "unit": "INR/hour", "default_rate": 350.0},
            {"id": "power_induction_furnace", "name": "Electrical Power / Induction", "unit": "INR/kWh", "default_rate": 8.5},
            {"id": "cnc_overhead", "name": "CNC Machine Hour Overhead", "unit": "INR/hour", "default_rate": 750.0},
            {"id": "tooling_wear", "name": "Tooling Wear & Consumables", "unit": "% of material cost", "default_rate": 4.5},
            {"id": "heat_treatment", "name": "Heat Treatment & Hardening", "unit": "INR/kg", "default_rate": 45.0},
            {"id": "scrap_factor", "name": "Process Scrap Allowance", "unit": "% scrap", "default_rate": 6.0}
        ],
        "relevant_indicators": [
            {"code": "LME_ALU", "name": "LME Aluminium Cash Settled", "category": "Commodity", "unit": "USD/MT", "source": "London Metal Exchange"},
            {"code": "WPI_STEEL", "name": "WPI - Manufacture of Basic Metals (Steel)", "category": "Macro", "unit": "Index 2011-12=100", "source": "Office of Economic Adviser, India"},
            {"code": "WB_IRON_ORE", "name": "World Bank Iron Ore (CFR China)", "category": "Commodity", "unit": "USD/dmt", "source": "World Bank Pink Sheet"},
            {"code": "RBI_USDINR", "name": "RBI Reference Exchange Rate USD/INR", "category": "Currency", "unit": "INR per USD", "source": "Reserve Bank of India"},
            {"code": "STEEL_IMPORT_DUTY", "name": "Basic Customs Duty on Primary Steel", "category": "Policy", "unit": "% tariff", "source": "Ministry of Finance, India"},
            {"code": "DOMESTIC_HRC_PUNE", "name": "Domestic Hot Rolled Coil (HRC Ex-Stock)", "category": "Domestic Benchmark", "unit": "INR/kg", "source": "Joint Plant Committee"}
        ],
        "supplier_relationships": [
            {"type": "Primary Mills", "payment_terms": "Advance / 30-day LC", "typical_lead_days": 45, "contract_type": "Quarterly Index-Linked"},
            {"type": "Regional Stockists / Service Centres", "payment_terms": "Net 30 / Net 60", "typical_lead_days": 7, "contract_type": "Spot / 15-day quote"},
            {"type": "Import Traders", "payment_terms": "Irrevocable LC 90 days", "typical_lead_days": 60, "contract_type": "CIF Mundra/Nhava Sheva"}
        ],
        "default_target_margin": 24.0,
        "critical_margin_threshold": 16.0,
        "sample_products": [
            {
                "name": "Heavy Industrial Flange (DN200 Class 150)",
                "sku": "HIF-DN200-S01",
                "selling_price": 4200.0,
                "target_margin": 25.0,
                "materials": [
                    {"name": "Hot Rolled Carbon Steel (IS 2062)", "quantity": 12.0, "unit": "kg", "unit_cost": 68.0, "index_link": "WPI_STEEL"},
                    {"name": "Welding Wire & Gas Consumables", "quantity": 0.8, "unit": "kg", "unit_cost": 210.0, "index_link": "WPI_STEEL"}
                ],
                "production": {"labour_hours": 1.5, "machine_hours": 1.2, "energy_kwh": 18.0}
            },
            {
                "name": "Precision Lightweight Aviation Bracket",
                "sku": "LAB-6061-T6",
                "selling_price": 5800.0,
                "target_margin": 32.0,
                "materials": [
                    {"name": "Aluminium Alloy Billet (6061-T6)", "quantity": 4.5, "unit": "kg", "unit_cost": 295.0, "index_link": "LME_ALU"},
                    {"name": "Stainless Steel Fastener Pin (SS-304)", "quantity": 0.4, "unit": "kg", "unit_cost": 340.0, "index_link": "WPI_STEEL"}
                ],
                "production": {"labour_hours": 2.2, "machine_hours": 2.0, "energy_kwh": 24.0}
            },
            {
                "name": "Automotive Transmission Housing",
                "sku": "ATH-ALU-902",
                "selling_price": 9500.0,
                "target_margin": 28.0,
                "materials": [
                    {"name": "Cast Aluminium Ingot (A380)", "quantity": 8.0, "unit": "kg", "unit_cost": 260.0, "index_link": "LME_ALU"},
                    {"name": "Steel Bushing Insert (Hardened)", "quantity": 1.5, "unit": "kg", "unit_cost": 180.0, "index_link": "WPI_STEEL"}
                ],
                "production": {"labour_hours": 3.0, "machine_hours": 2.8, "energy_kwh": 42.0}
            }
        ]
    },
    "textile_garment": {
        "id": "textile_garment",
        "name": "Textile & Garment Manufacturing",
        "description": "Yarn spinning, fabric weaving, dying and high-volume apparel cutting and sewing.",
        "material_categories": [
            "Raw Combed Cotton Yarn",
            "Polyester Filament Yarn",
            "Synthetic Dyes & Chemicals",
            "Buttons, Zippers & Trims",
            "Packing Cartons & Polybags"
        ],
        "default_units": ["kg", "metre", "yard", "cone", "dozen", "piece"],
        "cost_drivers": [
            {"id": "sewing_operator_labour", "name": "Sewing Operator Labour", "unit": "INR/hour", "default_rate": 180.0},
            {"id": "boiler_steam_fuel", "name": "Boiler Steam / Biomass Fuel", "unit": "INR/tonne steam", "default_rate": 2200.0},
            {"id": "finishing_overhead", "name": "Finishing & Ironing Overhead", "unit": "INR/piece", "default_rate": 18.0},
            {"id": "cutting_waste", "name": "Fabric Cut Waste Allowance", "unit": "% loss", "default_rate": 8.0}
        ],
        "relevant_indicators": [
            {"code": "COTTON_CANDY", "name": "MCX Cotton Candy 29mm", "category": "Commodity", "unit": "INR/bale", "source": "MCX India"},
            {"code": "WB_COTTON_A_INDEX", "name": "World Bank Cotton A-Index", "category": "Commodity", "unit": "USD/kg", "source": "World Bank Pink Sheet"},
            {"code": "BRENT_CRUDE", "name": "Brent Crude Oil (Polyester feedstock benchmark)", "category": "Energy", "unit": "USD/barrel", "source": "ICE / World Bank"},
            {"code": "RBI_EURINR", "name": "RBI Exchange Rate EUR/INR (Apparel Export)", "category": "Currency", "unit": "INR per EUR", "source": "Reserve Bank of India"}
        ],
        "supplier_relationships": [
            {"type": "Spinning Mills (Coimbatore / Gujarat)", "payment_terms": "Letter of Credit / Net 15", "typical_lead_days": 20, "contract_type": "Spot / 30-day hedge"},
            {"type": "Dye & Chemical Importers", "payment_terms": "Net 45", "typical_lead_days": 14, "contract_type": "Monthly Fixed Rate"}
        ],
        "default_target_margin": 22.0,
        "critical_margin_threshold": 14.0,
        "sample_products": [
            {
                "name": "Men's Premium Organic Cotton Oxford Shirt",
                "sku": "OXF-SHT-W01",
                "selling_price": 1450.0,
                "target_margin": 26.0,
                "materials": [
                    {"name": "Combed Cotton Fabric (80s 2-ply)", "quantity": 1.8, "unit": "metre", "unit_cost": 220.0, "index_link": "COTTON_CANDY"},
                    {"name": "Mother of Pearl Buttons & Interlining", "quantity": 1.0, "unit": "set", "unit_cost": 85.0, "index_link": "BRENT_CRUDE"}
                ],
                "production": {"labour_hours": 1.2, "machine_hours": 0.4, "energy_kwh": 3.5}
            }
        ]
    },
    "electronics_assembly": {
        "id": "electronics_assembly",
        "name": "Electronics Assembly & SMT",
        "description": "Surface-Mount Technology (SMT), PCBA population, wire-harnessing and device box-build.",
        "material_categories": [
            "Multilayer FR-4 PCB Bare Boards",
            "Microcontrollers & SoCs",
            "Passive SMD Components (Resistors/Caps)",
            "Lead-Free Solder Paste (SAC305)",
            "ABS Injection Molded Enclosures",
            "Silicon Connectors & Wiring"
        ],
        "default_units": ["piece", "reel", "kg", "tray", "tube"],
        "cost_drivers": [
            {"id": "smt_line_overhead", "name": "SMT Pick & Place Line Hour", "unit": "INR/hour", "default_rate": 1800.0},
            {"id": "test_engineer_labour", "name": "AOI & Functional Test Labour", "unit": "INR/hour", "default_rate": 420.0},
            {"id": "nitrogen_atmosphere", "name": "Nitrogen Reflow Gas", "unit": "INR/hour", "default_rate": 350.0},
            {"id": "rework_defect_rate", "name": "Component Placement Defect Scrap", "unit": "% loss", "default_rate": 2.5}
        ],
        "relevant_indicators": [
            {"code": "LME_COPPER", "name": "LME Copper Grade A (PCB Trace Benchmark)", "category": "Commodity", "unit": "USD/MT", "source": "London Metal Exchange"},
            {"code": "SEMI_LEAD_TIME", "name": "Semiconductor Global Average Lead Time", "category": "Supply Signal", "unit": "Weeks", "source": "Susquehanna / Global Foundries"},
            {"code": "RBI_USDINR", "name": "RBI USD/INR Rate (Component Import Basis)", "category": "Currency", "unit": "INR per USD", "source": "Reserve Bank of India"},
            {"code": "WPI_ELECTRONIC", "name": "WPI - Electronic Components & Equipment", "category": "Macro", "unit": "Index 2011-12=100", "source": "Office of Economic Adviser, India"}
        ],
        "supplier_relationships": [
            {"type": "Authorized Global IC Distributors (Arrow / DigiKey)", "payment_terms": "Net 30 / Advance", "typical_lead_days": 84, "contract_type": "Annual Volume Agreement"},
            {"type": "Domestic Bare PCB Fabricators", "payment_terms": "Net 30", "typical_lead_days": 18, "contract_type": "Per-lot quote"}
        ],
        "default_target_margin": 30.0,
        "critical_margin_threshold": 18.0,
        "sample_products": [
            {
                "name": "Industrial IoT Telemetry Controller",
                "sku": "IOT-CTRL-4G",
                "selling_price": 6200.0,
                "target_margin": 35.0,
                "materials": [
                    {"name": "6-Layer FR4 Bare PCB (Impedance Controlled)", "quantity": 1.0, "unit": "piece", "unit_cost": 420.0, "index_link": "LME_COPPER"},
                    {"name": "ARM Cortex-M4 MCU & 4G Modem Module", "quantity": 1.0, "unit": "piece", "unit_cost": 1850.0, "index_link": "RBI_USDINR"},
                    {"name": "ABS Fire-Retardant Enclosure", "quantity": 1.0, "unit": "piece", "unit_cost": 310.0, "index_link": "BRENT_CRUDE"}
                ],
                "production": {"labour_hours": 0.8, "machine_hours": 0.5, "energy_kwh": 5.0}
            }
        ]
    },
    "food_processing": {
        "id": "food_processing",
        "name": "Food Processing & Packaging",
        "description": "Edible oil refining, grain milling, thermal processing, bottling and cold-chain packaging.",
        "material_categories": [
            "Raw Agricultural Produce (Wheat, Grains, Seeds)",
            "Refined Palm Oil & Vegetable Oils",
            "Preservatives, Seasonings & Spices",
            "Multi-Layer Barrier Pouches & Film",
            "Corrugated Shipping Cartons"
        ],
        "default_units": ["kg", "litre", "quintal", "metric_ton", "pouch", "tin"],
        "cost_drivers": [
            {"id": "thermal_boiler_energy", "name": "Boiler Steam & Natural Gas", "unit": "INR/MMBtu", "default_rate": 850.0},
            {"id": "cold_storage_power", "name": "Refrigeration Cold Chain Power", "unit": "INR/day", "default_rate": 2800.0},
            {"id": "packaging_line_labour", "name": "High-Speed Bottling/Bagging Labour", "unit": "INR/hour", "default_rate": 200.0},
            {"id": "evaporation_shrinkage", "name": "Process Moisture Loss / Shrinkage", "unit": "% loss", "default_rate": 4.0}
        ],
        "relevant_indicators": [
            {"code": "WB_PALM_OIL", "name": "World Bank Crude Palm Oil (Malaysia FOB)", "category": "Commodity", "unit": "USD/MT", "source": "World Bank Pink Sheet"},
            {"code": "WPI_FOOD_GRAINS", "name": "WPI - Food Articles (Grains & Pulses)", "category": "Macro", "unit": "Index 2011-12=100", "source": "Ministry of Commerce, India"},
            {"code": "MONSOON_DEFICIT", "name": "All-India Rainfall Deviation from LPA", "category": "Climate", "unit": "% deviation", "source": "IMD (India Meteorological Dept)"},
            {"code": "DIESEL_FREIGHT", "name": "Domestic Bulk Diesel Price (Cold Chain Logistics)", "category": "Energy", "unit": "INR/litre", "source": "IOCL Domestic"}
        ],
        "supplier_relationships": [
            {"type": "APMC Mandi Grain Aggregators", "payment_terms": "Immediate / RTGS within 48h", "typical_lead_days": 3, "contract_type": "Daily spot auctions"},
            {"type": "Edible Oil Refineries", "payment_terms": "Net 15", "typical_lead_days": 10, "contract_type": "Fortnightly contract"}
        ],
        "default_target_margin": 18.0,
        "critical_margin_threshold": 10.0,
        "sample_products": [
            {
                "name": "Refined Fortified Sunflower Cooking Oil (1 Litre Pouch)",
                "sku": "OIL-SUN-1L",
                "selling_price": 145.0,
                "target_margin": 16.0,
                "materials": [
                    {"name": "Crude Degummed Sunflower Oil", "quantity": 0.92, "unit": "kg", "unit_cost": 98.0, "index_link": "WB_PALM_OIL"},
                    {"name": "Multi-layer Recyclable Barrier Film Pouch", "quantity": 1.0, "unit": "pouch", "unit_cost": 4.5, "index_link": "BRENT_CRUDE"}
                ],
                "production": {"labour_hours": 0.05, "machine_hours": 0.08, "energy_kwh": 0.4}
            }
        ]
    }
}


def get_template(industry_id: str) -> Dict[str, Any]:
    if industry_id not in INDUSTRY_TEMPLATES:
        return INDUSTRY_TEMPLATES["metal_steel"]
    return INDUSTRY_TEMPLATES[industry_id]


def list_templates() -> List[Dict[str, Any]]:
    return [
        {
            "id": k,
            "name": v["name"],
            "description": v["description"],
            "material_categories": v["material_categories"],
            "default_units": v["default_units"],
            "default_target_margin": v["default_target_margin"],
            "critical_margin_threshold": v["critical_margin_threshold"],
        }
        for k, v in INDUSTRY_TEMPLATES.items()
    ]
