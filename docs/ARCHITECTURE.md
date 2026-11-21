# MarginMind AI — System Architecture & Specification

## 1. High-Level Architecture Overview

MarginMind AI is a connected financial intelligence and decision-preparation platform for manufacturing enterprises. It transforms external economic and commodity volatility into internal operational awareness, long-term scenario projections, and human-in-the-loop decision dossiers.

```
       [ External Market Ingestion ]
      (World Bank, RBI, WPI, Policy)
                   │
                   ▼
     [ Event & Impact Engine ]
  (NLP Classification + Entity Match)
                   │
                   ▼
   [ Business Knowledge Graph Engine ]
  (Materials ↔ BOMs ↔ Products ↔ Orders)
                   │
                   ▼
  [ Deterministic Financial Engine ]
 (Full Costing, Margins, Inventory Val)
                   │
                   ▼
 [ Long-Term Forecasting & ML Engine ]
(0-3m, 3-12m, 1-3y, 3-5y / Favourable, Base, Stress)
                   │
                   ▼
   [ Intelligence Modules Trio ]
  ┌────────────────┬────────────────┬───────────────┐
  │  MarginGuard   │  SupplyShock   │   OrderSure   │
  │ (Margin Health)│(Supply Disruption) (Order Gatekeeper)
  └────────────────┴────────────────┴───────────────┘
                   │
                   ▼
     [ Decision Preparation Engine ]
    (Synthesises Evidence & Options)
                   │
                   ▼
    [ Human Approval & Audit Log ]
 (Approve / Edit / Reject / Recalculate)
```

---

## 2. Deterministic vs. Machine Learning Separation Principles

| Capability Domain | Engine Type | Methodologies & Implementation | Reasoning & Justification |
|-------------------|-------------|--------------------------------|---------------------------|
| **Costing & Margins** | Deterministic | Exact mathematical formulas (BOM sum, overhead absorption, markup) | Zero tolerance for LLM hallucination in financial ledger calculations. |
| **Inventory Valuation** | Deterministic | FIFO / Weighted Average Cost | Standard accounting rules require deterministic reproducibility. |
| **Order Economics** | Deterministic | Revenue minus variable & fixed cost allocation | Ensures contractual safety and precise profit margins. |
| **Document Parsing** | Hybrid (Rule + ML) | Regex/Heuristics + PyPDF/Tesseract + LLM JSON Schema | High recall across messy PDFs with structured confidence scoring. |
| **Anomaly Detection** | Machine Learning | Isolation Forest + IQR / Modified Z-Score | Detects non-linear price gouging and abnormal supplier inflation. |
| **Time-Series Forecast** | Machine Learning & Stats | Holt-Winters, ARIMA, Feature-Lagged XGBoost/GBDT | Models seasonality, lag dynamics, and macroeconomic indicators. |
| **Event Classification** | Machine Learning / NLP | Zero-shot NLP + TF-IDF Keyword Extraction | High-speed semantic tagging of news, tariffs, and disruptions. |
| **Decision Preparation** | Rule-Based + Evaluator | Multi-criteria scorecards + scenario constraint checking | Generates transparent, auditable business recommendations. |

---

## 3. Database Schema Design (PostgreSQL / SQLite Compatible)

### Core Schema Entities:
1. `users`: User identity, password hashes, email, assigned role, business association.
2. `businesses`: Multi-tenant companies, currency, industry type, created_at.
3. `industry_configs`: Industry-specific templates (Metal, Textile, Electronics, Food) with unit definitions, cost driver schemas, default indicators.
4. `materials`: Raw materials (Steel, Aluminium, Cotton, IC chips), unit of measure, standard cost, current market link.
5. `material_index_mappings`: Maps internal material to external benchmark, with formula multiplier and logistics basis points spread.
6. `suppliers`: Vendor records, contact, lead time (days), risk rating, reliability score.
7. `supplier_quotations`: Vendor quotes, MOQ, price per unit, validity dates, status.
8. `purchase_orders`: Internal POs, supplier, order date, delivery status.
9. `purchase_history`: Historical transactions, unit price paid, date, quantity.
10. `inventory`: Current on-hand quantity, reorder level, safety stock, weighted average cost.
11. `products`: Manufactured goods catalog, SKU, selling price, target margin %, active status.
12. `boms`: Bill of Materials header, version, status.
13. `bom_items`: Specific materials & quantities required per product unit, scrap percentage.
14. `production_costs`: Labour rate, machine overhead, energy cost per unit/hour.
15. `customer_orders`: Client orders, ordered product, quantity, contracted price, delivery due date, status.
16. `external_data_sources`: Source registry (World Bank, RBI, MoSPI) with reliability scores and URLs.
17. `market_observations`: Time-series observations for commodity indices, WPI, exchange rates, with demo/real flags.
18. `market_events`: News and policy announcements classified with severity, impacted entities, and confidence.
19. `forecast_scenarios`: Stored multi-horizon forecasts (0-3m, 3-12m, 1-3y, 3-5y) across Favourable, Base, Stress.
20. `prepared_decisions`: Evidence dossiers for price revisions, order decisions, supplier switches, viability actions.
21. `decision_approvals`: Human decisions recorded with editor diff, timestamp, comments, user ID.
22. `documents`: Uploaded invoices, quotes, BOMs with OCR extraction output and confidence score matrix.
23. `audit_logs`: Immutable security and data change log.

---

## 4. Multi-Tenant Architecture & RBAC

- Every operational table includes `business_id` (foreign key indexed).
- Fast API dependencies enforce:
  1. `get_current_user`: Decodes JWT, verifies user active.
  2. `get_current_tenant`: Scopes all database queries to `business_id`.
  3. `require_role(role)`: Validates user permissions:
     - `business_owner`: Full permissions, final approval on decisions.
     - `finance_manager`: Cost sheets, pricing models, margin guard, financial forecasts.
     - `procurement_manager`: Suppliers, quotations, purchase records, supply shock alerts.
     - `production_manager`: BOMs, inventory, manufacturing capacity, order feasibility.
