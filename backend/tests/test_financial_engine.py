import pytest
from backend.app.services.financial_engine import FinancialCalculationEngine


def test_calculate_bom_material_cost():
    bom_items = [
        {"material_id": 1, "material_name": "IS 2062 Carbon Steel", "quantity": 10.0, "unit_cost": 65.0, "scrap_percent": 5.0},
        {"material_id": 2, "material_name": "Fasteners", "quantity": 4.0, "unit_cost": 25.0, "scrap_percent": 0.0}
    ]
    # Steel: 10 * 65 = 650; scrap: 650 * 0.05 = 32.50; total = 682.50
    # Fasteners: 4 * 25 = 100; scrap: 0; total = 100.0
    # Total = 782.50
    result = FinancialCalculationEngine.calculate_bom_material_cost(bom_items)
    assert result["total_material_cost"] == 782.50
    assert result["total_base_material_cost"] == 750.0
    assert result["total_scrap_cost"] == 32.50
    assert len(result["item_breakdown"]) == 2


def test_calculate_product_cost_healthy_and_critical():
    material_cost_data = {"total_material_cost": 1000.0, "total_scrap_cost": 50.0}
    production_costs = {
        "direct_labour_hours": 2.0,
        "labour_rate_hourly": 300.0,  # 600
        "machine_hours": 1.5,
        "machine_rate_hourly": 600.0,  # 900
        "energy_kwh": 20.0,
        "energy_rate_kwh": 10.0,       # 200
        "fixed_overhead_per_unit": 200.0, # 200
        "packaging_freight_per_unit": 100.0 # 100
    }
    # Total cost = 1000 + 600 + 900 + 200 + 200 + 100 = 3000.0
    # Selling price 4000: profit = 1000 (25% margin) -> HEALTHY (target 25%)
    res_healthy = FinancialCalculationEngine.calculate_product_cost(
        material_cost_data, production_costs, selling_price=4000.0, target_margin_percent=25.0, critical_margin_threshold=15.0
    )
    assert res_healthy["total_unit_cost"] == 3000.0
    assert res_healthy["gross_profit"] == 1000.0
    assert res_healthy["gross_margin_percent"] == 25.0
    assert res_healthy["margin_health"] == "HEALTHY"

    # Selling price 3400: profit = 400 (11.76% margin) -> CRITICAL (< 15%)
    res_critical = FinancialCalculationEngine.calculate_product_cost(
        material_cost_data, production_costs, selling_price=3400.0, target_margin_percent=25.0, critical_margin_threshold=15.0
    )
    assert res_critical["gross_margin_percent"] < 15.0
    assert res_critical["margin_health"] == "CRITICAL"


def test_calculate_order_economics():
    # Order: 100 units at 5000 each = 500,000 revenue
    # Current cost: 3500 (30% margin)
    # Stress cost: 4800 (4% margin, critical threshold 15%)
    result = FinancialCalculationEngine.calculate_order_economics(
        order_quantity=100,
        agreed_unit_price=5000.0,
        unit_cost_current=3500.0,
        unit_cost_stress=4800.0,
        available_inventory_units=80.0,
        target_margin_percent=25.0,
        critical_margin_threshold=15.0
    )
    assert result["total_revenue"] == 500000.0
    assert result["current_margin_percent"] == 30.0
    assert result["stress_margin_percent"] == 4.0
    assert result["recommendation"] == "VERIFY"
    assert result["inventory_coverage_percent"] == 80.0


def test_calculate_weighted_average_inventory_cost():
    # 100 kg @ 70 INR/kg + 100 kg @ 90 INR/kg = 200 kg @ 80 INR/kg
    res = FinancialCalculationEngine.calculate_weighted_average_inventory_cost(
        current_stock=100.0,
        current_wac=70.0,
        new_quantity=100.0,
        new_unit_price=90.0
    )
    assert res["new_stock"] == 200.0
    assert res["new_wac"] == 80.0


def test_calculate_break_even():
    # Fixed costs: 50,000, price: 500, variable cost: 300. Contribution = 200. Break-even = 250 units.
    res = FinancialCalculationEngine.calculate_break_even(
        fixed_costs=50000.0,
        selling_price=500.0,
        variable_cost_per_unit=300.0
    )
    assert res["break_even_units"] == 250
    assert res["break_even_revenue"] == 125000.0
    assert res["is_viable"] is True
