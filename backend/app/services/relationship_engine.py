from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from backend.app.models import (
    Material, Product, BOM, BOMItem, Supplier, SupplierQuotation,
    Inventory, CustomerOrder, ProductionCost, MaterialIndexMapping
)
from backend.app.services.financial_engine import FinancialCalculationEngine


class BusinessRelationshipEngine:
    """
    Connected Business Knowledge Graph Engine.
    Navigates graph dependencies between market indices, materials, BOMs,
    products, suppliers, inventory, customer orders, and financial exposures.
    """

    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id

    def propagate_market_indicator_change(
        self,
        indicator_code: str,
        percentage_change: float
    ) -> Dict[str, Any]:
        """
        Multi-hop graph propagation from external market indicator shock:
        Indicator Shock -> Mapped Materials -> Products (BOM) -> Suppliers ->
        Inventory Run-out -> Customer Orders -> Recalculated Costs & Financial Exposure.
        """
        # Step 1: Find all internal materials linked to this indicator
        mappings = (
            self.db.query(MaterialIndexMapping)
            .filter(
                MaterialIndexMapping.business_id == self.business_id,
                MaterialIndexMapping.indicator_code == indicator_code
            )
            .all()
        )

        affected_materials = []
        affected_material_ids = set()

        for m_map in mappings:
            material = self.db.query(Material).filter(Material.id == m_map.material_id).first()
            if not material:
                continue

            affected_material_ids.add(material.id)

            # Price impact formula: new_cost = base_cost * (1 + (pct_change * multiplier / 100))
            effective_change_pct = percentage_change * m_map.multiplier
            previous_market_price = material.current_market_price or material.standard_cost
            new_market_price = previous_market_price * (1.0 + (effective_change_pct / 100.0)) + m_map.freight_basis

            # Inventory check
            inv = self.db.query(Inventory).filter(Inventory.material_id == material.id).first()
            current_stock = inv.current_stock if inv else 0.0
            stock_unit = inv.unit if inv else material.unit

            # Find active suppliers for this material
            suppliers = (
                self.db.query(Supplier)
                .join(SupplierQuotation, SupplierQuotation.supplier_id == Supplier.id)
                .filter(
                    SupplierQuotation.material_id == material.id,
                    SupplierQuotation.business_id == self.business_id,
                    SupplierQuotation.is_active == True
                )
                .all()
            )

            affected_materials.append({
                "material_id": material.id,
                "material_code": material.code,
                "material_name": material.name,
                "category": material.category,
                "unit": material.unit,
                "previous_market_price": round(previous_market_price, 2),
                "new_market_price": round(new_market_price, 2),
                "effective_change_percent": round(effective_change_pct, 2),
                "current_stock": current_stock,
                "stock_unit": stock_unit,
                "stock_value_delta": round(current_stock * (new_market_price - previous_market_price), 2),
                "supplier_count": len(suppliers),
                "suppliers": [{"id": s.id, "name": s.name, "rating": s.risk_rating} for s in suppliers]
            })

        # Step 2: Find all products using any of the affected materials in active BOM
        products = (
            self.db.query(Product)
            .filter(Product.business_id == self.business_id, Product.is_active == True)
            .all()
        )

        affected_products = []
        total_inventory_exposure = sum(m["stock_value_delta"] for m in affected_materials)
        total_order_exposure = 0.0
        breached_products = []

        for prod in products:
            active_bom = (
                self.db.query(BOM)
                .filter(BOM.product_id == prod.id, BOM.is_active == True)
                .first()
            )
            if not active_bom:
                continue

            bom_items = self.db.query(BOMItem).filter(BOMItem.bom_id == active_bom.id).all()
            
            # Check if this product uses any of the affected materials
            uses_affected_material = False
            item_list_current = []
            item_list_shocked = []

            for bi in bom_items:
                mat = self.db.query(Material).filter(Material.id == bi.material_id).first()
                if not mat:
                    continue

                is_affected = bi.material_id in affected_material_ids
                if is_affected:
                    uses_affected_material = True

                # Current pricing
                current_cost = mat.current_market_price or mat.standard_cost
                item_list_current.append({
                    "material_id": mat.id,
                    "material_name": mat.name,
                    "quantity": bi.quantity,
                    "unit": bi.unit,
                    "unit_cost": current_cost,
                    "scrap_percent": bi.scrap_percent
                })

                # Shocked pricing
                if is_affected:
                    # Find corresponding new price from affected_materials
                    shock_mat = next((m for m in affected_materials if m["material_id"] == bi.material_id), None)
                    shock_price = shock_mat["new_market_price"] if shock_mat else current_cost
                else:
                    shock_price = current_cost

                item_list_shocked.append({
                    "material_id": mat.id,
                    "material_name": mat.name,
                    "quantity": bi.quantity,
                    "unit": bi.unit,
                    "unit_cost": shock_price,
                    "scrap_percent": bi.scrap_percent
                })

            if not uses_affected_material:
                continue

            # Calculate baseline costs
            prod_costs = self.db.query(ProductionCost).filter(ProductionCost.product_id == prod.id).first()
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

            bom_res_current = FinancialCalculationEngine.calculate_bom_material_cost(item_list_current)
            bom_res_shocked = FinancialCalculationEngine.calculate_bom_material_cost(item_list_shocked)

            cost_res_current = FinancialCalculationEngine.calculate_product_cost(
                bom_res_current, cost_dict, prod.selling_price,
                prod.target_margin_percent, prod.critical_margin_threshold
            )
            cost_res_shocked = FinancialCalculationEngine.calculate_product_cost(
                bom_res_shocked, cost_dict, prod.selling_price,
                prod.target_margin_percent, prod.critical_margin_threshold
            )

            margin_erosion = cost_res_current["gross_margin_percent"] - cost_res_shocked["gross_margin_percent"]
            unit_cost_delta = cost_res_shocked["total_unit_cost"] - cost_res_current["total_unit_cost"]

            is_breached = cost_res_shocked["gross_margin_percent"] < prod.critical_margin_threshold
            if is_breached:
                breached_products.append(prod.name)

            # Step 3: Find affected open customer orders for this product
            open_orders = (
                self.db.query(CustomerOrder)
                .filter(
                    CustomerOrder.product_id == prod.id,
                    CustomerOrder.business_id == self.business_id,
                    CustomerOrder.status.in_(["PENDING_REVIEW", "ACCEPTED", "IN_PRODUCTION"])
                )
                .all()
            )

            orders_data = []
            for ord in open_orders:
                order_cost_impact = ord.quantity * unit_cost_delta
                total_order_exposure += order_cost_impact

                order_res = FinancialCalculationEngine.calculate_order_economics(
                    order_quantity=ord.quantity,
                    agreed_unit_price=ord.agreed_unit_price,
                    unit_cost_current=cost_res_current["total_unit_cost"],
                    unit_cost_stress=cost_res_shocked["total_unit_cost"],
                    available_inventory_units=0.0,
                    target_margin_percent=prod.target_margin_percent,
                    critical_margin_threshold=prod.critical_margin_threshold
                )

                orders_data.append({
                    "order_id": ord.id,
                    "order_number": ord.order_number,
                    "customer_name": ord.customer_name,
                    "quantity": ord.quantity,
                    "agreed_price": ord.agreed_unit_price,
                    "cost_impact": round(order_cost_impact, 2),
                    "current_margin": order_res["current_margin_percent"],
                    "shocked_margin": order_res["stress_margin_percent"],
                    "recommendation": order_res["recommendation"]
                })

            affected_products.append({
                "product_id": prod.id,
                "product_code": prod.code,
                "product_name": prod.name,
                "sku": prod.sku,
                "selling_price": prod.selling_price,
                "previous_unit_cost": cost_res_current["total_unit_cost"],
                "new_unit_cost": cost_res_shocked["total_unit_cost"],
                "unit_cost_increase": round(unit_cost_delta, 2),
                "previous_margin_percent": cost_res_current["gross_margin_percent"],
                "new_margin_percent": cost_res_shocked["gross_margin_percent"],
                "margin_erosion_points": round(margin_erosion, 2),
                "previous_health": cost_res_current["margin_health"],
                "new_health": cost_res_shocked["margin_health"],
                "is_critical_breach": is_breached,
                "suggested_new_price": cost_res_shocked["suggested_target_price"],
                "open_orders": orders_data
            })

        return {
            "indicator_code": indicator_code,
            "percentage_change": percentage_change,
            "affected_materials": affected_materials,
            "affected_products": affected_products,
            "total_inventory_exposure": round(total_inventory_exposure, 2),
            "total_order_exposure": round(total_order_exposure, 2),
            "total_exposure": round(total_inventory_exposure + total_order_exposure, 2),
            "products_breaching_threshold": breached_products
        }
