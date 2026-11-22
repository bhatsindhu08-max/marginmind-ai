import math
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from backend.app.models import Business, Product, Material, BOM, BOMItem, ProductionCost, Inventory, CustomerOrder


class OrderViabilityService:
    """
    Core Order Viability & Keep/Drop Advisory Service.
    Answers four fundamental business questions for SME & enterprise manufacturing owners:
    1. Is this order profitable right now?
    2. How much cash do I have vs how much cash must I spend upfront (Rent, Raw Material, Labour, Supply, Energy)?
    3. How long will it take to produce (Time/Capacity feasibility)?
    4. In the long run, should I keep this order if raw material prices increase in the future?
    """

    def __init__(self, db: Session, business_id: int):
        self.db = db
        self.business_id = business_id
        self.biz = self.db.query(Business).filter(Business.id == self.business_id).first()
        self.currency = self.biz.currency if self.biz and self.biz.currency else "INR"
        self.settings = self.biz.settings_json or {} if self.biz else {}

    def get_working_capital(self) -> float:
        return float(self.settings.get("working_capital_reserves", 500000.0))

    def get_plant_opex(self) -> Dict[str, float]:
        opex = self.settings.get("plant_opex", {})
        return {
            "monthly_rent": float(opex.get("monthly_rent", 120000.0)),
            "monthly_water_bill": float(opex.get("monthly_water_bill", 18000.0)),
            "monthly_electricity_bill": float(opex.get("monthly_electricity_bill", 75000.0)),
            "monthly_maintenance_admin": float(opex.get("monthly_maintenance_admin", 45000.0)),
            "monthly_production_units": max(float(opex.get("monthly_production_units", 8000.0)), 1.0),
        }

    def evaluate_order(
        self,
        product_id: Optional[int] = None,
        item_name: Optional[str] = None,
        order_quantity: float = 100.0,
        agreed_unit_price: Optional[float] = None,
        promised_delivery_days: int = 30,
        available_cash: Optional[float] = None,
        future_price_shock_pct: float = 0.0,
        custom_material_cost_per_unit: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes comprehensive financial viability, cashflow coverage, and inflation shock evaluation.
        """
        qty = max(float(order_quantity), 1.0)
        delivery_days = max(int(promised_delivery_days), 1)
        future_shock = max(float(future_price_shock_pct), 0.0)

        # 1. Resolve Product & BOM
        product = None
        if product_id:
            product = self.db.query(Product).filter(
                Product.id == product_id, Product.business_id == self.business_id
            ).first()

        if not product and item_name:
            # Fuzzy match item name against existing products
            term = item_name.strip().lower()
            product = self.db.query(Product).filter(
                Product.business_id == self.business_id,
                Product.name.ilike(f"%{term}%")
            ).first()

        if not product:
            # Fallback to first available active product for this tenant
            product = self.db.query(Product).filter(
                Product.business_id == self.business_id
            ).first()

        # Target selling price
        if agreed_unit_price is not None and float(agreed_unit_price) > 0:
            unit_price = float(agreed_unit_price)
        elif product:
            unit_price = float(product.selling_price)
        else:
            unit_price = 500.0

        # Plant OPEX parameters
        opex = self.get_plant_opex()
        monthly_units = opex["monthly_production_units"]
        rent_per_unit = opex["monthly_rent"] / monthly_units
        admin_overhead_per_unit = opex["monthly_maintenance_admin"] / monthly_units
        utility_per_unit = (opex["monthly_electricity_bill"] + opex["monthly_water_bill"]) / monthly_units

        # 2. Compute Raw Material Costs
        bom_items_detail = []
        base_material_cost_per_unit = 0.0

        if product:
            active_bom = self.db.query(BOM).filter(
                BOM.product_id == product.id, BOM.is_active == True
            ).first()

            if active_bom:
                bom_items = self.db.query(BOMItem).filter(BOMItem.bom_id == active_bom.id).all()
                for bi in bom_items:
                    mat = self.db.query(Material).filter(Material.id == bi.material_id).first()
                    if not mat:
                        continue
                    m_price = mat.current_market_price if mat.current_market_price and mat.current_market_price > 0 else mat.standard_cost
                    m_qty_needed = bi.quantity * (1.0 + (bi.scrap_percent / 100.0))
                    line_mat_cost = m_qty_needed * m_price
                    base_material_cost_per_unit += line_mat_cost

                    bom_items_detail.append({
                        "material_name": mat.name,
                        "unit": bi.unit,
                        "required_per_product": round(m_qty_needed, 3),
                        "total_required_order": round(m_qty_needed * qty, 2),
                        "unit_price": round(m_price, 2),
                        "line_cost_per_product": round(line_mat_cost, 2),
                        "line_cost_total_order": round(line_mat_cost * qty, 2)
                    })

        if base_material_cost_per_unit <= 0.0:
            if custom_material_cost_per_unit and custom_material_cost_per_unit > 0:
                base_material_cost_per_unit = float(custom_material_cost_per_unit)
            else:
                base_material_cost_per_unit = unit_price * 0.45

        # Apply future material price shock
        shocked_material_cost_per_unit = base_material_cost_per_unit * (1.0 + (future_shock / 100.0))
        total_raw_material_spend_baseline = base_material_cost_per_unit * qty
        total_raw_material_spend_shocked = shocked_material_cost_per_unit * qty

        # 3. Compute Direct Labour Costs
        labour_cost_per_unit = 0.0
        daily_output = 100.0

        prod_costs = None
        if product:
            prod_costs = self.db.query(ProductionCost).filter(ProductionCost.product_id == product.id).first()

        if prod_costs:
            w_count = int(getattr(prod_costs, 'worker_count', 0) or 0)
            daily_wage = float(getattr(prod_costs, 'wage_per_worker_daily', 0.0) or 0.0)
            d_output = float(getattr(prod_costs, 'daily_output_units', 0.0) or 0.0)

            if w_count > 0 and d_output > 0 and daily_wage > 0:
                labour_cost_per_unit = (w_count * daily_wage) / d_output
                daily_output = d_output
            else:
                hrs = float(prod_costs.direct_labour_hours or 1.0)
                rate = float(prod_costs.labour_rate_hourly or 250.0)
                labour_cost_per_unit = hrs * rate
                daily_output = max(8.0 / max(hrs, 0.1) * 10, 20.0)
        else:
            labour_cost_per_unit = unit_price * 0.18
            daily_output = 150.0

        total_labour_spend = labour_cost_per_unit * qty

        # 4. Compute Rent & Factory Overhead Allocation
        total_rent_spend = rent_per_unit * qty
        total_admin_overhead_spend = admin_overhead_per_unit * qty
        total_factory_overhead_spend = total_rent_spend + total_admin_overhead_spend
        overhead_per_unit = rent_per_unit + admin_overhead_per_unit

        # 5. Compute Supply, Logistics, Energy & Consumables
        energy_per_unit = 0.0
        packaging_freight_per_unit = 0.0
        jobwork_consumables_per_unit = 0.0

        if prod_costs:
            energy_per_unit = (float(prod_costs.energy_kwh or 0) * float(prod_costs.energy_rate_kwh or 0)) + \
                              (float(prod_costs.machine_hours or 0) * float(prod_costs.machine_rate_hourly or 0))
            packaging_freight_per_unit = float(prod_costs.packaging_freight_per_unit or 0)
            jobwork_consumables_per_unit = float(getattr(prod_costs, 'processing_jobwork_cost_per_unit', 0) or 0) + \
                                           float(getattr(prod_costs, 'inspection_qc_cost_per_unit', 0) or 0) + \
                                           float(getattr(prod_costs, 'consumables_cost_per_unit', 0) or 0) + \
                                           float(getattr(prod_costs, 'boiler_steam_fuel_per_unit', 0) or 0)

        supply_utilities_per_unit = utility_per_unit + energy_per_unit + packaging_freight_per_unit + jobwork_consumables_per_unit
        if supply_utilities_per_unit <= 0.0:
            supply_utilities_per_unit = unit_price * 0.10

        total_supply_utilities_spend = supply_utilities_per_unit * qty

        # 6. Total Spend Required (Cash Outflow)
        total_spend_baseline = total_raw_material_spend_baseline + total_labour_spend + total_rent_spend + total_admin_overhead_spend + total_supply_utilities_spend
        unit_cost_baseline = total_spend_baseline / qty

        total_spend_shocked = total_raw_material_spend_shocked + total_labour_spend + total_rent_spend + total_admin_overhead_spend + total_supply_utilities_spend
        unit_cost_shocked = total_spend_shocked / qty

        # 7. Production Time & Lead Time Feasibility
        days_to_produce = math.ceil(qty / max(daily_output, 1.0))
        days_buffer = delivery_days - days_to_produce
        is_timeline_feasible = delivery_days >= days_to_produce

        # 8. Revenue & Profitability
        total_revenue = unit_price * qty
        net_profit_baseline = total_revenue - total_spend_baseline
        margin_pct_baseline = (net_profit_baseline / total_revenue * 100.0) if total_revenue > 0 else 0.0

        net_profit_shocked = total_revenue - total_spend_shocked
        margin_pct_shocked = (net_profit_shocked / total_revenue * 100.0) if total_revenue > 0 else 0.0

        # 9. Cash Affordability & Runway Check
        user_cash = available_cash if available_cash is not None else self.get_working_capital()
        cash_balance_after_spend = user_cash - total_spend_shocked
        cash_coverage_pct = (user_cash / total_spend_shocked * 100.0) if total_spend_shocked > 0 else 100.0
        can_afford_cash = user_cash >= total_spend_shocked
        cash_shortfall = max(0.0, total_spend_shocked - user_cash)
        recommended_advance_pct = min(100, math.ceil((cash_shortfall / total_revenue * 100.0) / 5.0) * 5) if total_revenue > 0 and cash_shortfall > 0 else 0

        # 10. Breakeven Future Material Price Spike (Tipping Point)
        # At what % increase in raw material does profit hit exactly 0?
        if total_raw_material_spend_baseline > 0:
            breakeven_material_spike_pct = round((net_profit_baseline / total_raw_material_spend_baseline) * 100.0, 1)
        else:
            breakeven_material_spike_pct = 999.0

        # Scenario Matrix for Quick Future Sensitivity Inspection
        scenario_shocks = [0, 10, 20, 30]
        future_scenarios = []
        for s in scenario_shocks:
            s_mat_cost = total_raw_material_spend_baseline * (1.0 + s / 100.0)
            s_total_cost = s_mat_cost + total_labour_spend + total_rent_spend + total_admin_overhead_spend + total_supply_utilities_spend
            s_profit = total_revenue - s_total_cost
            s_margin = (s_profit / total_revenue * 100.0) if total_revenue > 0 else 0.0
            future_scenarios.append({
                "shock_pct": s,
                "label": f"+{s}% Material Inflation" if s > 0 else "Current Prices (0%)",
                "material_cost": round(s_mat_cost, 2),
                "total_spend": round(s_total_cost, 2),
                "net_profit": round(s_profit, 2),
                "margin_percent": round(s_margin, 1),
                "is_profitable": s_profit > 0
            })

        # 11. Clear Executive Recommendation: Should I Keep That Order?
        if margin_pct_shocked < 0.0:
            decision_action = "DROP_ORDER"
            decision_badge = "DROP ORDER (LOSS-MAKING)"
            decision_title = "Cancel or Drop This Order Immediately"
            decision_color = "red"
            decision_advice = (
                f"This order produces a net loss of {self.currency} {abs(net_profit_shocked):,.0f} "
                f"({margin_pct_shocked:.1f}% margin). Every unit manufactured loses {self.currency} {abs(net_profit_shocked)/qty:,.2f} "
                f"after paying for raw materials, workers, rent, and power. Drop this order or re-quote at least "
                f"{self.currency} {unit_cost_shocked * 1.25:,.2f}/unit."
            )
        elif future_shock >= breakeven_material_spike_pct or breakeven_material_spike_pct < 10.0:
            decision_action = "RENEGOTIATE_PRICE"
            decision_badge = "RENEGOTIATE OR ADD ESCALATION CLAUSE"
            decision_title = "High Risk of Margin Wipeout — Renegotiate Price"
            decision_color = "amber"
            decision_advice = (
                f"A small material price increase (+{breakeven_material_spike_pct:.1f}%) will completely wipe out your profit. "
                f"If you keep this order, insist on an escalation clause with the customer or request a price increase of "
                f"{self.currency} {max(1.0, (unit_cost_shocked * 1.20) - unit_price):,.2f}/unit to protect your factory against inflation."
            )
        elif breakeven_material_spike_pct < 22.0 or margin_pct_shocked < 15.0:
            decision_action = "KEEP_BUT_LOCK_SUPPLIER"
            decision_badge = "KEEP BUT LOCK SUPPLIER RATES NOW"
            decision_title = "Profitable Now — Lock Raw Material Rates Immediately"
            decision_color = "cyan"
            decision_advice = (
                f"This order is profitable ({margin_pct_shocked:.1f}% net margin, profit of {self.currency} {net_profit_shocked:,.0f}), "
                f"but your margin buffer is modest. To safeguard your profits from rising commodity prices, "
                f"issue purchase orders to lock supplier raw material rates right now."
            )
        else:
            decision_action = "KEEP_ORDER"
            decision_badge = "KEEP ORDER (SAFE & HIGHLY PROFITABLE)"
            decision_title = "Keep This Order — Strong Financial Buffer"
            decision_color = "emerald"
            decision_advice = (
                f"Strong financial margin ({margin_pct_shocked:.1f}% net margin, profit of {self.currency} {net_profit_shocked:,.0f}). "
                f"Your order can withstand raw material price increases up to +{breakeven_material_spike_pct:.1f}% before losing money. "
                f"Safe to proceed and confirm into production."
            )

        # Cash affordability message
        if can_afford_cash:
            cash_verdict = "SAFE_CASHFLOW"
            cash_advice = f"You have {self.currency} {user_cash:,.0f} in reserves, which comfortably covers the {self.currency} {total_spend_shocked:,.0f} upfront spend required. Remaining reserve buffer: {self.currency} {cash_balance_after_spend:,.0f}."
        else:
            cash_verdict = "CASH_SHORTFALL"
            cash_advice = (
                f"Upfront cash requirement ({self.currency} {total_spend_shocked:,.0f}) exceeds your available reserves "
                f"({self.currency} {user_cash:,.0f}) by {self.currency} {cash_shortfall:,.0f}. "
                f"To fulfill this without cash crunch, collect a {recommended_advance_pct}% advance payment ({self.currency} {total_revenue * (recommended_advance_pct/100.0):,.0f}) from the customer or arrange 30-day supplier credit."
            )

        # Time feasibility message
        if is_timeline_feasible:
            time_advice = f"Feasible: Factory will produce {qty:,.0f} units in {days_to_produce} working days ({daily_output:,.0f} units/day). Leaves a {days_buffer}-day safety buffer before promised delivery."
        else:
            time_advice = f"Timeline Warning: At current capacity ({daily_output:,.0f} units/day), production takes {days_to_produce} days, but customer requested delivery in {delivery_days} days. Extra shifts or outsourcing required."

        return {
            "product_id": product.id if product else None,
            "product_name": product.name if product else (item_name or "Custom Order Item"),
            "sku": product.sku if product else "SKU-CUSTOM",
            "currency": self.currency,
            "order_quantity": qty,
            "agreed_unit_price": round(unit_price, 2),
            "total_revenue": round(total_revenue, 2),

            # The 5 Core Spend Categories
            "spend_breakdown": {
                "raw_material": {
                    "total": round(total_raw_material_spend_shocked, 2),
                    "per_unit": round(shocked_material_cost_per_unit, 2),
                    "baseline_total": round(total_raw_material_spend_baseline, 2),
                    "percent_of_spend": round((total_raw_material_spend_shocked / total_spend_shocked * 100.0) if total_spend_shocked > 0 else 0.0, 1),
                    "items": bom_items_detail
                },
                "direct_labour": {
                    "total": round(total_labour_spend, 2),
                    "per_unit": round(labour_cost_per_unit, 2),
                    "percent_of_spend": round((total_labour_spend / total_spend_shocked * 100.0) if total_spend_shocked > 0 else 0.0, 1),
                    "daily_output_units": daily_output
                },
                "rent_and_overhead": {
                    "total": round(total_factory_overhead_spend, 2),
                    "rent_portion": round(total_rent_spend, 2),
                    "admin_portion": round(total_admin_overhead_spend, 2),
                    "per_unit": round(overhead_per_unit, 2),
                    "percent_of_spend": round((total_factory_overhead_spend / total_spend_shocked * 100.0) if total_spend_shocked > 0 else 0.0, 1)
                },
                "supply_and_energy": {
                    "total": round(total_supply_utilities_spend, 2),
                    "per_unit": round(supply_utilities_per_unit, 2),
                    "percent_of_spend": round((total_supply_utilities_spend / total_spend_shocked * 100.0) if total_spend_shocked > 0 else 0.0, 1)
                },
                "total_spend_required": round(total_spend_shocked, 2),
                "unit_cost_required": round(unit_cost_shocked, 2),
                "total_spend_baseline": round(total_spend_baseline, 2),
                "unit_cost_baseline": round(unit_cost_baseline, 2)
            },

            # Profitability Summary
            "profitability": {
                "net_profit": round(net_profit_shocked, 2),
                "margin_percent": round(margin_pct_shocked, 1),
                "net_profit_baseline": round(net_profit_baseline, 2),
                "margin_percent_baseline": round(margin_pct_baseline, 1),
                "is_profitable": net_profit_shocked > 0
            },

            # Money I Have vs Money I Must Spend
            "cash_affordability": {
                "available_cash": round(user_cash, 2),
                "spend_required": round(total_spend_shocked, 2),
                "cash_balance_after_spend": round(cash_balance_after_spend, 2),
                "cash_coverage_percent": cash_coverage_pct,
                "can_afford": can_afford_cash,
                "cash_shortfall": round(cash_shortfall, 2),
                "recommended_advance_pct": recommended_advance_pct,
                "verdict": cash_verdict,
                "advice": cash_advice
            },

            # Time & Capacity
            "production_time": {
                "order_quantity": qty,
                "daily_capacity_units": daily_output,
                "days_to_produce": days_to_produce,
                "promised_delivery_days": delivery_days,
                "days_buffer": days_buffer,
                "is_feasible": is_timeline_feasible,
                "advice": time_advice
            },

            # Future Price Sensitivity ("Should I Keep It?")
            "future_price_risk": {
                "current_shock_pct": future_shock,
                "breakeven_material_spike_pct": breakeven_material_spike_pct,
                "breakeven_warning": f"Order turns loss-making if raw material prices rise above +{breakeven_material_spike_pct:.1f}%",
                "future_scenarios": future_scenarios
            },

            # The Ultimate Keep / Drop Recommendation
            "advisory": {
                "action": decision_action,
                "badge": decision_badge,
                "title": decision_title,
                "color": decision_color,
                "advice": decision_advice
            }
        }

    def evaluate_from_document_records(
        self,
        records: List[Dict[str, Any]],
        available_cash: Optional[float] = None,
        future_price_shock_pct: float = 0.0
    ) -> Dict[str, Any]:
        """
        Takes extracted records from DocumentIntelligenceParser and produces a direct viability evaluation.
        """
        if not records:
            return self.evaluate_order(
                order_quantity=100.0,
                available_cash=available_cash,
                future_price_shock_pct=future_price_shock_pct
            )

        rec = records[0]
        mat_name = rec.get("material_name") or rec.get("raw_material_name") or "Extracted Document Item"
        qty = float(rec.get("quantity") or 100.0)
        price = float(rec.get("unit_price") or 500.0)

        # Check if this document represents a customer order or a material quotation
        # If it's a material quotation, selling price is typically derived by applying target markup
        # If it's a customer order, price is the agreed customer price
        return self.evaluate_order(
            item_name=mat_name,
            order_quantity=qty,
            agreed_unit_price=price,
            available_cash=available_cash,
            future_price_shock_pct=future_price_shock_pct,
            custom_material_cost_per_unit=price * 0.65 if price > 0 else None
        )

