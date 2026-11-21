# MarginMind AI — System Limitations, External Data Boundaries & Engineering Roadmap

## 1. External Market Intelligence Boundaries & Fallback Architecture

### 1.1 Data Source Reliability & Live Access Policies
MarginMind AI monitors four macroeconomic and commodity data pipelines:
1. **World Bank Commodity Price Data (Pink Sheet):** Official monthly global commodity benchmarks (LME Aluminium, Iron Ore, Brent Crude, Copper).
2. **Ministry of Commerce & Industry (WPI):** Wholesale Price Index for Basic Metals, Fuel & Power, and Manufactured Products.
3. **Reserve Bank of India (DBIE):** Reference exchange rates (USD/INR, EUR/INR) and monetary policy rates.
4. **CBIC Official Gazette Notifications:** Statutory customs tariffs, basic customs duty (BCD), and anti-dumping duties.

### 1.2 Graceful Degradation & Demonstration Mode
- When running in an environment without internet access or during upstream portal maintenance, MarginMind AI **never invents live prices or masks synthetic data as real**.
- Every market observation is explicitly tagged with `is_synthetic: bool`, `source_name`, `publication_date`, `reliability_score`, and `extraction_timestamp`.
- The platform ships with a pre-seeded, verified 24-month historical series for Indian and global metal indices covering January 2024 through December 2025.

---

## 2. Deterministic vs. Probabilistic Architecture Guarantees

### 2.1 The Cardinal Financial Rule
> **"Zero LLM Arithmetic in Financial Calculations."**

In MarginMind AI, all product costing, bill-of-materials rollups, inventory weighted average cost (WAC), gross margin calculations, price elasticity response, and break-even units are computed deterministically in Python (`backend/app/services/financial_engine.py`):
- Unit gross profit is strictly $P - C_{total}$.
- Gross margin percentage is strictly $\frac{P - C_{total}}{P} \times 100$.
- Scrap allowances are accounted for as $\text{Gross Qty} = \frac{\text{Net Qty}}{1 - \text{Scrap Rate}}$.
- Break-even units are $\frac{\text{Total Fixed Overhead}}{P - \text{Unit Variable Cost}}$.

### 2.2 Role of Machine Learning & AI
Machine learning is strictly quarantined to tasks where probabilistic reasoning is appropriate:
1. **Document Intelligence & OCR:** Multi-page parsing, table extraction, and entity fuzzy-matching.
2. **Anomaly Detection:** Modified Z-score (Median Absolute Deviation) and Isolation Forest for detecting unusual supplier quotations or sudden procurement cost spikes.
3. **Time-Series Horizon Forecasting:** Scenario fan generation (Favourable, Base, Stress) using Exponential Smoothing, Ridge regression, and historical drift factors with time-based backtesting (MAE, RMSE, MAPE).
4. **Epistemic Classification:** Classifying external news events into Fact, Signal, Model Projection, or AI Interpretation.

---

## 3. Human-in-the-Loop Decision Governance

### 3.1 Non-Autonomous Execution Principle
MarginMind AI prepares, analyzes, and drafts decisions, but **never executes binding external actions autonomously**:
- Price increases are never published to ERP/CRM without human approval.
- Customer orders are never automatically rejected or accepted.
- Supplier purchase orders are never automatically placed.

### 3.2 Immutable Audit Trail
Every action taken on a prepared decision (Approve, Edit & Approve, Reject, Recalculate) is logged with:
- Timestamp (UTC).
- User ID and role.
- Before/after values.
- Explicit business justification provided by the human approver.
- Read-only audit log preventing retrospective tampering.

---

## 4. Enterprise ERP Integration Roadmap

While MarginMind AI includes native document intelligence (CSV, Excel, PDF parsing) and manual entry, enterprise deployments typically interface with existing ERP and MRP systems:

| ERP System | Planned Integration Protocol | Data Ingestion Scope |
| :--- | :--- | :--- |
| **SAP S/4HANA** | OData v4 APIs / RFC BAPIs | Material Master (`MARA`), BOM (`MAST`/`STPO`), Purchasing Info Records (`EINA`), Sales Orders (`VBAK`) |
| **TallyPrime** | XML / JSON HTTP Server Interface | Ledger Balances, Stock Items, Purchase Vouchers, Sales Quotations |
| **Microsoft Dynamics 365** | Dataverse Web API | Products, Released Products, Purchase Orders, Vendor Catalogs |
| **Oracle NetSuite** | SuiteTalk REST Web Services | Items, Assembly Items, Purchase Orders, Sales Invoices |

---

## 5. Future Engineering Enhancements

1. **Distributed Event Streaming:** Migrate scheduled batch polling to Apache Kafka / Redpanda for millisecond-latency market shock ingestion.
2. **Multi-Echelon Supply Network Simulation:** Extend single-tier supplier risk modeling to Tier-2 and Tier-3 sub-tier component suppliers.
3. **Automated Supplier Renegotiation Drafts:** Auto-generate structured supplier renegotiation emails backed by market index evidence and quotation history.
4. **Carbon Border Adjustment Mechanism (CBAM) Accounting:** Calculate embodied carbon emissions per ton of steel/aluminium and estimate export tariff liability under EU CBAM regulations.
