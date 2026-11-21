import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models import Business, User
from backend.app.core.security import get_password_hash

client = TestClient(app)


@pytest.fixture(scope="module")
def setup_second_tenant():
    db = SessionLocal()
    try:
        # Create second business: TextileCraft
        biz2 = db.query(Business).filter(Business.name == "TextileCraft India Pvt Ltd").first()
        if not biz2:
            biz2 = Business(
                name="TextileCraft India Pvt Ltd",
                slug="textilecraft-india",
                industry_type="textile_garments",
                currency="INR",
                address="Surat, Gujarat, India"
            )
            db.add(biz2)
            db.commit()
            db.refresh(biz2)

        # Create user for TextileCraft
        user2 = db.query(User).filter(User.email == "owner@textilecraft.in").first()
        if not user2:
            user2 = User(
                business_id=biz2.id,
                email="owner@textilecraft.in",
                full_name="Rajesh Textile Owner",
                hashed_password=get_password_hash("textilepass123"),
                role="business_owner",
                is_active=True
            )
            db.add(user2)
            db.commit()
            db.refresh(user2)

        return {"business_id": biz2.id, "email": "owner@textilecraft.in", "password": "textilepass123"}
    finally:
        db.close()


def test_tenant_isolation(setup_second_tenant):
    tenant2_info = setup_second_tenant

    # Login as Tenant 2 (TextileCraft)
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": tenant2_info["email"], "password": tenant2_info["password"]}
    )
    assert login_resp.status_code == 200
    token_tenant2 = login_resp.json()["access_token"]
    headers2 = {"Authorization": f"Bearer {token_tenant2}"}

    # Also login as Tenant 1 (Apex Forge)
    login1_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "owner@apexforge.com", "password": "password123"}
    )
    assert login1_resp.status_code == 200
    token_tenant1 = login1_resp.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token_tenant1}"}

    # Verify Tenant 1 has 3 products
    p1_resp = client.get("/api/v1/products", headers=headers1)
    assert p1_resp.status_code == 200
    p1_list = p1_resp.json()
    assert len(p1_list) >= 3
    p1_ids = [p["id"] for p in p1_list]

    # Verify Tenant 2 has 0 products initially (isolated database filtering)
    p2_resp = client.get("/api/v1/products", headers=headers2)
    assert p2_resp.status_code == 200
    p2_list = p2_resp.json()
    assert len(p2_list) == 0

    # Verify Tenant 2 cannot view Tenant 1's product details
    t1_prod_id = p1_ids[0]
    unauthorized_get = client.get(f"/api/v1/products/{t1_prod_id}", headers=headers2)
    assert unauthorized_get.status_code == 404  # Product not found for Tenant 2

    # Verify Tenant 2 cannot view Tenant 1's orders
    orders_resp2 = client.get("/api/v1/orders", headers=headers2)
    assert orders_resp2.status_code == 200
    assert len(orders_resp2.json()) == 0

    # Verify Tenant 2 cannot view Tenant 1's prepared decisions
    dec_resp2 = client.get("/api/v1/decisions/all", headers=headers2)
    assert dec_resp2.status_code == 200
    assert len(dec_resp2.json()) == 0

    # Verify Tenant 2 creates its own material
    create_mat_resp = client.post(
        "/api/v1/materials",
        json={
            "code": "YARN-40S",
            "name": "Combed Cotton Yarn 40s",
            "category": "yarn",
            "unit": "kg",
            "standard_cost": 290.0,
            "current_market_price": 295.0,
            "min_safety_stock": 500.0,
            "is_active": True
        },
        headers=headers2
    )
    assert create_mat_resp.status_code == 200
    created_mat = create_mat_resp.json()
    assert created_mat["name"] == "Combed Cotton Yarn 40s"

    # Verify Tenant 1 cannot see Tenant 2's new material
    mat1_resp = client.get("/api/v1/materials", headers=headers1)
    assert mat1_resp.status_code == 200
    mat1_names = [m["name"] for m in mat1_resp.json()]
    assert "Combed Cotton Yarn 40s" not in mat1_names
