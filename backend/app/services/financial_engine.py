from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import math


class FinancialCalculationEngine:
    """
    Deterministic Financial Calculation Engine for MarginMind AI.
    Zero LLM hallucinations - every calculation is mathematically exact,
    reproducible, and fully traceable to input records and parameters.
    """

    @staticmethod
    def calculate_bom_material_cost(
        bom_items: List[Dict[str, Any]],
        use_market_price: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates total material cost for a product BOM including scrap allowance.
        bom_items: list of dicts with keys:
          - material_id, material_name
          - quantity (in unit)
          - unit_cost (standard or inventory cost)
          - market_price (latest benchmarked market cost)
          - scrap_percent (e.g. 5.0 for 5%)
        """
        total_base_material_cost = 0.0
        total_scrap_cost = 0.0
        item_breakdown = []

        for item in bom_items:
            qty = float(item.get("quantity", 0.0))
            cost_per_unit = float(item.get("market_price", 0.0)) if use_market_price else float(item.get("unit_cost", 0.0))
            scrap_pct = float(item.get("scrap_percent", 0.0)) / 100.0

            base_cost = qty * cost_per_unit
            scrap_cost = base_cost * scrap_pct
            line_total = base_cost + scrap_cost

            total_base_material_cost += base_cost
            total_scrap_cost += scrap_cost

            item_breakdown.append({
                "material_id": item.get("material_id"),
                "material_name": item.get("material_name", "Unknown Material"),
                "quantity": qty,
                "unit": item.get("unit", "kg"),
                "unit_cost_used": cost_per_unit,
                "base_cost": round(base_cost, 2),
                "scrap_percent": item.get("scrap_percent", 0.0),
                "scrap_cost": round(scrap_cost, 2),
                "line_total": round(line_total, 2)
            })

        total_material_cost = total_base_material_cost + total_scrap_cost

        return {
            "total_material_cost": round(total_material_cost, 2),
            "total_base_material_cost": round(total_base_material_cost, 2),
            "total_scrap_cost": round(total_scrap_cost, 2),
            "item_breakdown": item_breakdown,
            "pricing_basis": "market_price" if use_market_price else "standard_cost"
        }

    @staticmethod
    def calculate_product_cost(
        material_cost_data: Dict[str, Any],
        production_costs: Dict[str, Any],
        selling_price: float,
        target_margin_percent: float = 25.0,
        critical_margin_threshold: float = 15.0
    ) -> Dict[str, Any]:
        """
        Calculates complete product unit cost, gross profit, and margin health.
        Production costs include:
          - direct_labour_hours * labour_rate_hourly
          - machine_hours * machine_rate_hourly
          - energy_kwh * energy_rate_kwh
          - fixed_overhead_per_unit
          - packaging_freight_per_unit
        """
        material_cost = float(material_cost_data.get("total_material_cost", 0.0))
        scrap_cost = float(material_cost_data.get("total_scrap_cost", 0.0))

        # Direct Labour: Support Worker Headcount & Daily Wages (Apparel/Manufacturing Lines) or Hourly
        worker_count = int(production_costs.get("worker_count", 0) or 0)
        daily_wage = float(production_costs.get("wage_per_worker_daily", 0.0) or 0.0)
        daily_output = float(production_costs.get("daily_output_units", 0.0) or 0.0)

        if worker_count > 0 and daily_output > 0 and daily_wage > 0:
            direct_labour_cost = (worker_count * daily_wage) / daily_output
            labour_calc_method = f"{worker_count} workers @ ₹{daily_wage:,.0f}/day across {daily_output:,.0f} units/day"
        else:
            labour_hours = float(production_costs.get("direct_labour_hours", 0.0) or 0.0)
            labour_rate = float(production_costs.get("labour_rate_hourly", 0.0) or 0.0)
            direct_labour_cost = labour_hours * labour_rate
            labour_calc_method = f"{labour_hours} hrs @ ₹{labour_rate}/hr"

        # Additional processing & jobwork costs (Dyeing, Washing, Printing, QC, Consumables)
        jobwork_cost = float(production_costs.get("processing_jobwork_cost_per_unit", 0.0) or 0.0)
        qc_cost = float(production_costs.get("inspection_qc_cost_per_unit", 0.0) or 0.0)
        consumables_cost = float(production_costs.get("consumables_cost_per_unit", 0.0) or 0.0)
        boiler_cost = float(production_costs.get("boiler_steam_fuel_per_unit", 0.0) or 0.0)

        machine_hours = float(production_costs.get("machine_hours", 0.0) or 0.0)
        machine_rate = float(production_costs.get("machine_rate_hourly", 0.0) or 0.0)
        machine_overhead = machine_hours * machine_rate

        energy_kwh = float(production_costs.get("energy_kwh", 0.0) or 0.0)
        energy_rate = float(production_costs.get("energy_rate_kwh", 0.0) or 0.0)
        electric_energy_cost = energy_kwh * energy_rate

        fixed_overhead = float(production_costs.get("fixed_overhead_per_unit", 0.0) or 0.0)
        freight_packaging = float(production_costs.get("packaging_freight_per_unit", 0.0) or 0.0)

        # Total Production Unit Cost
        total_unit_cost = (
            material_cost +
            direct_labour_cost +
            jobwork_cost +
            qc_cost +
            consumables_cost +
            boiler_cost +
            machine_overhead +
            electric_energy_cost +
            fixed_overhead +
            freight_packaging
        )

        gross_profit = selling_price - total_unit_cost
        gross_margin_percent = (gross_profit / selling_price * 100.0) if selling_price > 0 else 0.0

        # Margin Health Status
        if gross_margin_percent >= target_margin_percent:
            margin_health = "HEALTHY"
        elif gross_margin_percent >= critical_margin_threshold:
            margin_health = "WARNING"
        else:
            margin_health = "CRITICAL"

        material_cost_share = (material_cost / total_unit_cost * 100.0) if total_unit_cost > 0 else 0.0

        # Contribution Margin (Selling Price minus Variable Costs: Material, Labour, Energy, Freight)
        variable_costs = (
            material_cost +
            direct_labour_cost +
            jobwork_cost +
            qc_cost +
            consumables_cost +
            boiler_cost +
            electric_energy_cost +
            freight_packaging
        )
        unit_contribution = selling_price - variable_costs
        contribution_margin_ratio = (unit_contribution / selling_price) if selling_price > 0 else 0.0

        # Suggested price to achieve target margin
        suggested_target_price = (
            total_unit_cost / (1.0 - (target_margin_percent / 100.0))
        ) if target_margin_percent < 100.0 else total_unit_cost * 1.5

        return {
            "selling_price": round(selling_price, 2),
            "material_cost": round(material_cost, 2),
            "scrap_cost": round(scrap_cost, 2),
            "labour_cost": round(direct_labour_cost, 2),
            "labour_calc_method": labour_calc_method,
            "worker_count": worker_count,
            "wage_per_worker_daily": round(daily_wage, 2),
            "daily_output_units": round(daily_output, 2),
            "processing_jobwork_cost": round(jobwork_cost, 2),
            "inspection_qc_cost": round(qc_cost, 2),
            "consumables_cost": round(consumables_cost, 2),
            "boiler_steam_fuel": round(boiler_cost, 2),
            "machine_overhead": round(machine_overhead, 2),
            "energy_cost": round(electric_energy_cost, 2),
            "fixed_overhead": round(fixed_overhead, 2),
            "freight_packaging_cost": round(freight_packaging, 2),
            "total_unit_cost": round(total_unit_cost, 2),
            "gross_profit": round(gross_profit, 2),
            "gross_margin_percent": round(gross_margin_percent, 2),
            "target_margin_percent": target_margin_percent,
            "critical_margin_threshold": critical_margin_threshold,
            "margin_health": margin_health,
            "material_cost_share_percent": round(material_cost_share, 1),
            "unit_contribution": round(unit_contribution, 2),
            "contribution_margin_ratio": round(contribution_margin_ratio, 4),
            "suggested_target_price": round(suggested_target_price, 2),
            "calculated_at": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    def calculate_order_economics(
        order_quantity: float,
        agreed_unit_price: float,
        unit_cost_current: float,
        unit_cost_stress: float,
        available_inventory_units: float,
        target_margin_percent: float = 25.0,
        critical_margin_threshold: float = 15.0
    ) -> Dict[str, Any]:
        """
        Evaluates the financial economics of a specific customer order.
        Compares base profitability vs stress cost scenario.
        """
        total_revenue = order_quantity * agreed_unit_price
        total_current_cost = order_quantity * unit_cost_current
        current_gross_profit = total_revenue - total_current_cost
        current_margin_percent = (current_gross_profit / total_revenue * 100.0) if total_revenue > 0 else 0.0

        total_stress_cost = order_quantity * unit_cost_stress
        stress_gross_profit = total_revenue - total_stress_cost
        stress_margin_percent = (stress_gross_profit / total_revenue * 100.0) if total_revenue > 0 else 0.0

        # Inventory buffer coverage
        inventory_coverage_percent = (available_inventory_units / order_quantity * 100.0) if order_quantity > 0 else 100.0
        
        reasons = []
        if current_margin_percent < critical_margin_threshold:
            recommendation = "RISKY"
            reasons.append(f"Current margin ({current_margin_percent:.1f}%) is below critical threshold ({critical_margin_threshold}%).")
        elif stress_margin_percent < 0:
            recommendation = "RISKY"
            reasons.append(f"Under stress commodity scenario, this order turns cash-negative (Margin: {stress_margin_percent:.1f}%).")
        elif stress_margin_percent < critical_margin_threshold:
            recommendation = "VERIFY"
            reasons.append(f"Current margin is acceptable ({current_margin_percent:.1f}%), but stress scenario erodes margin to {stress_margin_percent:.1f}%. Price escalation clause advised.")
        elif inventory_coverage_percent < 50.0:
            recommendation = "VERIFY"
            reasons.append(f"Inventory coverage is only {inventory_coverage_percent:.1f}%. Additional raw materials must be procured at spot prices.")
        else:
            recommendation = "ATTRACTIVE"
            reasons.append(f"Healthy projected profitability ({current_margin_percent:.1f}%) with robust cushion under stress ({stress_margin_percent:.1f}%).")

        # Minimum selling price floor to protect critical threshold under stress
        price_floor = (unit_cost_stress / (1.0 - (critical_margin_threshold / 100.0))) if critical_margin_threshold < 100 else unit_cost_stress * 1.2

        return {
            "order_quantity": order_quantity,
            "agreed_unit_price": agreed_unit_price,
            "total_revenue": round(total_revenue, 2),
            "unit_cost_current": round(unit_cost_current, 2),
            "total_current_cost": round(total_current_cost, 2),
            "current_gross_profit": round(current_gross_profit, 2),
            "current_margin_percent": round(current_margin_percent, 2),
            "unit_cost_stress": round(unit_cost_stress, 2),
            "total_stress_cost": round(total_stress_cost, 2),
            "stress_gross_profit": round(stress_gross_profit, 2),
            "stress_margin_percent": round(stress_margin_percent, 2),
            "available_inventory_units": available_inventory_units,
            "inventory_coverage_percent": round(inventory_coverage_percent, 1),
            "recommendation": recommendation,
            "recommendation_reasons": reasons,
            "suggested_price_floor": round(price_floor, 2)
        }

    @staticmethod
    def calculate_weighted_average_inventory_cost(
        current_stock: float,
        current_wac: float,
        new_quantity: float,
        new_unit_price: float
    ) -> Dict[str, Any]:
        """
        Computes updated Weighted Average Cost (WAC) following a new purchase receipt.
        """
        total_quantity = current_stock + new_quantity
        if total_quantity <= 0:
            return {"new_stock": 0.0, "new_wac": current_wac}

        total_value = (current_stock * current_wac) + (new_quantity * new_unit_price)
        new_wac = total_value / total_quantity

        return {
            "previous_stock": current_stock,
            "previous_wac": round(current_wac, 2),
            "added_quantity": new_quantity,
            "purchase_price": round(new_unit_price, 2),
            "new_stock": round(total_quantity, 2),
            "new_wac": round(new_wac, 2)
        }

    @staticmethod
    def calculate_days_of_inventory(
        current_stock: float,
        average_daily_consumption: float
    ) -> float:
        """
        Returns number of days before inventory runs out.
        """
        if average_daily_consumption <= 0:
            return 999.0  # indefinite
        return round(current_stock / average_daily_consumption, 1)

    @staticmethod
    def calculate_break_even(
        fixed_costs: float,
        selling_price: float,
        variable_cost_per_unit: float
    ) -> Dict[str, Any]:
        """
        Computes Break-Even Volume and Revenue.
        """
        unit_contribution = selling_price - variable_cost_per_unit
        if unit_contribution <= 0:
            return {
                "break_even_units": None,
                "break_even_revenue": None,
                "is_viable": False,
                "message": "Selling price does not cover variable costs. Loss on every unit produced."
            }

        break_even_units = math.ceil(fixed_costs / unit_contribution)
        break_even_revenue = break_even_units * selling_price

        return {
            "break_even_units": break_even_units,
            "break_even_revenue": round(break_even_revenue, 2),
            "unit_contribution": round(unit_contribution, 2),
            "is_viable": True
        }
