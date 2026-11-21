import enum
from datetime import datetime, timezone
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON, Enum
)
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class UserRoleEnum(str, enum.Enum):
    business_owner = "business_owner"
    finance_manager = "finance_manager"
    procurement_manager = "procurement_manager"
    production_manager = "production_manager"


class DocumentTypeEnum(str, enum.Enum):
    SUPPLIER_QUOTE = "SUPPLIER_QUOTE"
    PURCHASE_INVOICE = "PURCHASE_INVOICE"
    CUSTOMER_ORDER = "CUSTOMER_ORDER"
    BOM_SPEC = "BOM_SPEC"
    COST_SHEET = "COST_SHEET"
    PRODUCT_CATALOG = "PRODUCT_CATALOG"


class DocumentStatusEnum(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PROCESSING = "PROCESSING"
    EXTRACTED = "EXTRACTED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    CONFIRMED = "CONFIRMED"
    FAILED = "FAILED"


class OrderStatusEnum(str, enum.Enum):
    PENDING_REVIEW = "PENDING_REVIEW"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    IN_PRODUCTION = "IN_PRODUCTION"
    COMPLETED = "COMPLETED"


class DecisionStatusEnum(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RECALCULATION_REQUESTED = "RECALCULATION_REQUESTED"


class ForecastHorizonEnum(str, enum.Enum):
    MONTHS_0_3 = "0-3m"
    MONTHS_3_12 = "3-12m"
    YEARS_1_3 = "1-3y"
    YEARS_3_5 = "3-5y"


class ScenarioTypeEnum(str, enum.Enum):
    FAVOURABLE = "FAVOURABLE"
    BASE = "BASE"
    STRESS = "STRESS"


class Business(Base):
    __tablename__ = "businesses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, index=True, nullable=False)
    industry_type = Column(String(50), default="metal_steel", nullable=False)
    currency = Column(String(10), default="INR", nullable=False)
    address = Column(String(255), nullable=True)
    settings_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    users = relationship("User", back_populates="business", cascade="all, delete-orphan")
    materials = relationship("Material", back_populates="business", cascade="all, delete-orphan")
    products = relationship("Product", back_populates="business", cascade="all, delete-orphan")
    suppliers = relationship("Supplier", back_populates="business", cascade="all, delete-orphan")
    customer_orders = relationship("CustomerOrder", back_populates="business", cascade="all, delete-orphan")
    prepared_decisions = relationship("PreparedDecision", back_populates="business", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="business", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(String(50), default=UserRoleEnum.business_owner.value, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    business = relationship("Business", back_populates="users")
    approvals = relationship("DecisionApproval", back_populates="user")


class Material(Base):
    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    code = Column(String(50), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    unit = Column(String(50), default="kg", nullable=False)
    standard_cost = Column(Float, nullable=False, default=0.0)
    current_market_price = Column(Float, nullable=False, default=0.0)
    min_safety_stock = Column(Float, default=0.0)
    is_active = Column(Boolean, default=True)

    business = relationship("Business", back_populates="materials")
    bom_items = relationship("BOMItem", back_populates="material")
    quotations = relationship("SupplierQuotation", back_populates="material")
    inventory = relationship("Inventory", back_populates="material", uselist=False)
    index_mappings = relationship("MaterialIndexMapping", back_populates="material")


class MaterialIndexMapping(Base):
    __tablename__ = "material_index_mappings"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    indicator_code = Column(String(50), nullable=False, index=True)
    multiplier = Column(Float, default=1.0)
    basis_spread = Column(Float, default=0.0)
    freight_basis = Column(Float, default=0.0)
    notes = Column(String(255), nullable=True)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    material = relationship("Material", back_populates="index_mappings")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    code = Column(String(50), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    contact_email = Column(String(100), nullable=True)
    phone = Column(String(50), nullable=True)
    lead_time_days = Column(Integer, default=14)
    reliability_score = Column(Float, default=0.95)  # 0.0 to 1.0
    risk_rating = Column(String(20), default="LOW")  # LOW, MEDIUM, HIGH
    payment_terms = Column(String(100), default="Net 30")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    business = relationship("Business", back_populates="suppliers")
    quotations = relationship("SupplierQuotation", back_populates="supplier")
    purchases = relationship("PurchaseHistory", back_populates="supplier")


class SupplierQuotation(Base):
    __tablename__ = "supplier_quotations"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    quotation_ref = Column(String(100), nullable=True)
    quote_price = Column(Float, nullable=False)
    currency = Column(String(10), default="INR")
    min_order_qty = Column(Float, default=1.0)
    lead_time_days = Column(Integer, default=14)
    valid_from = Column(DateTime, nullable=False)
    valid_to = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)

    supplier = relationship("Supplier", back_populates="quotations")
    material = relationship("Material", back_populates="quotations")


class PurchaseHistory(Base):
    __tablename__ = "purchase_history"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False, index=True)
    purchase_date = Column(DateTime, nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    invoice_number = Column(String(100), nullable=True)

    supplier = relationship("Supplier", back_populates="purchases")
    material = relationship("Material")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), unique=True, nullable=False, index=True)
    current_stock = Column(Float, default=0.0, nullable=False)
    unit = Column(String(50), default="kg", nullable=False)
    weighted_average_cost = Column(Float, default=0.0, nullable=False)
    reorder_level = Column(Float, default=0.0)
    safety_stock = Column(Float, default=0.0)
    last_counted_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    material = relationship("Material", back_populates="inventory")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    code = Column(String(50), index=True, nullable=False)
    name = Column(String(255), nullable=False)
    sku = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)
    selling_price = Column(Float, nullable=False, default=0.0)
    target_margin_percent = Column(Float, default=25.0)
    critical_margin_threshold = Column(Float, default=15.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    business = relationship("Business", back_populates="products")
    boms = relationship("BOM", back_populates="product", cascade="all, delete-orphan")
    production_costs = relationship("ProductionCost", back_populates="product", uselist=False, cascade="all, delete-orphan")
    customer_orders = relationship("CustomerOrder", back_populates="product")


class BOM(Base):
    __tablename__ = "boms"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    version = Column(String(20), default="1.0", nullable=False)
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    product = relationship("Product", back_populates="boms")
    items = relationship("BOMItem", back_populates="bom", cascade="all, delete-orphan")


class BOMItem(Base):
    __tablename__ = "bom_items"

    id = Column(Integer, primary_key=True, index=True)
    bom_id = Column(Integer, ForeignKey("boms.id"), nullable=False, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String(50), default="kg", nullable=False)
    scrap_percent = Column(Float, default=0.0)
    process_stage = Column(String(100), nullable=True)

    bom = relationship("BOM", back_populates="items")
    material = relationship("Material", back_populates="bom_items")


class ProductionCost(Base):
    __tablename__ = "production_costs"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), unique=True, nullable=False, index=True)
    direct_labour_hours = Column(Float, default=1.0)
    labour_rate_hourly = Column(Float, default=300.0)
    machine_hours = Column(Float, default=1.0)
    machine_rate_hourly = Column(Float, default=600.0)
    energy_kwh = Column(Float, default=10.0)
    energy_rate_kwh = Column(Float, default=8.0)
    fixed_overhead_per_unit = Column(Float, default=150.0)
    packaging_freight_per_unit = Column(Float, default=50.0)

    product = relationship("Product", back_populates="production_costs")


class CustomerOrder(Base):
    __tablename__ = "customer_orders"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    order_number = Column(String(100), index=True, nullable=False)
    customer_name = Column(String(255), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    quantity = Column(Float, nullable=False)
    agreed_unit_price = Column(Float, nullable=False)
    order_date = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    promised_delivery_date = Column(DateTime, nullable=False)
    status = Column(String(50), default=OrderStatusEnum.PENDING_REVIEW.value)
    margin_guard_status = Column(String(50), default="NOT_EVALUATED")  # ATTRACTIVE, VERIFY, RISKY
    calculated_margin_percent = Column(Float, nullable=True)

    business = relationship("Business", back_populates="customer_orders")
    product = relationship("Product", back_populates="customer_orders")


class ExternalDataSource(Base):
    __tablename__ = "external_data_sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    code = Column(String(50), unique=True, index=True, nullable=False)
    source_url = Column(String(500), nullable=False)
    update_frequency = Column(String(50), default="Monthly")
    reliability_score = Column(Float, default=0.98)
    is_official = Column(Boolean, default=True)
    description = Column(Text, nullable=True)


class MarketObservation(Base):
    __tablename__ = "market_observations"

    id = Column(Integer, primary_key=True, index=True)
    indicator_code = Column(String(50), index=True, nullable=False)
    indicator_name = Column(String(255), nullable=False)
    observation_date = Column(DateTime, index=True, nullable=False)
    value = Column(Float, nullable=False)
    unit = Column(String(50), nullable=False)
    currency = Column(String(10), default="USD")
    source_id = Column(Integer, ForeignKey("external_data_sources.id"), nullable=True)
    is_synthetic = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class MarketEvent(Base):
    __tablename__ = "market_events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(300), nullable=False)
    summary = Column(Text, nullable=False)
    event_type = Column(String(50), default="COMMODITY_SPIKE")  # POLICY_TARIFF, COMMODITY_SPIKE, SUPPLY_DISRUPTION, CURRENCY_SHIFT
    severity = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    published_date = Column(DateTime, nullable=False)
    source_name = Column(String(200), nullable=False)
    source_url = Column(String(500), nullable=False)
    affected_materials_json = Column(JSON, default=list)  # ["Aluminium", "Steel"]
    affected_industries_json = Column(JSON, default=list)  # ["metal_steel"]
    confidence_score = Column(Float, default=0.90)
    is_verified = Column(Boolean, default=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ForecastScenario(Base):
    __tablename__ = "forecast_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True, index=True)
    material_id = Column(Integer, ForeignKey("materials.id"), nullable=True, index=True)
    indicator_code = Column(String(50), nullable=True)
    horizon = Column(String(20), nullable=False)  # 0-3m, 3-12m, 1-3y, 3-5y
    scenario_type = Column(String(20), nullable=False)  # FAVOURABLE, BASE, STRESS
    forecasted_value = Column(Float, nullable=False)
    unit = Column(String(50), default="INR/kg")
    confidence_lower = Column(Float, nullable=False)
    confidence_upper = Column(Float, nullable=False)
    assumptions_json = Column(JSON, default=dict)
    model_version = Column(String(50), default="hybrid_v1.0")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class PreparedDecision(Base):
    __tablename__ = "prepared_decisions"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    decision_type = Column(String(50), nullable=False)  # PRICE_ADJUSTMENT, ORDER_EVALUATION, SUPPLIER_SWITCH, PRODUCT_VIABILITY
    title = Column(String(255), nullable=False)
    summary = Column(Text, nullable=False)
    rationale = Column(Text, nullable=False)
    affected_entities_json = Column(JSON, default=dict)
    financial_impact_json = Column(JSON, default=dict)
    assumptions_json = Column(JSON, default=dict)
    confidence_level = Column(Float, default=0.88)
    risk_level = Column(String(20), default="MEDIUM")
    status = Column(String(50), default=DecisionStatusEnum.PENDING_APPROVAL.value)
    recommended_action_json = Column(JSON, default=dict)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    business = relationship("Business", back_populates="prepared_decisions")
    approvals = relationship("DecisionApproval", back_populates="decision", cascade="all, delete-orphan")


class DecisionApproval(Base):
    __tablename__ = "decision_approvals"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    decision_id = Column(Integer, ForeignKey("prepared_decisions.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    action_taken = Column(String(50), nullable=False)  # APPROVE, EDIT, REJECT, RECALCULATE
    original_payload_json = Column(JSON, default=dict)
    edited_payload_json = Column(JSON, default=dict)
    comments = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    decision = relationship("PreparedDecision", back_populates="approvals")
    user = relationship("User", back_populates="approvals")


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    document_type = Column(String(50), default=DocumentTypeEnum.SUPPLIER_QUOTE.value)
    file_size = Column(Integer, default=0)
    status = Column(String(50), default=DocumentStatusEnum.UPLOADED.value)
    extracted_data_json = Column(JSON, default=dict)
    confidence_scores_json = Column(JSON, default=dict)
    provenance_data_json = Column(JSON, default=dict)  # page, table loc, bbox
    error_message = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    business = relationship("Business", back_populates="documents")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    business_id = Column(Integer, ForeignKey("businesses.id"), nullable=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(100), nullable=False)
    entity_id = Column(Integer, nullable=True)
    change_summary = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc))
