from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models import Product, BOM, BOMItem, Material, ProductionCost, Inventory, CustomerOrder
from backend.app.services.financial_engine import FinancialCalculationEngine


class OrderSureService:
    """
    OrderSure Module.
    Financial evaluation gatekeeper for customer orders. Evaluates profitability,
    material availability, inventory coverage, and stress-scenario resilience
    before binding commitments are made.
    """

    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id

    def evaluate_order(
        self,
        product_id: int,
        order_quantity: float,
        agreed_unit_price: float,
        promised_delivery_days: int = 30
    ) -> Dict[str, Any]:
        """
        Evaluates order economics and material availability.
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
        if not active_bom:
            return {"error": "Active Bill of Materials not found for product"}

        bom_items = self.db.query(BOMItem).filter(BOMItem.bom_id == active_bom.id).all()

        material_evaluations = []
        item_list_current = []
        item_list_stress = []
        min_inventory_coverage_pct = 100.0

        for bi in bom_items:
            mat = self.db.query(Material).filter(Material.id == bi.material_id).first()
            if not mat:
                continue

            qty_needed = order_quantity * bi.quantity * (1.0 + bi.scrap_percent / 100.0)
            inv = self.db.query(Inventory).filter(Inventory.material_id == mat.id).first()
            current_stock = inv.current_stock if inv else 0.0

            coverage_pct = (current_stock / qty_needed * 100.0) if qty_needed > 0 else 100.0
            if coverage_pct < min_inventory_coverage_pct:
                min_inventory_coverage_pct = coverage_pct

            current_price = mat.current_market_price or mat.standard_cost
            stress_price = current_price * 1.18  # 18% stress shift

            item_list_current.append({
                "material_id": mat.id,
                "material_name": mat.name,
                "quantity": bi.quantity,
                "unit": bi.unit,
                "unit_cost": current_price,
                "scrap_percent": bi.scrap_percent
            })

            item_list_stress.append({
                "material_id": mat.id,
                "material_name": mat.name,
                "quantity": bi.quantity,
                "unit": bi.unit,
                "unit_cost": stress_price,
                "scrap_percent": bi.scrap_percent
            })

            material_evaluations.append({
                "material_id": mat.id,
                "name": mat.name,
                "quantity_required": round(qty_needed, 2),
                "unit": bi.unit,
                "stock_available": round(current_stock, 2),
                "stock_deficit": round(max(0.0, qty_needed - current_stock), 2),
                "coverage_percent": round(coverage_pct, 1),
                "status": "SUFFICIENT" if coverage_pct >= 100 else ("PARTIAL" if coverage_pct >= 50 else "SHORTAGE")
            })

        # Calculate unit production costs
        prod_costs = self.db.query(ProductionCost).filter(ProductionCost.product_id == product.id).first()
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

        bom_curr = FinancialCalculationEngine.calculate_bom_material_cost(item_list_current)
        bom_stress = FinancialCalculationEngine.calculate_bom_material_cost(item_list_stress)

        cost_curr = FinancialCalculationEngine.calculate_product_cost(
            bom_curr, cost_dict, agreed_unit_price, product.target_margin_percent, product.critical_margin_threshold
        )
        cost_stress = FinancialCalculationEngine.calculate_product_cost(
            bom_stress, cost_dict, agreed_unit_price, product.target_margin_percent, product.critical_margin_threshold
        )

        order_econ = FinancialCalculationEngine.calculate_order_economics(
            order_quantity=order_quantity,
            agreed_unit_price=agreed_unit_price,
            unit_cost_current=cost_curr["total_unit_cost"],
            unit_cost_stress=cost_stress["total_unit_cost"],
            available_inventory_units=min_inventory_coverage_pct * order_quantity / 100.0,
            target_margin_percent=product.target_margin_percent,
            critical_margin_threshold=product.critical_margin_threshold
        )

        return {
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "order_quantity": order_quantity,
            "agreed_unit_price": agreed_unit_price,
            "total_revenue": order_econ["total_revenue"],
            "current_unit_cost": order_econ["unit_cost_current"],
            "total_current_cost": order_econ["total_current_cost"],
            "current_gross_profit": order_econ["current_gross_profit"],
            "current_margin_percent": order_econ["current_margin_percent"],
            "stress_unit_cost": order_econ["unit_cost_stress"],
            "total_stress_cost": order_econ["total_stress_cost"],
            "stress_gross_profit": order_econ["stress_gross_profit"],
            "stress_margin_percent": order_econ["stress_margin_percent"],
            "recommendation": order_econ["recommendation"],
            "recommendation_reasons": order_econ["recommendation_reasons"],
            "suggested_price_floor": order_econ["suggested_price_floor"],
            "min_inventory_coverage_percent": round(min_inventory_coverage_pct, 1),
            "materials_breakdown": material_evaluations
        }

    def evaluate_all_open_orders(self) -> List[Dict[str, Any]]:
        orders = (
            self.db.query(CustomerOrder)
            .filter(
                CustomerOrder.business_id == self.business_id,
                CustomerOrder.status.in_(["PENDING_REVIEW", "ACCEPTED", "IN_PRODUCTION"])
            )
            .all()
        )
        results = []
        for ord in orders:
            eval_res = self.evaluate_order(
                product_id=ord.product_id,
                order_quantity=ord.quantity,
                agreed_unit_price=ord.agreed_unit_price
            )
            eval_res["order_id"] = ord.id
            eval_res["order_number"] = ord.order_number
            eval_res["customer_name"] = ord.customer_name
            eval_res["status"] = ord.status
            eval_res["order_date"] = ord.order_date.strftime("%Y-%m-%d")
            eval_res["promised_delivery"] = ord.promised_delivery_date.strftime("%Y-%m-%d")

            # Update DB status cache
            ord.margin_guard_status = eval_res["recommendation"]
            ord.calculated_margin_percent = eval_res["current_margin_percent"]
            results.append(eval_res)

        self.db.commit()
        return results
