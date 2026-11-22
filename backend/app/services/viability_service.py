from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models import Product, BOM, BOMItem, Material, ProductionCost
from backend.app.services.financial_engine import FinancialCalculationEngine
from backend.app.services.forecasting_engine import LongTermForecastingEngine


class ProductViabilityService:
    """
    Product Viability and Price Decision Service.
    Determines strategic lifecycle viability: Continue, Renegotiate/Re-price, or Discontinue.
    """

    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id

    def assess_product_viability(self, product_id: int) -> Dict[str, Any]:
        """
        Deep financial viability assessment for a specific product.
        """
        product = (
            self.db.query(Product)
            .filter(Product.id == product_id, Product.business_id == self.business_id)
            .first()
        )
        if not product:
            return {"error": "Product not found"}

        active_bom = (
            self.db.query(BOM)
            .filter(BOM.product_id == product.id, BOM.is_active == True)
            .first()
        )
        item_list = []
        material_exposures = []
        if active_bom:
            bom_items = self.db.query(BOMItem).filter(BOMItem.bom_id == active_bom.id).all()
            for bi in bom_items:
                mat = self.db.query(Material).filter(Material.id == bi.material_id).first()
                if mat:
                    cost = mat.current_market_price or mat.standard_cost
                    item_list.append({
                        "material_id": mat.id,
                        "material_name": mat.name,
                        "quantity": bi.quantity,
                        "unit": bi.unit,
                        "unit_cost": cost,
                        "scrap_percent": bi.scrap_percent
                    })
                    material_exposures.append({
                        "material_name": mat.name,
                        "category": mat.category,
                        "quantity": bi.quantity,
                        "unit_cost": cost,
                        "total_cost": round(bi.quantity * cost, 2)
                    })

        bom_res = FinancialCalculationEngine.calculate_bom_material_cost(item_list)
        prod_costs = self.db.query(ProductionCost).filter(ProductionCost.product_id == product.id).first()
        cost_dict = {
            "direct_labour_hours": prod_costs.direct_labour_hours if prod_costs else 1.0,
            "labour_rate_hourly": prod_costs.labour_rate_hourly if prod_costs else 300.0,
            "machine_hours": prod_costs.machine_hours if prod_costs else 1.0,
            "machine_rate_hourly": prod_costs.machine_rate_hourly if prod_costs else 600.0,
            "energy_kwh": prod_costs.energy_kwh if prod_costs else 10.0,
            "energy_rate_kwh": prod_costs.energy_rate_kwh if prod_costs else 8.0,
            "fixed_overhead_per_unit": prod_costs.fixed_overhead_per_unit if prod_costs else 150.0,
            "packaging_freight_per_unit": prod_costs.packaging_freight_per_unit if prod_costs else 50.0,
            "worker_count": getattr(prod_costs, 'worker_count', 1) or 1 if prod_costs else 1,
            "wage_per_worker_daily": getattr(prod_costs, 'wage_per_worker_daily', 0.0) or 0.0 if prod_costs else 0.0,
            "daily_output_units": getattr(prod_costs, 'daily_output_units', 0.0) or 0.0 if prod_costs else 0.0,
            "processing_jobwork_cost_per_unit": getattr(prod_costs, 'processing_jobwork_cost_per_unit', 0.0) or 0.0 if prod_costs else 0.0,
            "inspection_qc_cost_per_unit": getattr(prod_costs, 'inspection_qc_cost_per_unit', 0.0) or 0.0 if prod_costs else 0.0,
            "consumables_cost_per_unit": getattr(prod_costs, 'consumables_cost_per_unit', 0.0) or 0.0 if prod_costs else 0.0,
            "boiler_steam_fuel_per_unit": getattr(prod_costs, 'boiler_steam_fuel_per_unit', 0.0) or 0.0 if prod_costs else 0.0,
        }

        cost_res = FinancialCalculationEngine.calculate_product_cost(
            bom_res, cost_dict, product.selling_price, product.target_margin_percent, product.critical_margin_threshold
        )

        # Break-even analysis (fixed overhead = Rs 250,000 monthly plant allocation)
        monthly_fixed_allocation = 250000.0
        variable_cost_per_unit = (
            cost_res["material_cost"] + cost_res["labour_cost"] + cost_res["energy_cost"] + cost_res["freight_packaging_cost"]
        )
        be_res = FinancialCalculationEngine.calculate_break_even(
            fixed_costs=monthly_fixed_allocation,
            selling_price=product.selling_price,
            variable_cost_per_unit=variable_cost_per_unit
        )

        # Long-term forecast scenarios
        forecast_res = LongTermForecastingEngine.generate_product_margin_scenarios(
            product_name=product.name,
            current_selling_price=product.selling_price,
            current_unit_cost=cost_res["total_unit_cost"],
            material_cost_share=cost_res["material_cost_share_percent"] / 100.0,
            target_margin_percent=product.target_margin_percent,
            critical_margin_threshold=product.critical_margin_threshold
        )

        # Determine Strategic Viability Advice
        # Check 1-3y and 3-5y stress scenarios
        stress_1_3y_viable = forecast_res["horizons"]["1-3y"]["scenarios"]["STRESS"]["is_viable"]
        base_3_5y_margin = forecast_res["horizons"]["3-5y"]["scenarios"]["BASE"]["projected_margin_percent"]

        options = []
        if cost_res["margin_health"] == "CRITICAL":
            strategic_recommendation = "DISCONTINUE_OR_REPRICE_IMMEDIATELY"
            rationale = "Current selling price fails to satisfy critical margin threshold under current market prices."
            options.append(f"Execute immediate price increase from {product.selling_price} to {cost_res['suggested_target_price']} to restore {product.target_margin_percent}% margin.")
            options.append("Initiate value engineering / lightweighting on primary materials.")
            options.append("If customer contracts restrict price escalation, wind down volume and reallocate machining capacity to higher-margin products.")
        elif not stress_1_3y_viable:
            strategic_recommendation = "RENEGOTIATE_ESCALATION_CLAUSE"
            rationale = "Product is profitable today, but vulnerable to projected raw material inflation over 1-3 years."
            options.append("Incorporate raw material index-linked escalation clauses in customer annual contracts.")
            options.append("Engage secondary suppliers to hedge raw material purchase prices.")
        else:
            strategic_recommendation = "CONTINUE_PRODUCTION"
            rationale = f"Strong financial viability across baseline and stress horizons (Projected 3-5y Base Margin: {base_3_5y_margin:.1f}%)."
            options.append("Maintain production and explore volume growth opportunities.")

        # Sort material exposures by highest cost share
        material_exposures.sort(key=lambda x: x["total_cost"], reverse=True)

        return {
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "category": product.category,
            "current_selling_price": product.selling_price,
            "current_unit_cost": cost_res["total_unit_cost"],
            "current_gross_margin_percent": cost_res["gross_margin_percent"],
            "target_margin_percent": product.target_margin_percent,
            "critical_margin_threshold": product.critical_margin_threshold,
            "margin_health": cost_res["margin_health"],
            "break_even": be_res,
            "strategic_recommendation": strategic_recommendation,
            "rationale": rationale,
            "action_options": options,
            "top_cost_driver_materials": material_exposures[:3],
            "long_term_forecast": forecast_res
        }

    def simulate_price_adjustment(
        self,
        product_id: int,
        new_price: float
    ) -> Dict[str, Any]:
        """
        Interactive price simulator: tests impact of price changes on margin,
        break-even volume, and customer price elasticity.
        """
        product = (
            self.db.query(Product)
            .filter(Product.id == product_id, Product.business_id == self.business_id)
            .first()
        )
        if not product:
            return {"error": "Product not found"}

        # Get current cost breakdown
        viability = self.assess_product_viability(product_id)
        current_cost = viability["current_unit_cost"]

        # Calculate with new price
        profit = new_price - current_cost
        margin_pct = (profit / new_price * 100.0) if new_price > 0 else 0.0

        price_delta = new_price - product.selling_price
        pct_price_change = (price_delta / product.selling_price * 100.0) if product.selling_price > 0 else 0.0

        # Estimated volume sensitivity (Price Elasticity of Demand roughly -1.2 for industrial fabrication)
        elasticity = -1.2
        estimated_volume_change_pct = pct_price_change * elasticity
        
        # Assume baseline volume = 1,000 units
        base_volume = 1000.0
        new_volume = max(100.0, base_volume * (1.0 + estimated_volume_change_pct / 100.0))

        base_revenue = base_volume * product.selling_price
        new_revenue = new_volume * new_price

        base_total_profit = base_volume * (product.selling_price - current_cost)
        new_total_profit = new_volume * (new_price - current_cost)

        return {
            "product_id": product.id,
            "product_name": product.name,
            "current_price": product.selling_price,
            "simulated_price": new_price,
            "price_change_amount": round(price_delta, 2),
            "price_change_percent": round(pct_price_change, 2),
            "current_cost": current_cost,
            "simulated_gross_profit": round(profit, 2),
            "simulated_margin_percent": round(margin_pct, 2),
            "target_margin_percent": product.target_margin_percent,
            "margin_status": "HEALTHY" if margin_pct >= product.target_margin_percent else ("WARNING" if margin_pct >= product.critical_margin_threshold else "CRITICAL"),
            "elasticity_analysis": {
                "assumed_price_elasticity": elasticity,
                "projected_volume_change_percent": round(estimated_volume_change_pct, 1),
                "baseline_annual_profit": round(base_total_profit, 2),
                "simulated_annual_profit": round(new_total_profit, 2),
                "net_profit_delta": round(new_total_profit - base_total_profit, 2)
            }
        }
