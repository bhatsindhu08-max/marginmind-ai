import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models import Business, User, Product, CustomerOrder
from backend.app.seeds.textile_demo import seed_textile_demonstration

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def ensure_textile_demo_seeded():
    db = SessionLocal()
    try:
        seed_textile_demonstration(db)
    finally:
        db.close()


def test_textile_owner_login_and_catalog():
    # 1. Login as Vardhman Textiles Business Owner
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "owner@vardhmantextiles.com", "password": "password123"}
    )
    assert login_resp.status_code == 200, login_resp.text
    token_data = login_resp.json()
    assert token_data["role"] == "business_owner"
    assert token_data["industry_type"] == "textile_garment"
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Verify all 5 diverse garments exist
    prods_resp = client.get("/api/v1/products", headers=headers)
    assert prods_resp.status_code == 200
    prods = prods_resp.json()
    assert len(prods) == 5

    prod_names = [p["name"] for p in prods]
    assert any("Bio-Washed Combed Cotton T-Shirt" in name for name in prod_names)
    assert any("Slim-Fit Stretch Denim Jeans" in name for name in prod_names)
    assert any("Formal Executive Giza Cotton Oxford Shirt" in name for name in prod_names)
    assert any("Women's Printed Viscose Rayon Casual Tunic Dress" in name for name in prod_names)
    assert any("Heavy Canvas Duck Workwear Utility Jacket" in name for name in prod_names)


def test_apparel_deterministic_costing_with_workers_and_all_manufacturing_costs():
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "owner@vardhmantextiles.com", "password": "password123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    prods = client.get("/api/v1/products", headers=headers).json()

    for p in prods:
        cb_resp = client.get(f"/api/v1/products/{p['id']}/cost-breakdown", headers=headers)
        assert cb_resp.status_code == 200, cb_resp.text
        cb = cb_resp.json()

        # Check worker headcount, daily wage, and daily output
        assert cb["worker_count"] > 1, f"Product {p['name']} missing worker headcount"
        assert cb["wage_per_worker_daily"] > 0, f"Product {p['name']} missing daily wage"
        assert cb["daily_output_units"] > 0, f"Product {p['name']} missing daily output"

        # Verify labor formula: (worker_count * wage_per_worker_daily) / daily_output_units
        expected_labour = round(
            (cb["worker_count"] * cb["wage_per_worker_daily"]) / cb["daily_output_units"], 2
        )
        assert abs(cb["labour_cost"] - expected_labour) <= 0.05, (
            f"Labour cost mismatch for {p['name']}: got {cb['labour_cost']}, expected {expected_labour}"
        )

        # Verify non-material manufacturing costs are strictly counted
        assert cb["processing_jobwork_cost"] > 0, f"{p['name']} missing jobwork/washing/printing cost"
        assert cb["inspection_qc_cost"] > 0, f"{p['name']} missing inspection/trimming cost"
        assert cb["consumables_cost"] > 0, f"{p['name']} missing consumables/trims cost"
        assert cb["boiler_steam_fuel"] > 0, f"{p['name']} missing boiler steam fuel cost"

        # Verify total unit cost equals sum of all production cost components
        expected_total = round(
            cb["material_cost"]
            + cb["labour_cost"]
            + cb["processing_jobwork_cost"]
            + cb["inspection_qc_cost"]
            + cb["consumables_cost"]
            + cb["boiler_steam_fuel"]
            + cb["machine_overhead"]
            + cb["energy_cost"]
            + cb["fixed_overhead"]
            + cb["freight_packaging_cost"],
            2
        )
        assert abs(cb["total_cost"] - expected_total) <= 0.05, (
            f"Total cost mismatch for {p['name']}: got {cb['total_cost']}, expected {expected_total}"
        )

        # Verify deterministic gross profit & margin
        expected_profit = round(cb["selling_price"] - cb["total_cost"], 2)
        assert abs(cb["gross_profit"] - expected_profit) <= 0.05

        expected_margin = round((expected_profit / cb["selling_price"]) * 100.0, 2)
        assert abs(cb["gross_margin_percent"] - expected_margin) <= 0.05


def test_textile_market_benchmarks_and_orders():
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "owner@vardhmantextiles.com", "password": "password123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Market summary serves textile indicators
    mkt_resp = client.get("/api/v1/market/summary", headers=headers)
    assert mkt_resp.status_code == 200
    mkt = mkt_resp.json()
    indicator_codes = [m["code"] for m in mkt]
    assert "COTTON_CANDY" in indicator_codes or "WB_COTTON_A_INDEX" in indicator_codes

    # 2. Customer orders are apparel orders (Zara, Levi's, Raymond, etc.)
    orders_resp = client.get("/api/v1/orders", headers=headers)
    assert orders_resp.status_code == 200
    orders = orders_resp.json()
    assert len(orders) >= 5
    cust_names = [o["customer_name"] for o in orders]
    assert any("Zara" in c for c in cust_names)
    assert any("Levi" in c for c in cust_names)


def test_automatic_seeding_on_new_cloth_company_registration():
    import uuid
    uid = uuid.uuid4().hex[:8]
    new_email = f"owner_cloth_{uid}@apparelhub.com"
    reg_resp = client.post(
        "/api/v1/auth/register",
        json={
            "email": new_email,
            "password": "testpassword123",
            "full_name": "Anita Verma (Founder)",
            "business_name": f"Anita Knits & Apparel {uid}",
            "industry_type": "textile_garment",
            "currency": "INR",
            "role": "business_owner"
        }
    )
    assert reg_resp.status_code == 200, reg_resp.text
    token = reg_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify newly registered cloth company immediately has its garment catalog loaded!
    prods_resp = client.get("/api/v1/products", headers=headers)
    assert prods_resp.status_code == 200
    prods = prods_resp.json()
    assert len(prods) == 5
    assert any("Bio-Washed Combed Cotton T-Shirt" in p["name"] for p in prods)

    # Verify worker crew and wages are present in cost breakdown
    cb_resp = client.get(f"/api/v1/products/{prods[0]['id']}/cost-breakdown", headers=headers)
    assert cb_resp.status_code == 200
    cb = cb_resp.json()
    assert cb["worker_count"] == 30
    assert cb["wage_per_worker_daily"] == 650.0
    assert cb["daily_output_units"] == 600.0
    assert cb["labour_cost"] == 32.50
