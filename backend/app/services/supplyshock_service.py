from typing import Dict, Any, List
from sqlalchemy.orm import Session
from backend.app.models import Material, Supplier, SupplierQuotation, Inventory, CustomerOrder, BOM, BOMItem, MarketEvent


class SupplyShockService:
    """
    SupplyShock Module.
    Detects external supply chain and cost shocks, single-source dependencies,
    and inventory run-out risks across materials and active orders.
    """

    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id

    def assess_supply_vulnerabilities(self) -> Dict[str, Any]:
        """
        Assesses all company materials for:
        1. Single-source supplier concentration.
        2. Days of inventory on hand (Buffer).
        3. External market indicator volatility.
        4. Affected open customer commitments.
        """
        materials = (
            self.db.query(Material)
            .filter(Material.business_id == self.business_id, Material.is_active == True)
            .all()
        )

        vulnerabilities = []
        critical_shocks = 0

        for m in materials:
            # Active suppliers
            suppliers = (
                self.db.query(Supplier)
                .join(SupplierQuotation, SupplierQuotation.supplier_id == Supplier.id)
                .filter(
                    SupplierQuotation.material_id == m.id,
                    SupplierQuotation.business_id == self.business_id,
                    SupplierQuotation.is_active == True
                )
                .all()
            )
            supplier_count = len(suppliers)
            is_single_sourced = (supplier_count == 1)

            # Inventory
            inv = self.db.query(Inventory).filter(Inventory.material_id == m.id).first()
            current_stock = inv.current_stock if inv else 0.0

            # Daily consumption estimated from open orders
            open_orders = (
                self.db.query(CustomerOrder)
                .filter(
                    CustomerOrder.business_id == self.business_id,
                    CustomerOrder.status.in_(["PENDING_REVIEW", "ACCEPTED", "IN_PRODUCTION"])
                )
                .all()
            )

            total_demand = 0.0
            affected_order_numbers = []

            for ord in open_orders:
                # Find BOM items for product
                bom = self.db.query(BOM).filter(BOM.product_id == ord.product_id, BOM.is_active == True).first()
                if bom:
                    b_items = self.db.query(BOMItem).filter(BOMItem.bom_id == bom.id, BOMItem.material_id == m.id).all()
                    for bi in b_items:
                        qty_req = ord.quantity * bi.quantity * (1.0 + bi.scrap_percent / 100.0)
                        total_demand += qty_req
                        if ord.order_number not in affected_order_numbers:
                            affected_order_numbers.append(ord.order_number)

            days_of_supply = round((current_stock / (total_demand / 30.0)), 1) if total_demand > 0 else 999.0

            # Risk Rating
            if is_single_sourced and days_of_supply < 15.0:
                risk_level = "CRITICAL"
                critical_shocks += 1
            elif is_single_sourced or days_of_supply < 30.0:
                risk_level = "HIGH"
            elif days_of_supply < 45.0:
                risk_level = "MEDIUM"
            else:
                risk_level = "LOW"

            vulnerabilities.append({
                "material_id": m.id,
                "material_name": m.name,
                "material_code": m.code,
                "category": m.category,
                "unit": m.unit,
                "current_stock": current_stock,
                "demand_30d": round(total_demand, 1),
                "days_of_supply": days_of_supply,
                "supplier_count": supplier_count,
                "is_single_sourced": is_single_sourced,
                "primary_supplier": suppliers[0].name if suppliers else "No active quotation",
                "risk_level": risk_level,
                "affected_orders_count": len(affected_order_numbers),
                "affected_orders": affected_order_numbers
            })

        # Recent external events
        recent_events = (
            self.db.query(MarketEvent)
            .order_by(MarketEvent.published_date.desc())
            .limit(5)
            .all()
        )

        return {
            "critical_shocks_count": critical_shocks,
            "materials_monitored": len(materials),
            "vulnerabilities": vulnerabilities,
            "recent_shocks": [
                {
                    "id": ev.id,
                    "title": ev.title,
                    "event_type": ev.event_type,
                    "severity": ev.severity,
                    "published_date": ev.published_date.strftime("%Y-%m-%d"),
                    "affected_materials": ev.affected_materials_json
                }
                for ev in recent_events
            ]
        }
