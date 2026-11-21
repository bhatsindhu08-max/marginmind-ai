export type UserRole =
  | 'business_owner'
  | 'finance_manager'
  | 'procurement_manager'
  | 'production_manager';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  business_id: number;
  is_active: boolean;
}

export interface Business {
  id: number;
  name: string;
  slug: string;
  industry_type: string;
  currency: string;
  address?: string;
  settings_json?: Record<string, any>;
}

export interface Material {
  id: number;
  code: string;
  name: string;
  category: string;
  unit: string;
  standard_cost: number;
  current_market_price: number;
  min_safety_stock: number;
  is_active: boolean;
  index_mappings?: Array<{
    id: number;
    indicator_code: string;
    multiplier: number;
    basis_spread: number;
    freight_basis: number;
  }>;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  sku: string;
  category?: string;
  selling_price: number;
  target_margin_percent: number;
  critical_margin_threshold: number;
  is_active: boolean;
}

export interface ProductCostBreakdown {
  product_id: number;
  product_name: string;
  sku: string;
  selling_price: number;
  material_cost: number;
  labour_cost: number;
  machine_overhead: number;
  energy_cost: number;
  fixed_overhead: number;
  freight_packaging_cost: number;
  scrap_cost: number;
  total_cost: number;
  gross_profit: number;
  gross_margin_percent: number;
  target_margin_percent: number;
  critical_margin_threshold: number;
  margin_health: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  material_cost_share_percent: number;
}

export interface CustomerOrder {
  id: number;
  order_number: string;
  customer_name: string;
  product_id: number;
  quantity: number;
  agreed_unit_price: number;
  order_date: string;
  promised_delivery_date: string;
  status: string;
  margin_guard_status: 'ATTRACTIVE' | 'VERIFY' | 'RISKY';
  calculated_margin_percent?: number;
  product?: Product;
}

export interface PreparedDecision {
  id: number;
  decision_type: string;
  title: string;
  summary: string;
  rationale: string;
  affected_entities_json: Record<string, any>;
  financial_impact_json: Record<string, any>;
  assumptions_json: Record<string, any>;
  confidence_level: number;
  risk_level: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'APPROVED_WITH_EDITS' | 'REJECTED' | 'RECALCULATION_REQUESTED';
  recommended_action_json: Record<string, any>;
  created_at: string;
}

export interface DecisionApproval {
  approval_id: number;
  decision_id: number;
  decision_title: string;
  decision_type: string;
  action_taken: string;
  user_name: string;
  user_role: string;
  original_summary: string;
  edited_payload?: Record<string, any>;
  comments?: string;
  timestamp: string;
}

export interface MarketObservation {
  id: number;
  date: string;
  value: number;
  unit: string;
  currency: string;
  is_synthetic: boolean;
  indicator_name: string;
  source: string;
}

export interface MarketEvent {
  id: number;
  title: string;
  summary: string;
  event_type: string;
  severity: string;
  published_date: string;
  source_name: string;
  source_url: string;
  affected_materials: string[];
  affected_industries: string[];
  confidence_score: number;
  is_verified: boolean;
}
