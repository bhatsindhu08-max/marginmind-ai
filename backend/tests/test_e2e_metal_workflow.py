import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from backend.app.main import app
from backend.app.core.database import SessionLocal
from backend.app.models import Business, User, PreparedDecision, DecisionApproval, AuditLog, Product, Material

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "MarginMind AI"


def test_authentication_and_rbac():
    # Login as Business Owner
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "owner@apexforge.com", "password": "password123"}
    )
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    assert token_data["role"] == "business_owner"
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify /auth/me
    me_resp = client.get("/api/v1/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "owner@apexforge.com"

    # Verify templates
    tmpl_resp = client.get("/api/v1/auth/templates")
    assert tmpl_resp.status_code == 200
    assert len(tmpl_resp.json()) >= 4


def test_marginguard_and_portfolio_overview():
    # Login as Finance Manager
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "finance@apexforge.com", "password": "password123"}
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    resp = client.get("/api/v1/marginguard/overview", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_products"] == 3
    assert "all_products" in data
    assert len(data["all_products"]) == 3
    # Check that Flange has deterministic margin calculation
    flange = next(p for p in data["all_products"] if "Flange" in p["name"])
    assert flange["selling_price"] == 4200.0
    assert flange["margin_percent"] > 20.0


def test_ordersure_open_orders_evaluation():
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "production@apexforge.com", "password": "password123"}
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    resp = client.get("/api/v1/ordersure/open-orders", headers=headers)
    assert resp.status_code == 200
    orders = resp.json()
    assert len(orders) >= 3
    for ord in orders:
        assert ord["recommendation"] in ["ATTRACTIVE", "VERIFY", "RISKY"]
        assert "suggested_price_floor" in ord


def test_e2e_market_shock_propagation_to_decision_approval():
    """
    End-to-End demonstration test:
    1. Collect new market shock: LME Aluminium surges +15.0%.
    2. Propagation engine calculates impact on Aviation Bracket & Transmission Housing.
    3. Decision Preparation Engine generates price revision & order review proposals.
    4. Business Owner reviews pending proposals and approves with edit.
    5. Audit log and approval history are immutably recorded.
    """
    # 1. Login as Business Owner
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "owner@apexforge.com", "password": "password123"}
    )
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Simulate External Shock: LME_ALU +15.0%
    shock_resp = client.post(
        "/api/v1/market/simulate-shock",
        json={"indicator_code": "LME_ALU", "percentage_change": 15.0},
        headers=headers
    )
    assert shock_resp.status_code == 200
    shock_data = shock_resp.json()
    assert shock_data["percentage_change"] == 15.0
    assert len(shock_data["affected_materials"]) >= 2
    assert shock_data["prepared_decision_count"] >= 1
    assert shock_data["total_exposure"] > 0

    # 3. Retrieve Pending Decision Proposals
    dec_resp = client.get("/api/v1/decisions/pending", headers=headers)
    assert dec_resp.status_code == 200
    pending_decisions = dec_resp.json()
    assert len(pending_decisions) >= 1

    target_decision = pending_decisions[0]
    decision_id = target_decision["id"]

    # 4. Act on Decision: Approve with custom executive edit
    action_resp = client.post(
        f"/api/v1/decisions/{decision_id}/action",
        json={
            "action_taken": "EDIT",
            "edited_payload_json": {"new_selling_price": 6150.0, "approved_by_board": True},
            "comments": "Approved price revision to INR 6,150 to absorb 15% LME aluminium surge."
        },
        headers=headers
    )
    assert action_resp.status_code == 200
    action_data = action_resp.json()
    assert action_data["success"] is True
    assert action_data["new_status"] == "APPROVED_WITH_EDITS"

    # 5. Verify Immutable Approval History
    history_resp = client.get("/api/v1/decisions/history", headers=headers)
    assert history_resp.status_code == 200
    history = history_resp.json()
    assert len(history) >= 1
    latest_audit = history[0]
    assert latest_audit["decision_id"] == decision_id
    assert latest_audit["action_taken"] == "EDIT"
    assert "6,150" in latest_audit["comments"]


def test_product_viability_and_price_simulation():
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "finance@apexforge.com", "password": "password123"}
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Get product 1
    prod_resp = client.get("/api/v1/products", headers=headers)
    assert prod_resp.status_code == 200
    prods = prod_resp.json()
    prod_id = prods[0]["id"]

    # Viability assessment
    viab_resp = client.get(f"/api/v1/viability/{prod_id}", headers=headers)
    assert viab_resp.status_code == 200
    viab = viab_resp.json()
    assert "break_even" in viab
    assert "strategic_recommendation" in viab
    assert "long_term_forecast" in viab

    # Price simulation
    sim_resp = client.get(f"/api/v1/viability/{prod_id}/simulate-price?new_price=4600", headers=headers)
    assert sim_resp.status_code == 200
    sim = sim_resp.json()
    assert sim["simulated_price"] == 4600.0
    assert "elasticity_analysis" in sim


def test_report_generation_pdf_and_excel():
    login_resp = client.post(
        "/api/v1/auth/login",
        data={"username": "finance@apexforge.com", "password": "password123"}
    )
    headers = {"Authorization": f"Bearer {login_resp.json()['access_token']}"}

    # Excel Report
    excel_resp = client.post("/api/v1/reports/export-excel", headers=headers)
    assert excel_resp.status_code == 200
    assert len(excel_resp.content) > 1000

    # PDF Report
    pdf_resp = client.post("/api/v1/reports/export-pdf", headers=headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.content.startswith(b"%PDF")
