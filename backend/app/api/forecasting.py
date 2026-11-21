from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from backend.app.core.database import get_db
from backend.app.models import Material, Product
from backend.app.services.forecasting_engine import LongTermForecastingEngine
from backend.app.services.financial_engine import FinancialCalculationEngine
from backend.app.api.deps import get_current_tenant

router = APIRouter(prefix="/forecasting", tags=["Long-Term Scenario Forecasting"])


@router.get("/material/{material_id}")
def get_material_forecast_scenarios(
    material_id: int,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    mat = db.query(Material).filter(Material.id == material_id, Material.business_id == tenant_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Material not found")

    current_price = mat.current_market_price or mat.standard_cost
    return LongTermForecastingEngine.generate_material_price_scenarios(
        material_name=mat.name,
        current_price=current_price,
        unit=f"INR/{mat.unit}"
    )


@router.get("/product/{product_id}")
def get_product_margin_scenarios(
    product_id: int,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id, Product.business_id == tenant_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    # Estimate unit cost from current BOM
    from backend.app.models import BOM, BOMItem, ProductionCost
    active_bom = db.query(BOM).filter(BOM.product_id == prod.id, BOM.is_active == True).first()
    item_list = []
    if active_bom:
        bom_items = db.query(BOMItem).filter(BOMItem.bom_id == active_bom.id).all()
        for bi in bom_items:
            m = db.query(Material).filter(Material.id == bi.material_id).first()
            if m:
                item_list.append({
                    "quantity": bi.quantity,
                    "unit_cost": m.current_market_price or m.standard_cost,
                    "scrap_percent": bi.scrap_percent
                })

    bom_res = FinancialCalculationEngine.calculate_bom_material_cost(item_list)
    prod_costs = db.query(ProductionCost).filter(ProductionCost.product_id == prod.id).first()
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
        bom_res, cost_dict, prod.selling_price, prod.target_margin_percent, prod.critical_margin_threshold
    )

    return LongTermForecastingEngine.generate_product_margin_scenarios(
        product_name=prod.name,
        current_selling_price=prod.selling_price,
        current_unit_cost=cost_res["total_unit_cost"],
        material_cost_share=cost_res["material_cost_share_percent"] / 100.0,
        target_margin_percent=prod.target_margin_percent,
        critical_margin_threshold=prod.critical_margin_threshold
    )
