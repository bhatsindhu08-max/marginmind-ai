import pytest
from backend.app.services.forecasting_engine import LongTermForecastingEngine


def test_material_price_scenarios_all_horizons():
    price = 280.0
    series = [240.0, 245.0, 252.0, 260.0, 268.0, 275.0, 280.0]

    scenarios = LongTermForecastingEngine.generate_material_price_scenarios(
        material_name="Aluminium Alloy 6061",
        current_price=price,
        unit="INR/kg",
        historical_series=series
    )

    assert scenarios["target_name"] == "Aluminium Alloy 6061"
    assert "horizons" in scenarios
    assert "model_metrics" in scenarios

    # Check 4 horizons exist
    for h in ["0-3m", "3-12m", "1-3y", "3-5y"]:
        assert h in scenarios["horizons"]
        h_data = scenarios["horizons"][h]
        sc_cases = h_data["scenarios"]
        assert "FAVOURABLE" in sc_cases
        assert "BASE" in sc_cases
        assert "STRESS" in sc_cases

        # Verify stress > base > favourable
        fav_price = sc_cases["FAVOURABLE"]["projected_price"]
        base_price = sc_cases["BASE"]["projected_price"]
        stress_price = sc_cases["STRESS"]["projected_price"]
        assert stress_price > base_price
        assert base_price > fav_price


def test_forecasting_backtest_metrics():
    # Long historical series
    series = [100.0 + i * 2.0 for i in range(24)]
    metrics = LongTermForecastingEngine.backtest_models(series, test_size=4)

    assert "MAE" in metrics
    assert "RMSE" in metrics
    assert "MAPE" in metrics
    assert metrics["MAPE"] >= 0.0
    assert metrics["RMSE"] >= metrics["MAE"]  # Mathematical property of RMSE vs MAE


def test_product_margin_forecasting():
    # Flange unit cost baseline
    current_cost = 3120.0
    selling_price = 4200.0

    projections = LongTermForecastingEngine.generate_product_margin_scenarios(
        product_name="Forged Steel Flange Class 300",
        current_selling_price=selling_price,
        current_unit_cost=current_cost
    )

    assert projections["product_name"] == "Forged Steel Flange Class 300"
    assert "horizons" in projections

    # Under 3-5y STRESS, cost increases and margin compresses
    long_term_stress = projections["horizons"]["3-5y"]["scenarios"]["STRESS"]
    assert long_term_stress["projected_unit_cost"] > current_cost
    assert long_term_stress["projected_margin_percent"] < 25.0
