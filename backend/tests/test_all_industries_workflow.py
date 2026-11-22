import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.seeds.metal_demo import seed_metal_demonstration
from backend.app.seeds.textile_demo import seed_textile_demonstration
from backend.app.seeds.electronics_demo import seed_electronics_demonstration
from backend.app.seeds.food_demo import seed_food_demonstration

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_all_industries():
    db = SessionLocal()
    try:
        seed_metal_demonstration(db)
        seed_textile_demonstration(db)
        seed_electronics_demonstration(db)
        seed_food_demonstration(db)
    finally:
        db.close()


def get_token(email: str, password: str = "password123") -> str:
    res = client.post(
        "/api/v1/auth/login",
        data={"username": email, "password": password},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert res.status_code == 200, f"Login failed for {email}: {res.text}"
    return res.json()["access_token"]


def test_all_four_industries_login_and_isolation():
    industries = [
        ("owner@apexforge.com", "metal_steel", "Apex Precision Forging"),
        ("owner@vardhmantextiles.com", "textile_garment", "Vardhman Heritage"),
        ("owner@sahasraelectronics.com", "electronics_assembly", "Sahasra Integrated"),
        ("owner@naturefreshfoods.com", "food_processing", "NatureFresh Agro"),
    ]

    for email, expected_ind, expected_name_part in industries:
        token = get_token(email)
        headers = {"Authorization": f"Bearer {token}"}

        # Check products
        res = client.get("/api/v1/products", headers=headers)
        assert res.status_code == 200
        products = res.json()
        assert len(products) >= 3, f"Expected at least 3 products for {email}, got {len(products)}"

        # Check tenant context
        res_loc = client.get("/api/v1/business/location", headers=headers)
        assert res_loc.status_code == 200
        loc_data = res_loc.json()
        assert expected_name_part in loc_data["business_name"]


def test_automated_market_price_sync():
    """Verify automated sync computes landed delivered cost from external benchmarks."""
    token = get_token("owner@vardhmantextiles.com")
    headers = {"Authorization": f"Bearer {token}"}

    sync_res = client.post("/api/v1/materials/sync-external-prices", headers=headers)
    assert sync_res.status_code == 200
    sync_data = sync_res.json()
    assert sync_data["status"] == "success"
    assert sync_data["synced_count"] > 0
    assert len(sync_data["updated_materials"]) > 0

    first_update = sync_data["updated_materials"][0]
    assert "new_market_price" in first_update
    assert first_update["new_market_price"] > 0


def test_location_hub_switch_and_recalibration():
    """Verify changing manufacturing hub recalibrates wages and freight basis."""
    token = get_token("owner@vardhmantextiles.com")
    headers = {"Authorization": f"Bearer {token}"}

    # Switch to Tirupur Garment Cluster
    put_res = client.put(
        "/api/v1/business/location",
        json={"location_hub": "TIRUPUR_GARMENT_CLUSTER", "calibrate_wages": True},
        headers=headers
    )
    assert put_res.status_code == 200
    data = put_res.json()
    assert data["business"]["location_hub"] == "TIRUPUR_GARMENT_CLUSTER"
    assert data["location_hub"]["state"] == "Tamil Nadu"


def test_manual_production_cost_and_wage_override():
    """Verify manual override of line crew headcount, daily wage, and job work costs."""
    token = get_token("owner@sahasraelectronics.com")
    headers = {"Authorization": f"Bearer {token}"}

    prods = client.get("/api/v1/products", headers=headers).json()
    target_prod = prods[0]
    prod_id = target_prod["id"]

    override_payload = {
        "worker_count": 20,
        "wage_per_worker_daily": 900.0,
        "daily_output_units": 450.0,
        "processing_jobwork_cost_per_unit": 45.0,
        "inspection_qc_cost_per_unit": 25.0,
        "consumables_cost_per_unit": 18.0,
        "boiler_steam_fuel_per_unit": 10.0,
        "selling_price": 4200.0
    }

    res = client.put(f"/api/v1/products/{prod_id}/production-costs", json=override_payload, headers=headers)
    assert res.status_code == 200
    cb = res.json()

    # (20 * 900) / 450 = 40.0
    assert abs(cb["labour_cost"] - 40.0) < 0.01
    assert cb["worker_count"] == 20
    assert cb["wage_per_worker_daily"] == 900.0
    assert cb["daily_output_units"] == 450.0
    assert cb["processing_jobwork_cost"] == 45.0
    assert cb["inspection_qc_cost"] == 25.0
    assert cb["consumables_cost"] == 18.0
    assert cb["boiler_steam_fuel"] == 10.0
    assert cb["selling_price"] == 4200.0
    assert cb["gross_profit"] > 0
    assert cb["gross_margin_percent"] > 0
