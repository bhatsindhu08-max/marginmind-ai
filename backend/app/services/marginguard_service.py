from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models import Product, BOM, BOMItem, Material, ProductionCost
from backend.app.services.financial_engine import FinancialCalculationEngine


class MarginGuardService:
    """
    MarginGuard Module.
    Continuously monitors product margins against defined target and critical thresholds.
    Performs margin erosion decomposition and prioritises products at risk.
    """

    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id

    def get_portfolio_margin_overview(self) -> Dict[str, Any]:
        """
        Scans all products in the company catalog, calculates current margins,
        identifies threshold breaches, and generates exposure rankings.
        """
        products = (
            self.db.query(Product)
            .filter(Product.business_id == self.business_id, Product.is_active == True)
            .all()
        )

        product_evaluations = []
        healthy_count = 0
        warning_count = 0
        critical_count = 0

        for p in products:
            active_bom = (
                self.db.query(BOM)
                .filter(BOM.product_id == p.id, BOM.is_active == True)
                .first()
            )
            item_list = []
            if active_bom:
                bom_items = self.db.query(BOMItem).filter(BOMItem.bom_id == active_bom.id).all()
                for bi in bom_items:
                    mat = self.db.query(Material).filter(Material.id == bi.material_id).first()
                    if mat:
                        item_list.append({
                            "material_id": mat.id,
                            "material_name": mat.name,
                            "quantity": bi.quantity,
                            "unit": bi.unit,
                            "unit_cost": mat.current_market_price or mat.standard_cost,
                            "scrap_percent": bi.scrap_percent
                        })

            bom_res = FinancialCalculationEngine.calculate_bom_material_cost(item_list)
            prod_costs = self.db.query(ProductionCost).filter(ProductionCost.product_id == p.id).first()
            cost_dict = {
                "direct_labour_hours": prod_costs.direct_labour_hours if prod_costs else 1.0,
                "labour_rate_hourly": prod_costs.labour_rate_hourly if prod_costs else 300.0,
                "machine_hours": prod_costs.machine_hours if prod_costs else 1.0,
                "machine_rate_hourly": prod_costs.machine_rate_hourly if prod_costs else 600.0,
                "energy_kwh": prod_costs.energy_kwh if prod_costs else 10.0,
                "energy_rate_kwh": prod_costs.energy_rate_kwh if prod_costs else 8.0,
                "fixed_overhead_per_unit": prod_costs.fixed_overhead_per_unit if prod_costs else 150.0,
                "packaging_freight_per_unit": prod_costs.packaging_freight_per_unit if prod_costs else 50.0
            }

            cost_res = FinancialCalculationEngine.calculate_product_cost(
                bom_res, cost_dict, p.selling_price, p.target_margin_percent, p.critical_margin_threshold
            )

            if cost_res["margin_health"] == "HEALTHY":
                healthy_count += 1
            elif cost_res["margin_health"] == "WARNING":
                warning_count += 1
            else:
                critical_count += 1

            product_evaluations.append({
                "product_id": p.id,
                "name": p.name,
                "sku": p.sku,
                "selling_price": p.selling_price,
                "total_cost": cost_res["total_unit_cost"],
                "gross_profit": cost_res["gross_profit"],
                "margin_percent": cost_res["gross_margin_percent"],
                "target_margin": p.target_margin_percent,
                "critical_threshold": p.critical_margin_threshold,
                "health": cost_res["margin_health"],
                "suggested_price": cost_res["suggested_target_price"],
                "material_share": cost_res["material_cost_share_percent"],
                "material_breakdown": bom_res["item_breakdown"]
            })

        # Rank by margin ascending (most at-risk first)
        product_evaluations.sort(key=lambda x: x["margin_percent"])

        total_prods = len(product_evaluations)
        avg_margin = (
            sum(p["margin_percent"] for p in product_evaluations) / total_prods
        ) if total_prods > 0 else 0.0

        return {
            "total_products": total_prods,
            "healthy_count": healthy_count,
            "warning_count": warning_count,
            "critical_count": critical_count,
            "average_portfolio_margin": round(avg_margin, 2),
            "at_risk_products": [p for p in product_evaluations if p["health"] in ["WARNING", "CRITICAL"]],
            "all_products": product_evaluations
        }
