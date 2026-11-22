import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models import Business, User, Product
from backend.app.core.security import get_password_hash

client = TestClient(app)


@pytest.fixture(scope="module")
def auth_headers():
    db = SessionLocal()
    try:
        biz = db.query(Business).filter(Business.id == 1).first()
        if not biz:
            biz = Business(
                name="Apex Precision Metals",
                slug="apex-precision-metals",
                industry_type="metal_steel",
                currency="INR"
            )
            db.add(biz)
            db.commit()
            db.refresh(biz)

        user = db.query(User).filter(User.business_id == biz.id).first()
        if not user:
            user = User(
                business_id=biz.id,
                email="owner@apexmetals.com",
                full_name="Rajesh Sharma",
                hashed_password=get_password_hash("password123"),
                role="business_owner",
                is_active=True
            )
            db.add(user)
            db.commit()

        login_resp = client.post(
            "/api/v1/auth/login",
            data={"username": user.email, "password": "password123"}
        )
        assert login_resp.status_code == 200
        token = login_resp.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    finally:
        db.close()


def test_order_deep_viability(auth_headers):
    resp = client.get(
        "/api/v1/ordersure/deep-viability?product_id=1&quantity=150&agreed_price=4200&available_cash=500000&future_price_shock_pct=15",
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()

    assert "spend_breakdown" in data
    assert "raw_material" in data["spend_breakdown"]
    assert "direct_labour" in data["spend_breakdown"]
    assert "rent_and_overhead" in data["spend_breakdown"]
    assert "supply_and_energy" in data["spend_breakdown"]
    assert "profitability" in data
    assert "cash_affordability" in data
    assert "production_time" in data
    assert "future_price_risk" in data
    assert "advisory" in data
    assert data["advisory"]["action"] in ["KEEP_ORDER", "KEEP_BUT_LOCK_SUPPLIER", "RENEGOTIATE_PRICE", "DROP_ORDER"]


def test_loss_making_order_recommends_drop(auth_headers):
    # Selling price of 500 for product 1 which costs > 2000 to make
    resp = client.get(
        "/api/v1/ordersure/deep-viability?product_id=1&quantity=100&agreed_price=500&available_cash=50000",
        headers=auth_headers
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["advisory"]["action"] == "DROP_ORDER"
    assert data["profitability"]["is_profitable"] is False
