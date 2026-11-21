from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.ensemble import IsolationForest


class PriceAnomalyDetector:
    """
    Detects abnormal purchase prices, supplier quotation spikes, and cost outliers
    using both Statistical IQR / Modified Z-Score and Isolation Forest.
    """

    @staticmethod
    def detect_price_anomalies_statistical(
        historical_prices: List[float],
        target_price: float,
        threshold_z: float = 2.0
    ) -> Dict[str, Any]:
        """
        Statistical outlier detection using Median Absolute Deviation (MAD) / Modified Z-score.
        """
        if len(historical_prices) < 3:
            return {
                "is_anomaly": False,
                "score": 0.0,
                "method": "insufficient_data",
                "message": "Fewer than 3 historical observations. Baseline cannot be established."
            }

        prices = np.array(historical_prices)
        median = np.median(prices)
        mad = np.median(np.abs(prices - median))

        if mad == 0:
            # Fall back to standard deviation
            std = np.std(prices)
            if std == 0:
                is_anomaly = bool(abs(target_price - median) > 0.05 * median)
                return {
                    "is_anomaly": is_anomaly,
                    "score": 1.0 if is_anomaly else 0.0,
                    "method": "constant_history",
                    "deviation_percent": round(((target_price - median) / median) * 100.0, 1),
                    "baseline_median": round(float(median), 2)
                }
            z_score = abs(target_price - np.mean(prices)) / std
        else:
            # Modified Z-score (Boris Iglewicz and David Hoaglin)
            z_score = 0.6745 * abs(target_price - median) / mad

        is_anomaly = bool(z_score > threshold_z)
        deviation_pct = ((target_price - median) / median) * 100.0

        return {
            "is_anomaly": is_anomaly,
            "modified_z_score": round(float(z_score), 2),
            "threshold": threshold_z,
            "deviation_percent": round(float(deviation_pct), 1),
            "baseline_median": round(float(median), 2),
            "target_price": target_price,
            "severity": "CRITICAL" if z_score > 3.5 else ("HIGH" if z_score > 2.5 else "MEDIUM" if is_anomaly else "NORMAL")
        }

    @staticmethod
    def detect_anomalies_isolation_forest(
        historical_records: List[Dict[str, float]],
        contamination: float = 0.08
    ) -> List[Dict[str, Any]]:
        """
        Multivariate anomaly detection on purchase records:
        features: [unit_price, quantity, lead_time_days]
        """
        if len(historical_records) < 5:
            return historical_records

        features = []
        for r in historical_records:
            features.append([
                float(r.get("unit_price", 0.0)),
                float(r.get("quantity", 1.0)),
                float(r.get("lead_time_days", 14.0))
            ])

        X = np.array(features)
        clf = IsolationForest(contamination=contamination, random_state=42)
        preds = clf.fit_predict(X)
        scores = clf.decision_function(X)

        results = []
        for i, r in enumerate(historical_records):
            item = dict(r)
            item["is_anomaly"] = bool(preds[i] == -1)
            item["anomaly_score"] = round(float(-scores[i]), 3)  # higher = more anomalous
            results.append(item)

        return results
