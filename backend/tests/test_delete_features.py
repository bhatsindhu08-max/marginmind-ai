import pytest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models import Business, User, Product, CustomerOrder, BOM, BOMItem, Material
from backend.app.core.security import get_password_hash

client = TestClient(app)


@pytest.fixture(scope="module")
def auth_headers():
    db = SessionLocal()
    try:
        biz = db.query(Business).filter(Business.slug == "apex-precision-metals").first()
        if not biz:
            biz = Business(
                name="Apex Precision Metals",
                slug="apex-precision-metals",
                industry_type="metal_steel",
                currency="INR",
                address="MIDC Bhosari, Pune, India"
            )
            db.add(biz)
            db.commit()
            db.refresh(biz)

        user = db.query(User).filter(User.email == "owner@apexmetals.com").first()
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

        login_res = client.post(
            "/api/v1/auth/login",
            data={"username": "owner@apexmetals.com", "password": "password123"}
        )
        assert login_res.status_code == 200, login_res.text
        token = login_res.json()["access_token"]
        return {"Authorization": f"Bearer {token}"}
    finally:
        db.close()


def test_delete_product_cascade(auth_headers):
    # 1. Create a temporary test product
    create_res = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "code": "PROD-DEL-TEST-001",
            "name": "Deletable Test Product",
            "sku": "SKU-DEL-001",
            "category": "Test Components",
            "selling_price": 5000.0,
            "target_margin_percent": 25.0,
            "critical_margin_threshold": 15.0
        }
    )
    assert create_res.status_code == 200, create_res.text
    prod = create_res.json()
    prod_id = prod["id"]

    # 2. Add an order pointing to this product
    order_res = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "order_number": "ORD-DEL-TEST-001",
            "customer_name": "Test Customer Ltd",
            "product_id": prod_id,
            "quantity": 50.0,
            "agreed_unit_price": 5200.0,
            "promised_delivery_date": (datetime.now(timezone.utc) + timedelta(days=20)).isoformat()
        }
    )
    assert order_res.status_code == 200, order_res.text
    order_id = order_res.json()["id"]

    # 3. Call DELETE on the product
    del_res = client.delete(f"/api/v1/products/{prod_id}", headers=auth_headers)
    assert del_res.status_code == 200, del_res.text
    del_data = del_res.json()
    assert del_data["status"] == "success"
    assert del_data["product_id"] == prod_id

    # 4. Verify product no longer exists
    get_prod = client.get(f"/api/v1/products/{prod_id}", headers=auth_headers)
    assert get_prod.status_code == 404

    # 5. Verify associated order was also removed in cascade
    orders_list = client.get("/api/v1/orders", headers=auth_headers).json()
    assert not any(o["id"] == order_id for o in orders_list)


def test_delete_customer_order(auth_headers):
    # 1. Create a product to attach the order to
    prod_res = client.post(
        "/api/v1/products",
        headers=auth_headers,
        json={
            "code": "PROD-DEL-ORD-002",
            "name": "Order Parent Product",
            "sku": "SKU-DEL-ORD-002",
            "category": "Test Components",
            "selling_price": 4500.0,
            "target_margin_percent": 25.0,
            "critical_margin_threshold": 15.0
        }
    )
    assert prod_res.status_code == 200, prod_res.text
    prod_id = prod_res.json()["id"]

    # 2. Create a customer order
    order_res = client.post(
        "/api/v1/orders",
        headers=auth_headers,
        json={
            "order_number": "ORD-STANDALONE-DEL-999",
            "customer_name": "Temporary Order Client",
            "product_id": prod_id,
            "quantity": 25.0,
            "agreed_unit_price": 4800.0,
            "promised_delivery_date": (datetime.now(timezone.utc) + timedelta(days=15)).isoformat()
        }
    )
    assert order_res.status_code == 200, order_res.text
    order_id = order_res.json()["id"]

    # 3. Delete the customer order
    del_res = client.delete(f"/api/v1/orders/{order_id}", headers=auth_headers)
    assert del_res.status_code == 200, del_res.text
    del_data = del_res.json()
    assert del_data["status"] == "success"
    assert del_data["order_id"] == order_id

    # 4. Verify order is gone from list
    orders_list = client.get("/api/v1/orders", headers=auth_headers).json()
    assert not any(o["id"] == order_id for o in orders_list)

    # 5. Clean up parent product
    client.delete(f"/api/v1/products/{prod_id}", headers=auth_headers)
