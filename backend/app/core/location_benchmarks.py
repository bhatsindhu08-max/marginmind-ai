"""
Regional Location Benchmarks for Manufacturing Hubs across India.
Provides pre-calibrated baseline worker daily wages, logistics freight basis,
and industrial utility electricity tariffs per manufacturing cluster.
"""
from typing import Dict, Any, List

LOCATION_HUBS: Dict[str, Dict[str, Any]] = {
    "PUNE_MIDC": {
        "id": "PUNE_MIDC",
        "name": "Pune Industrial Cluster (MIDC Bhosari / Chakan)",
        "state": "Maharashtra",
        "tier": "Tier-1 Industrial Hub",
        "primary_industries": ["metal_steel", "electronics_assembly"],
        "daily_wage_benchmark": 850.0,
        "freight_basis_per_kg": 2.50,
        "electricity_rate_kwh": 8.50,
        "notes": "Major automotive and heavy forging cluster. Close to JNPT port."
    },
    "BENGALURU_ELECTRONIC_CITY": {
        "id": "BENGALURU_ELECTRONIC_CITY",
        "name": "Bengaluru Electronics City & Peenya Cluster",
        "state": "Karnataka",
        "tier": "Tier-1 Tech & Hardware Hub",
        "primary_industries": ["electronics_assembly", "metal_steel"],
        "daily_wage_benchmark": 880.0,
        "freight_basis_per_kg": 4.50,
        "electricity_rate_kwh": 8.20,
        "notes": "Premier electronics design, SMT assembly and aerospace manufacturing belt."
    },
    "LUDHIANA_FOCAL_POINT": {
        "id": "LUDHIANA_FOCAL_POINT",
        "name": "Ludhiana Focal Point & Industrial Area",
        "state": "Punjab",
        "tier": "Tier-2 Specialized Textile & Forging Hub",
        "primary_industries": ["textile_garment", "metal_steel"],
        "daily_wage_benchmark": 680.0,
        "freight_basis_per_kg": 1.50,
        "electricity_rate_kwh": 7.90,
        "notes": "Leading textile knitwear, spinning, and bicycle component industrial zone."
    },
    "NASHIK_AGRO_PARK": {
        "id": "NASHIK_AGRO_PARK",
        "name": "Nashik Agro & Food Processing Mega Park",
        "state": "Maharashtra",
        "tier": "Tier-2 Agricultural Processing Hub",
        "primary_industries": ["food_processing"],
        "daily_wage_benchmark": 580.0,
        "freight_basis_per_kg": 1.20,
        "electricity_rate_kwh": 7.80,
        "notes": "Strategic farm-gate processing corridor for fruits, onions, grapes, and pulses."
    },
    "TIRUPUR_GARMENT_CLUSTER": {
        "id": "TIRUPUR_GARMENT_CLUSTER",
        "name": "Tirupur Knitwear Export Cluster",
        "state": "Tamil Nadu",
        "tier": "Tier-2 Global Apparel Hub",
        "primary_industries": ["textile_garment"],
        "daily_wage_benchmark": 650.0,
        "freight_basis_per_kg": 1.20,
        "electricity_rate_kwh": 8.00,
        "notes": "India's knitwear export capital. High labor availability and wet processing mills."
    },
    "SURAT_INDUSTRIAL_BELT": {
        "id": "SURAT_INDUSTRIAL_BELT",
        "name": "Surat GIDC & Hazira Industrial Belt",
        "state": "Gujarat",
        "tier": "Tier-2 Synthetic Textile & Petrochem Hub",
        "primary_industries": ["textile_garment", "metal_steel"],
        "daily_wage_benchmark": 700.0,
        "freight_basis_per_kg": 1.80,
        "electricity_rate_kwh": 7.60,
        "notes": "Polyester filament weaving, chemical dyeing, and coastal port access."
    },
    "GURUGRAM_MANESAR_AUTO": {
        "id": "GURUGRAM_MANESAR_AUTO",
        "name": "Gurugram / Manesar IMT Automotive & SMT Hub",
        "state": "Haryana (NCR)",
        "tier": "Tier-1 NCR Industrial Hub",
        "primary_industries": ["metal_steel", "electronics_assembly"],
        "daily_wage_benchmark": 880.0,
        "freight_basis_per_kg": 3.00,
        "electricity_rate_kwh": 8.90,
        "notes": "North Indian hub for high-volume auto electronics and CNC fabrication."
    }
}


def list_location_hubs() -> List[Dict[str, Any]]:
    return list(LOCATION_HUBS.values())


def get_location_hub(hub_id: str) -> Dict[str, Any]:
    return LOCATION_HUBS.get(hub_id, LOCATION_HUBS["PUNE_MIDC"])
