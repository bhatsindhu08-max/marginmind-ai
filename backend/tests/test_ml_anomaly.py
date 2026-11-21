import pytest
from backend.app.ml.anomaly_detector import PriceAnomalyDetector


def test_statistical_price_anomaly_normal():
    # Historical stable prices around 260
    history = [255.0, 258.0, 260.0, 262.0, 259.0, 261.0, 263.0]
    target = 264.0  # Slight normal fluctuation
    result = PriceAnomalyDetector.detect_price_anomalies_statistical(history, target)
    assert result["is_anomaly"] is False
    assert result["severity"] == "NORMAL"
    assert result["modified_z_score"] < 2.0


def test_statistical_price_anomaly_spike():
    history = [255.0, 258.0, 260.0, 262.0, 259.0, 261.0, 263.0]
    spike_target = 390.0  # Massive 50% price spike
    result = PriceAnomalyDetector.detect_price_anomalies_statistical(history, spike_target)
    assert result["is_anomaly"] is True
    assert result["severity"] in ["HIGH", "CRITICAL"]
    assert result["modified_z_score"] > 2.0
    assert result["deviation_percent"] > 45.0


def test_insufficient_history_edge_case():
    history = [260.0, 265.0]  # Only 2 points
    result = PriceAnomalyDetector.detect_price_anomalies_statistical(history, 270.0)
    assert result["is_anomaly"] is False
    assert result["method"] == "insufficient_data"


def test_constant_history_edge_case():
    history = [100.0, 100.0, 100.0, 100.0]  # Zero MAD / Zero variance
    # Normal target
    res_normal = PriceAnomalyDetector.detect_price_anomalies_statistical(history, 101.0)
    assert res_normal["is_anomaly"] is False

    # Outlier target
    res_outlier = PriceAnomalyDetector.detect_price_anomalies_statistical(history, 120.0)
    assert res_outlier["is_anomaly"] is True
    assert res_outlier["deviation_percent"] == 20.0


def test_multivariate_isolation_forest():
    records = [
        {"id": 1, "unit_price": 260.0, "quantity": 100.0, "lead_time_days": 10.0},
        {"id": 2, "unit_price": 262.0, "quantity": 120.0, "lead_time_days": 12.0},
        {"id": 3, "unit_price": 259.0, "quantity": 90.0, "lead_time_days": 11.0},
        {"id": 4, "unit_price": 261.0, "quantity": 110.0, "lead_time_days": 10.0},
        {"id": 5, "unit_price": 263.0, "quantity": 105.0, "lead_time_days": 13.0},
        {"id": 6, "unit_price": 258.0, "quantity": 95.0, "lead_time_days": 9.0},
        {"id": 7, "unit_price": 260.0, "quantity": 115.0, "lead_time_days": 10.0},
        # Outlier: extreme price, tiny quantity, long lead time
        {"id": 8, "unit_price": 650.0, "quantity": 5.0, "lead_time_days": 60.0}
    ]

    scored = PriceAnomalyDetector.detect_anomalies_isolation_forest(records, contamination=0.15)
    assert len(scored) == len(records)
    outlier_item = next(item for item in scored if item["id"] == 8)
    assert outlier_item["is_anomaly"] is True
    assert "anomaly_score" in outlier_item
