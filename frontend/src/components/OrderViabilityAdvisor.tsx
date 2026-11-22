import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  Clock,
  Layers,
  ShieldAlert,
  ShieldCheck,
  FileText,
  Upload,
  Sliders,
  ArrowRight,
  Sparkles,
  HelpCircle,
  RefreshCw,
  Building,
  UserCheck,
  Zap,
  Info
} from 'lucide-react';

interface OrderViabilityAdvisorProps {
  initialDocumentData?: any;
  onOrderAccepted?: () => void;
  className?: string;
}

export const OrderViabilityAdvisor: React.FC<OrderViabilityAdvisorProps> = ({
  initialDocumentData,
  onOrderAccepted,
  className = '',
}) => {
  const { industryType } = useAuth();
  const currency = '₹';
  const [products, setProducts] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'interactive' | 'document'>(
    initialDocumentData ? 'document' : 'interactive'
  );

  // Evaluation Parameters
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [itemName, setItemName] = useState<string>('');
  const [orderQuantity, setOrderQuantity] = useState<number>(100);
  const [unitPrice, setUnitPrice] = useState<number>(4200);
  const [deliveryDays, setDeliveryDays] = useState<number>(30);
  const [availableCash, setAvailableCash] = useState<number>(500000);
  const [isEditingCash, setIsEditingCash] = useState<boolean>(false);
  const [tempCashInput, setTempCashInput] = useState<string>('500000');
  const [futurePriceShockPct, setFuturePriceShockPct] = useState<number>(0);

  // State
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploadingDoc, setUploadingDoc] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProductsAndInitialData();
  }, []);

  const loadProductsAndInitialData = async () => {
    try {
      const [prods, opex] = await Promise.all([
        apiRequest<any[]>('/products').catch(() => []),
        apiRequest<any>('/business/opex').catch(() => null),
      ]);

      setProducts(prods || []);
      const defaultCash = opex?.working_capital_reserves || 500000;
      setAvailableCash(defaultCash);
      setTempCashInput(String(defaultCash));

      if (initialDocumentData) {
        setEvaluation(initialDocumentData);
      } else if (prods && prods.length > 0) {
        const firstProd = prods[0];
        setSelectedProductId(firstProd.id);
        setItemName(firstProd.name);
        setUnitPrice(firstProd.selling_price || 4200);
        runEvaluation({
          productId: firstProd.id,
          qty: 100,
          price: firstProd.selling_price || 4200,
          days: 30,
          cash: defaultCash,
          shock: 0,
        });
      }
    } catch (err) {
      console.error('Failed to initialize OrderViabilityAdvisor:', err);
    }
  };

  const runEvaluation = async (params: {
    productId?: number | null;
    name?: string;
    qty: number;
    price: number;
    days: number;
    cash: number;
    shock: number;
  }) => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        quantity: String(params.qty),
        agreed_price: String(params.price),
        delivery_days: String(params.days),
        available_cash: String(params.cash),
        future_price_shock_pct: String(params.shock),
      });

      if (params.productId) queryParams.append('product_id', String(params.productId));
      if (params.name) queryParams.append('item_name', params.name);

      const res = await apiRequest<any>(`/ordersure/deep-viability?${queryParams.toString()}`);
      setEvaluation(res);
    } catch (err) {
      console.error('Failed to run viability evaluation:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (pId: number) => {
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setItemName(prod.name);
      setUnitPrice(prod.selling_price || 4200);
      runEvaluation({
        productId: pId,
        name: prod.name,
        qty: orderQuantity,
        price: prod.selling_price || 4200,
        days: deliveryDays,
        cash: availableCash,
        shock: futurePriceShockPct,
      });
    }
  };

  const handleFormChange = (field: string, val: any) => {
    let newQty = orderQuantity;
    let newPrice = unitPrice;
    let newDays = deliveryDays;
    let newShock = futurePriceShockPct;

    if (field === 'qty') {
      newQty = Number(val) || 1;
      setOrderQuantity(newQty);
    }
    if (field === 'price') {
      newPrice = Number(val) || 0;
      setUnitPrice(newPrice);
    }
    if (field === 'days') {
      newDays = Number(val) || 1;
      setDeliveryDays(newDays);
    }
    if (field === 'shock') {
      newShock = Number(val) || 0;
      setFuturePriceShockPct(newShock);
    }

    runEvaluation({
      productId: selectedProductId,
      name: itemName,
      qty: newQty,
      price: newPrice,
      days: newDays,
      cash: availableCash,
      shock: newShock,
    });
  };

  const handleSaveWorkingCapital = async () => {
    const val = Number(tempCashInput) || 0;
    setAvailableCash(val);
    setIsEditingCash(false);
    try {
      await apiRequest('/business/opex', {
        method: 'PUT',
        body: JSON.stringify({ working_capital_reserves: val }),
      });
      runEvaluation({
        productId: selectedProductId,
        name: itemName,
        qty: orderQuantity,
        price: unitPrice,
        days: deliveryDays,
        cash: val,
        shock: futurePriceShockPct,
      });
    } catch (e) {
      console.error('Failed to persist working capital:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingDoc(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'CUSTOMER_ORDER');

      const uploadedDoc = await apiRequest<any>('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      // Viability is automatically calculated and attached by the backend
      const viability = uploadedDoc?.extracted_data_json?.viability;
      if (viability) {
        setEvaluation(viability);
        setActiveTab('document');
        if (viability.product_id) setSelectedProductId(viability.product_id);
        if (viability.order_quantity) setOrderQuantity(viability.order_quantity);
        if (viability.agreed_unit_price) setUnitPrice(viability.agreed_unit_price);
        if (viability.product_name) setItemName(viability.product_name);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert('Document analysis failed: ' + err.message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleCreateOrder = async () => {
    if (!evaluation) return;
    try {
      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          order_number: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          customer_name: 'Verified Customer Order',
          product_id: selectedProductId || products[0]?.id || 1,
          quantity: orderQuantity,
          agreed_unit_price: unitPrice,
          promised_delivery_date: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });
      alert(`Order successfully accepted and registered into production schedule!`);
      if (onOrderAccepted) onOrderAccepted();
    } catch (err: any) {
      alert('Failed to register order: ' + err.message);
    }
  };

  const handleSendToDecisionCentre = async () => {
    if (!evaluation) return;
    try {
      await apiRequest('/decisions/propose', {
        method: 'POST',
        body: JSON.stringify({
          decision_type: 'PRICE_ADJUSTMENT',
          title: `Order Price Revision: ${evaluation.product_name || itemName}`,
          summary: `Order evaluation indicates a required price revision to protect against material inflation.`,
          rationale: evaluation.advisory?.advice || 'Order margin protection review.',
          financial_impact_json: {
            order_quantity: orderQuantity,
            current_unit_price: unitPrice,
            recommended_unit_price: Math.round(evaluation.spend_breakdown?.unit_cost_required * 1.25 || unitPrice * 1.15),
            total_revenue: evaluation.total_revenue,
            net_profit: evaluation.profitability?.net_profit,
          },
        }),
      });
      alert(`Price adjustment proposal created in Decision Centre!`);
    } catch (err: any) {
      alert('Failed to submit to Decision Centre: ' + err.message);
    }
  };

  const adv = evaluation?.advisory || {};
  const isLossMaking = adv.action === 'DROP_ORDER';
  const isRenegotiate = adv.action === 'RENEGOTIATE_PRICE';
  const isLockSupplier = adv.action === 'KEEP_BUT_LOCK_SUPPLIER';
  const isKeepSafe = adv.action === 'KEEP_ORDER';

  const badgeBg = isLossMaking
    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
    : isRenegotiate
    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
    : isLockSupplier
    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800';

  return (
    <div className={`glass-panel-elevated rounded-2xl p-6 sm:p-7 border border-slate-800/90 shadow-xl relative overflow-hidden ${className}`}>
      {/* Background ambient gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOP HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-800/90 gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-glow-emerald animate-pulse" />
            <h2 className="text-lg sm:text-xl font-bold text-slate-100 tracking-tight font-sans">
              Instant Order & Document Profitability Evaluator
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800/70 font-mono font-semibold">
              CORE TOOL
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Drop any document or enter order details to immediately see if it makes money, how much you have to spend on rent, raw materials, labour, supply & time, and whether rising prices mean you should keep or drop it.
          </p>
        </div>

        {/* INPUT TABS */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-center">
          <button
            onClick={() => setActiveTab('interactive')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'interactive'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive Order</span>
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 ${
              activeTab === 'document'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Drop Document</span>
          </button>
        </div>
      </div>

      {/* INPUT CONTROLS SECTION */}
      {activeTab === 'interactive' ? (
        <div className="pt-5 pb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b border-slate-800/80">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Select Product / Item
            </label>
            <select
              value={selectedProductId || ''}
              onChange={(e) => handleProductSelect(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-500 shadow-inner"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({currency} {p.selling_price})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Order Quantity
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={orderQuantity}
                onChange={(e) => handleFormChange('qty', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-500 font-mono shadow-inner"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-mono">Units</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Agreed Selling Price ({currency})
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="any"
                value={unitPrice}
                onChange={(e) => handleFormChange('price', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-500 font-mono shadow-inner"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-mono">/ unit</span>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 font-mono">
              Promised Delivery Window
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={deliveryDays}
                onChange={(e) => handleFormChange('days', e.target.value)}
                className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-cyan-500 font-mono shadow-inner"
              />
              <span className="absolute right-3 top-2 text-[10px] text-slate-500 font-mono">Days</span>
            </div>
          </div>
        </div>
      ) : (
        /* DOCUMENT UPLOAD DROPZONE */
        <div className="pt-5 pb-6 border-b border-slate-800/80">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700/80 hover:border-cyan-400/80 rounded-2xl p-6 cursor-pointer bg-slate-950/60 hover:bg-slate-950 transition flex flex-col items-center justify-center space-y-2 group"
          >
            <div className="p-3 bg-cyan-500/10 rounded-full text-cyan-400 border border-cyan-500/20 group-hover:scale-110 transition-transform">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-center">
              <span className="text-xs sm:text-sm font-semibold text-slate-200 block">
                {uploadingDoc ? 'Extracting & Evaluating Order Viability...' : 'Click or Drop Customer PO, Invoice, or Quotation Document'}
              </span>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                Automatically parses item name, quantity, price, and calculates complete rent, material, labour, and profit breakdown
              </span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.csv,.xlsx,.xls"
              className="hidden"
            />
          </div>
        </div>
      )}

      {/* CORE EVALUATION RESULTS CONTAINER */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Simulating factory costs and cash requirements...</span>
        </div>
      ) : evaluation ? (
        <div className="mt-6 space-y-6 animate-fadeIn">
          {/* 1. THE BIG EXECUTIVE ADVISORY VERDICT BANNER */}
          <div className={`rounded-2xl p-5 border ${badgeBg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg transition-all`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {isLossMaking ? (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                ) : isRenegotiate ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : isLockSupplier ? (
                  <ShieldAlert className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
                <span className="text-xs font-bold tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-black/30 border border-current">
                  {adv.badge || 'EVALUATED'}
                </span>
                <span className="text-xs font-mono opacity-80">
                  Total Order: {evaluation.order_quantity} units @ {currency} {evaluation.agreed_unit_price}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-100 tracking-tight">
                {adv.title || 'Decision Advisory'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-3xl">
                {adv.advice}
              </p>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              {!isLossMaking ? (
                <button
                  onClick={handleCreateOrder}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-glow-emerald transition flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept & Book Order</span>
                </button>
              ) : (
                <button
                  onClick={handleSendToDecisionCentre}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition flex items-center space-x-1.5"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Propose Price Increase</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. THE 3 COMPREHENSIVE ANSWER PANELS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* PANEL A: IS IT PROFITABLE? */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    1. Profitability Verdict
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                    evaluation.profitability?.is_profitable
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {evaluation.profitability?.margin_percent}% Net Margin
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Total Customer Revenue</span>
                  <span className="text-sm font-bold text-slate-100 font-mono">
                    {currency} {Number(evaluation.total_revenue).toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Total Factory Spend Required</span>
                  <span className="text-sm font-semibold text-rose-300 font-mono">
                    - {currency} {Number(evaluation.spend_breakdown?.total_spend_required).toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/90 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-200">Net Profit on This Order</span>
                  <span
                    className={`text-base font-extrabold font-mono ${
                      evaluation.profitability?.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {currency} {Number(evaluation.profitability?.net_profit).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Unit Economics Mini-Table */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-[11px] space-y-1.5">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold">
                  Per Unit Economics
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Selling Price</span>
                  <span className="font-mono text-slate-100 font-semibold">{currency} {evaluation.agreed_unit_price}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Complete Unit Cost</span>
                  <span className="font-mono text-rose-300 font-medium">{currency} {evaluation.spend_breakdown?.unit_cost_required}</span>
                </div>
                <div className="flex justify-between text-slate-300 font-semibold pt-1 border-t border-slate-800">
                  <span>Unit Profit</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {currency} {(evaluation.agreed_unit_price - evaluation.spend_breakdown?.unit_cost_required).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* PANEL B: MONEY I HAVE VS MONEY I MUST SPEND (CASH RUNWAY) */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    2. Can I Afford It? (Cash Check)
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                    evaluation.cash_affordability?.can_afford
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-rose-950 text-rose-300 border border-rose-800'
                  }`}
                >
                  {evaluation.cash_affordability?.can_afford ? 'Sufficient Cash' : 'Cash Deficit Warning'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-xs text-slate-400">Money You Have (Cash Reserves)</span>
                  </div>
                  {isEditingCash ? (
                    <div className="flex items-center space-x-1.5">
                      <input
                        type="number"
                        value={tempCashInput}
                        onChange={(e) => setTempCashInput(e.target.value)}
                        className="w-24 bg-slate-900 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-slate-100 font-mono"
                      />
                      <button
                        onClick={handleSaveWorkingCapital}
                        className="text-[10px] bg-cyan-600 text-white px-2 py-0.5 rounded font-bold hover:bg-cyan-500"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-bold text-slate-100 font-mono">
                        {currency} {Number(evaluation.cash_affordability?.available_cash).toLocaleString()}
                      </span>
                      <button
                        onClick={() => setIsEditingCash(true)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline font-mono"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Money You Must Spend (Upfront)</span>
                  <span className="text-sm font-semibold text-rose-300 font-mono">
                    {currency} {Number(evaluation.cash_affordability?.spend_required).toLocaleString()}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/90 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-200">Cash Remaining After Spend</span>
                  <span
                    className={`text-base font-extrabold font-mono ${
                      evaluation.cash_affordability?.cash_balance_after_spend >= 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {currency} {Number(evaluation.cash_affordability?.cash_balance_after_spend).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Actionable Cash Advice */}
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-[11px] leading-relaxed text-slate-300">
                {evaluation.cash_affordability?.advice}
              </div>
            </div>

            {/* PANEL C: TIME & CAPACITY CHECK */}
            <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    3. Time & Lead Time
                  </span>
                </div>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                    evaluation.production_time?.is_feasible
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-amber-950 text-amber-300 border border-amber-800'
                  }`}
                >
                  {evaluation.production_time?.is_feasible ? 'On Schedule' : 'Capacity Bottleneck'}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Promised Delivery Window</span>
                  <span className="text-sm font-bold text-slate-100 font-mono">
                    {evaluation.production_time?.promised_delivery_days} Days
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Production Time Required</span>
                  <span className="text-sm font-semibold text-cyan-300 font-mono">
                    {evaluation.production_time?.days_to_produce} Days
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-800/90 flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-200">Delivery Buffer</span>
                  <span
                    className={`text-base font-extrabold font-mono ${
                      evaluation.production_time?.days_buffer >= 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {evaluation.production_time?.days_buffer >= 0 ? `+${evaluation.production_time?.days_buffer} Days Buffer` : `${evaluation.production_time?.days_buffer} Days Deficit`}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-[11px] leading-relaxed text-slate-300">
                {evaluation.production_time?.advice}
              </div>
            </div>
          </div>

          {/* 3. EXACT SPEND BREAKDOWN (WHERE EVERY PENNY GOES) */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Exact Spend Breakdown (Where the Money Goes)
                </h4>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Total Upfront Factory Cost: <strong className="text-slate-100 font-bold">{currency} {Number(evaluation.spend_breakdown?.total_spend_required).toLocaleString()}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Category 1: Raw Material */}
              <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800/90 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Raw Materials</span>
                  <span className="text-cyan-300 font-mono font-bold">
                    {evaluation.spend_breakdown?.raw_material?.percent_of_spend}%
                  </span>
                </div>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {currency} {Number(evaluation.spend_breakdown?.raw_material?.total).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  {currency} {evaluation.spend_breakdown?.raw_material?.per_unit} per unit manufactured
                </div>
              </div>

              {/* Category 2: Direct Labour */}
              <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800/90 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Direct Labour & Wages</span>
                  <span className="text-emerald-300 font-mono font-bold">
                    {evaluation.spend_breakdown?.direct_labour?.percent_of_spend}%
                  </span>
                </div>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {currency} {Number(evaluation.spend_breakdown?.direct_labour?.total).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  {currency} {evaluation.spend_breakdown?.direct_labour?.per_unit} per unit manufactured
                </div>
              </div>

              {/* Category 3: Rent & Factory Overhead */}
              <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800/90 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Factory Rent & Admin</span>
                  <span className="text-blue-300 font-mono font-bold">
                    {evaluation.spend_breakdown?.rent_and_overhead?.percent_of_spend}%
                  </span>
                </div>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {currency} {Number(evaluation.spend_breakdown?.rent_and_overhead?.total).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  Rent: {currency} {evaluation.spend_breakdown?.rent_and_overhead?.rent_portion} | Admin: {currency} {evaluation.spend_breakdown?.rent_and_overhead?.admin_portion}
                </div>
              </div>

              {/* Category 4: Supply, Electricity & Other */}
              <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800/90 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Supply, Power & Freight</span>
                  <span className="text-purple-300 font-mono font-bold">
                    {evaluation.spend_breakdown?.supply_and_energy?.percent_of_spend}%
                  </span>
                </div>
                <div className="text-base font-bold text-slate-100 font-mono">
                  {currency} {Number(evaluation.spend_breakdown?.supply_and_energy?.total).toLocaleString()}
                </div>
                <div className="text-[11px] text-slate-400">
                  Utilities, transport, consumables & fuel
                </div>
              </div>
            </div>
          </div>

          {/* 4. LONG-RUN RISK & PRICE SHOCK SIMULATOR ("SHOULD I KEEP THAT ORDER?") */}
          <div className="glass-panel rounded-2xl p-5 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800/80 gap-2">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  Long-Run Price Increase Test: Should I Keep That Order?
                </h4>
              </div>
              <span className="text-xs text-amber-300 font-mono font-semibold">
                {evaluation.future_price_risk?.breakeven_warning}
              </span>
            </div>

            {/* Interactive Slider */}
            <div className="bg-slate-950/80 rounded-xl p-4 border border-slate-800/90 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium flex items-center space-x-1.5">
                  <span>Simulate Raw Material Price Increase:</span>
                  <strong className="text-cyan-400 font-mono font-bold text-sm">+{futurePriceShockPct}%</strong>
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  Breakeven Tipping Point: <strong className="text-amber-400">+{evaluation.future_price_risk?.breakeven_material_spike_pct}%</strong>
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={futurePriceShockPct}
                onChange={(e) => handleFormChange('shock', e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% (Current Rate)</span>
                <span>+10%</span>
                <span>+20%</span>
                <span>+30%</span>
                <span>+40% (Severe Shock)</span>
              </div>
            </div>

            {/* Quick Sensitivity Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Scenario</th>
                    <th className="py-2.5 px-3">Raw Material Spend</th>
                    <th className="py-2.5 px-3">Total Factory Spend</th>
                    <th className="py-2.5 px-3">Net Profit</th>
                    <th className="py-2.5 px-3">Margin %</th>
                    <th className="py-2.5 px-3 text-right">Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/70 text-slate-300 text-[11px]">
                  {(evaluation.future_price_risk?.future_scenarios || []).map((sc: any, idx: number) => (
                    <tr key={idx} className={futurePriceShockPct === sc.shock_pct ? 'bg-cyan-950/30' : ''}>
                      <td className="py-2 px-3 font-semibold text-slate-200">{sc.label}</td>
                      <td className="py-2 px-3">{currency} {Number(sc.material_cost).toLocaleString()}</td>
                      <td className="py-2 px-3">{currency} {Number(sc.total_spend).toLocaleString()}</td>
                      <td className={`py-2 px-3 font-bold ${sc.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {currency} {Number(sc.net_profit).toLocaleString()}
                      </td>
                      <td className="py-2 px-3">{sc.margin_percent}%</td>
                      <td className="py-2 px-3 text-right">
                        {sc.is_profitable ? (
                          <span className="text-emerald-400 font-semibold">KEEP ORDER</span>
                        ) : (
                          <span className="text-rose-400 font-semibold">DROP / RENEGOTIATE</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
