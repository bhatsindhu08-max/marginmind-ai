from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from backend.app.core.database import get_db
from backend.app.models import Product, BOM, BOMItem, Material, ProductionCost, CustomerOrder, ForecastScenario
from backend.app.schemas.product import (
    ProductOut, ProductCreate, ProductUpdate, ProductCostBreakdown,
    BOMCreate, BOMOut, ProductionCostCreate, ProductionCostOut
)
from backend.app.services.financial_engine import FinancialCalculationEngine
from backend.app.api.deps import get_current_user, get_current_tenant, require_role
from backend.app.core.rbac import UserRole

router = APIRouter(prefix="/products", tags=["Products & Bills of Materials"])


@router.get("", response_model=List[ProductOut])
def list_products(
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    return db.query(Product).filter(Product.business_id == tenant_id).all()


@router.post("", response_model=ProductOut)
def create_product(
    data: ProductCreate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PRODUCTION_MANAGER, UserRole.FINANCE_MANAGER, UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    prod_dict = data.model_dump(exclude={"raw_material_name", "material_cost", "material_unit", "direct_labour_cost", "fixed_overhead"})
    prod = Product(business_id=tenant_id, **prod_dict)
    db.add(prod)
    db.flush()

    # Create or link Material & BOM if material info was provided
    mat_cost = float(data.material_cost or 0.0)
    mat_name = (data.raw_material_name or "").strip()
    u_val = data.material_unit or "kg"

    if mat_cost > 0 or mat_name:
        if not mat_name:
            mat_name = f"{prod.name} Primary Material"
        mat = db.query(Material).filter(Material.business_id == tenant_id, Material.name == mat_name).first()
        if not mat:
            mat = Material(
                business_id=tenant_id,
                code=f"MAT-{prod.code[:8]}",
                name=mat_name,
                category="Raw Material",
                unit=u_val,
                standard_cost=mat_cost,
                current_market_price=mat_cost,
                min_safety_stock=50.0,
                is_active=True
            )
            db.add(mat)
            db.flush()

            from backend.app.models import Inventory
            inv = Inventory(
                business_id=tenant_id,
                material_id=mat.id,
                current_stock=100.0,
                unit=u_val,
                weighted_average_cost=mat_cost
            )
            db.add(inv)

        bom = BOM(business_id=tenant_id, product_id=prod.id, version="1.0", is_active=True, notes="Primary Recipe")
        db.add(bom)
        db.flush()

        bom_item = BOMItem(
            bom_id=bom.id,
            material_id=mat.id,
            quantity=1.0,
            unit=u_val,
            scrap_percent=2.0
        )
        db.add(bom_item)

    # Create production cost structure with specified labour and fixed overhead
    labour_rate = float(data.direct_labour_cost if data.direct_labour_cost is not None else 150.0)
    overhead_rate = float(data.fixed_overhead if data.fixed_overhead is not None else 120.0)

    p_cost = ProductionCost(
        business_id=tenant_id,
        product_id=prod.id,
        direct_labour_hours=1.0,
        labour_rate_hourly=labour_rate,
        fixed_overhead_per_unit=overhead_rate,
        machine_hours=0.5,
        machine_rate_hourly=100.0,
        energy_kwh=5.0,
        energy_rate_kwh=8.0,
        packaging_freight_per_unit=30.0,
        worker_count=1,
        wage_per_worker_daily=labour_rate,
        daily_output_units=100.0
    )
    db.add(p_cost)
    db.commit()
    db.refresh(prod)
    return prod


@router.get("/{product_id}", response_model=ProductOut)
def get_product(
    product_id: int,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id, Product.business_id == tenant_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")
    return prod


@router.put("/{product_id}", response_model=ProductOut)
def update_product(
    product_id: int,
    data: ProductUpdate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.FINANCE_MANAGER, UserRole.PRODUCTION_MANAGER])),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id, Product.business_id == tenant_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(prod, k, v)

    db.commit()
    db.refresh(prod)
    return prod


@router.get("/{product_id}/cost-breakdown", response_model=ProductCostBreakdown)
def get_product_cost_breakdown(
    product_id: int,
    tenant_id: int = Depends(get_current_tenant),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id, Product.business_id == tenant_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    active_bom = db.query(BOM).filter(BOM.product_id == prod.id, BOM.is_active == True).first()
    item_list = []
    if active_bom:
        bom_items = db.query(BOMItem).filter(BOMItem.bom_id == active_bom.id).all()
        for bi in bom_items:
            mat = db.query(Material).filter(Material.id == bi.material_id).first()
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
    prod_costs = db.query(ProductionCost).filter(ProductionCost.product_id == prod.id).first()
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
        bom_res, cost_dict, prod.selling_price, prod.target_margin_percent, prod.critical_margin_threshold
    )

    return {
        "product_id": prod.id,
        "product_name": prod.name,
        "sku": prod.sku,
        "selling_price": prod.selling_price,
        "material_cost": cost_res["material_cost"],
        "labour_cost": cost_res["labour_cost"],
        "machine_overhead": cost_res["machine_overhead"],
        "energy_cost": cost_res["energy_cost"],
        "fixed_overhead": cost_res["fixed_overhead"],
        "freight_packaging_cost": cost_res["freight_packaging_cost"],
        "scrap_cost": cost_res["scrap_cost"],
        "total_cost": cost_res["total_unit_cost"],
        "gross_profit": cost_res["gross_profit"],
        "gross_margin_percent": cost_res["gross_margin_percent"],
        "target_margin_percent": prod.target_margin_percent,
        "critical_margin_threshold": prod.critical_margin_threshold,
        "margin_health": cost_res["margin_health"],
        "material_cost_share_percent": cost_res["material_cost_share_percent"],
        "labour_calc_method": cost_res.get("labour_calc_method"),
        "worker_count": cost_res.get("worker_count"),
        "wage_per_worker_daily": cost_res.get("wage_per_worker_daily"),
        "daily_output_units": cost_res.get("daily_output_units"),
        "processing_jobwork_cost": cost_res.get("processing_jobwork_cost"),
        "inspection_qc_cost": cost_res.get("inspection_qc_cost"),
        "consumables_cost": cost_res.get("consumables_cost"),
        "boiler_steam_fuel": cost_res.get("boiler_steam_fuel"),
    }


@router.post("/{product_id}/bom", response_model=BOMOut)
def create_or_update_bom(
    product_id: int,
    data: BOMCreate,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PRODUCTION_MANAGER])),
    db: Session = Depends(get_db)
):
    prod = db.query(Product).filter(Product.id == product_id, Product.business_id == tenant_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    bom = BOM(
        business_id=tenant_id,
        product_id=prod.id,
        version=data.version,
        notes=data.notes,
        is_active=True
    )
    db.add(bom)
    db.flush()

    for it in data.items:
        bi = BOMItem(
            bom_id=bom.id,
            material_id=it.material_id,
            quantity=it.quantity,
            unit=it.unit,
            scrap_percent=it.scrap_percent,
            process_stage=it.process_stage
        )
        db.add(bi)

    db.commit()
    db.refresh(bom)
    return bom


@router.put("/{product_id}/production-costs")
def update_product_production_costs(
    product_id: int,
    cost_data: Dict[str, Any],
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PRODUCTION_MANAGER, UserRole.FINANCE_MANAGER, UserRole.BUSINESS_OWNER])),
    db: Session = Depends(get_db)
):
    """
    Manual Labor Cost, Worker Wage, Output & Overhead Override:
    Allows user to manually tune worker crew size, daily wages, output targets,
    and processing costs based on local manufacturing and labor market conditions.
    """
    prod = db.query(Product).filter(Product.id == product_id, Product.business_id == tenant_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    pcost = db.query(ProductionCost).filter(ProductionCost.product_id == prod.id, ProductionCost.business_id == tenant_id).first()
    if not pcost:
        pcost = ProductionCost(business_id=tenant_id, product_id=prod.id)
        db.add(pcost)

    fields = [
        "worker_count", "wage_per_worker_daily", "daily_output_units",
        "processing_jobwork_cost_per_unit", "inspection_qc_cost_per_unit",
        "consumables_cost_per_unit", "boiler_steam_fuel_per_unit",
        "direct_labour_hours", "labour_rate_hourly",
        "machine_hours", "machine_rate_hourly",
        "energy_kwh", "energy_rate_kwh",
        "fixed_overhead_per_unit", "packaging_freight_per_unit"
    ]
    for f in fields:
        if f in cost_data and cost_data[f] is not None:
            setattr(pcost, f, cost_data[f])

    if "selling_price" in cost_data and cost_data["selling_price"] is not None:
        prod.selling_price = float(cost_data["selling_price"])

    db.commit()
    db.refresh(pcost)

    # Return refreshed cost breakdown
    return get_product_cost_breakdown(product_id=prod.id, tenant_id=tenant_id, db=db)


@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(require_role([UserRole.PRODUCTION_MANAGER, UserRole.FINANCE_MANAGER])),
    db: Session = Depends(get_db)
):
    """
    Safely delete a product and cascade remove its BOMs, BOM items,
    production costs, forecast scenarios, and associated customer commitments.
    """
    prod = db.query(Product).filter(Product.id == product_id, Product.business_id == tenant_id).first()
    if not prod:
        raise HTTPException(status_code=404, detail="Product not found")

    prod_name = prod.name
    prod_sku = prod.sku

    # 1. Clean up associated forecast scenarios
    db.query(ForecastScenario).filter(
        ForecastScenario.product_id == prod.id,
        ForecastScenario.business_id == tenant_id
    ).delete(synchronize_session=False)

    # 2. Clean up associated customer orders
    db.query(CustomerOrder).filter(
        CustomerOrder.product_id == prod.id,
        CustomerOrder.business_id == tenant_id
    ).delete(synchronize_session=False)

    # 3. Clean up associated BOM items and BOM records
    boms = db.query(BOM).filter(
        BOM.product_id == prod.id,
        BOM.business_id == tenant_id
    ).all()
    for b in boms:
        db.query(BOMItem).filter(BOMItem.bom_id == b.id).delete(synchronize_session=False)
        db.delete(b)

    # 4. Clean up production costs
    db.query(ProductionCost).filter(
        ProductionCost.product_id == prod.id,
        ProductionCost.business_id == tenant_id
    ).delete(synchronize_session=False)

    # 5. Delete product
    db.delete(prod)
    db.commit()

    return {
        "status": "success",
        "message": f"Product '{prod_name}' ({prod_sku}) and associated records deleted successfully",
        "product_id": product_id
    }

