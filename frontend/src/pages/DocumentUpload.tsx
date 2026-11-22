import React, { useEffect, useState, useRef } from 'react';
import { apiRequest } from '../api/client';
import { StatusBadge } from '../components/StatusBadge';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  TrendingUp,
  Wallet,
  Clock,
  Layers,
  Sliders,
  ArrowRight,
  Plus,
  RefreshCw,
  X
} from 'lucide-react';

export const DocumentUpload: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active Evaluated Document / Item State
  const [activeDoc, setActiveDoc] = useState<any>(null);
  const [itemName, setItemName] = useState<string>('Cotton Bio-Washed Fabric 180 GSM');
  const [supplierCustomer, setSupplierCustomer] = useState<string>('Apex Sourcing Partner');
  const [unitPrice, setUnitPrice] = useState<number>(450);
  const [quantity, setQuantity] = useState<number>(500);
  const [unit, setUnit] = useState<string>('kg');
  const [deliveryDays, setDeliveryDays] = useState<number>(30);
  const [availableCash, setAvailableCash] = useState<number>(500000);
  const [isEditingCash, setIsEditingCash] = useState<boolean>(false);
  const [tempCash, setTempCash] = useState<string>('500000');
  const [futurePriceShockPct, setFuturePriceShockPct] = useState<number>(0);

  // Viability calculation state
  const [viability, setViability] = useState<any>(null);
  const [calculating, setCalculating] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [docs, opex] = await Promise.all([
        apiRequest<any[]>('/documents').catch(() => []),
        apiRequest<any>('/business/opex').catch(() => null),
      ]);

      setDocuments(docs || []);
      const userCash = opex?.working_capital_reserves || 500000;
      setAvailableCash(userCash);
      setTempCash(String(userCash));

      if (docs && docs.length > 0) {
        selectDocument(docs[0], userCash);
      } else {
        // Run initial evaluation with default numbers
        runViabilityCalc({
          name: itemName,
          price: unitPrice,
          qty: quantity,
          days: deliveryDays,
          cash: userCash,
          shock: futurePriceShockPct,
        });
      }
    } catch (e) {
      console.error('Failed to load documents data:', e);
    } finally {
      setLoading(false);
    }
  };

  const selectDocument = (doc: any, cashToUse?: number) => {
    setActiveDoc(doc);
    const rec = doc?.extracted_data_json?.records?.[0] || {};
    const extractedName = rec.material_name || rec.raw_material_name || doc.filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const extractedSupplier = rec.supplier_name || 'Direct Supplier';
    const extractedPrice = Number(rec.unit_price) || 350;
    const extractedQty = Number(rec.quantity) || 500;
    const extractedUnit = rec.unit || 'kg';

    setItemName(extractedName);
    setSupplierCustomer(extractedSupplier);
    setUnitPrice(extractedPrice);
    setQuantity(extractedQty);
    setUnit(extractedUnit);

    const cash = cashToUse !== undefined ? cashToUse : availableCash;
    runViabilityCalc({
      name: extractedName,
      price: extractedPrice,
      qty: extractedQty,
      days: deliveryDays,
      cash: cash,
      shock: futurePriceShockPct,
    });
  };

  const runViabilityCalc = async (params: {
    name: string;
    price: number;
    qty: number;
    days: number;
    cash: number;
    shock: number;
  }) => {
    try {
      setCalculating(true);
      const queryParams = new URLSearchParams({
        item_name: params.name,
        agreed_price: String(params.price),
        quantity: String(params.qty),
        delivery_days: String(params.days),
        available_cash: String(params.cash),
        future_price_shock_pct: String(params.shock),
      });

      const res = await apiRequest<any>(`/ordersure/deep-viability?${queryParams.toString()}`);
      setViability(res);
    } catch (e) {
      console.error('Failed to evaluate document viability:', e);
    } finally {
      setCalculating(false);
    }
  };

  const handleFieldChange = (field: string, val: any) => {
    let newName = itemName;
    let newPrice = unitPrice;
    let newQty = quantity;
    let newDays = deliveryDays;
    let newShock = futurePriceShockPct;

    if (field === 'name') {
      newName = val;
      setItemName(newName);
    }
    if (field === 'price') {
      newPrice = Number(val) || 0;
      setUnitPrice(newPrice);
    }
    if (field === 'qty') {
      newQty = Number(val) || 1;
      setQuantity(newQty);
    }
    if (field === 'days') {
      newDays = Number(val) || 1;
      setDeliveryDays(newDays);
    }
    if (field === 'shock') {
      newShock = Number(val) || 0;
      setFuturePriceShockPct(newShock);
    }

    runViabilityCalc({
      name: newName,
      price: newPrice,
      qty: newQty,
      days: newDays,
      cash: availableCash,
      shock: newShock,
    });
  };

  const handleSaveWorkingCapital = async () => {
    const cashVal = Number(tempCash) || 0;
    setAvailableCash(cashVal);
    setIsEditingCash(false);
    try {
      await apiRequest('/business/opex', {
        method: 'PUT',
        body: JSON.stringify({ working_capital_reserves: cashVal }),
      });
      runViabilityCalc({
        name: itemName,
        price: unitPrice,
        qty: quantity,
        days: deliveryDays,
        cash: cashVal,
        shock: futurePriceShockPct,
      });
    } catch (e) {
      console.error('Failed to update cash:', e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('document_type', 'CUSTOMER_ORDER');

      const uploadedDoc = await apiRequest<any>('/documents/upload', {
        method: 'POST',
        body: formData,
      });

      // Reload document list and immediately select and evaluate the newly uploaded document
      const updatedDocs = await apiRequest<any[]>('/documents');
      setDocuments(updatedDocs);
      if (uploadedDoc) {
        selectDocument(uploadedDoc);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      alert('Document reading failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAddToProducts = async () => {
    try {
      const code = `PRD-${Date.now().toString().slice(-4)}`;
      const sku = `SKU-${Date.now().toString().slice(-4)}`;
      const matCost = viability?.spend_breakdown?.raw_material?.per_unit || Math.round(unitPrice * 0.45);
      const labourCost = viability?.spend_breakdown?.direct_labour?.per_unit || 150;
      const overhead = viability?.spend_breakdown?.rent_and_overhead?.per_unit || 100;

      await apiRequest('/products', {
        method: 'POST',
        body: JSON.stringify({
          code,
          name: itemName,
          sku,
          category: 'Manufactured Items',
          selling_price: unitPrice,
          target_margin_percent: 25.0,
          critical_margin_threshold: 16.0,
          raw_material_name: itemName,
          material_cost: matCost,
          material_unit: unit,
          direct_labour_cost: labourCost,
          fixed_overhead: overhead,
        }),
      });

      alert(`"${itemName}" successfully created as a Master Product with Material Cost ₹${matCost} and Labour ₹${labourCost}!`);
    } catch (err: any) {
      alert('Failed to add product: ' + err.message);
    }
  };

  const handleAddToCustomerOrders = async () => {
    try {
      const prods = await apiRequest<any[]>('/products');
      let prodId = prods[0]?.id || 1;
      const matched = prods.find((p: any) => p.name.toLowerCase().includes(itemName.toLowerCase()));
      if (matched) prodId = matched.id;

      await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          order_number: `PO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
          customer_name: supplierCustomer || 'Customer Client',
          product_id: prodId,
          quantity: quantity,
          agreed_unit_price: unitPrice,
          promised_delivery_date: new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000).toISOString(),
        }),
      });

      alert(`Customer Order for ${quantity} units @ ₹${unitPrice} booked into production schedule!`);
    } catch (err: any) {
      alert('Failed to register order: ' + err.message);
    }
  };

  const handleSaveSupplierQuotation = async () => {
    try {
      await apiRequest('/suppliers', {
        method: 'POST',
        body: JSON.stringify({
          code: `SUP-${Date.now().toString().slice(-4)}`,
          name: supplierCustomer,
          contact_email: `${supplierCustomer.toLowerCase().replace(/[^a-z0-9]/g, '')}@supplier.com`,
          lead_time_days: 14,
          reliability_score: 0.95,
          risk_rating: 'LOW',
          payment_terms: 'Net 30',
          material_name: itemName,
          quote_price: unitPrice,
          unit: unit,
        }),
      });

      alert(`Quotation for "${itemName}" @ ₹${unitPrice}/${unit} saved under supplier "${supplierCustomer}"!`);
    } catch (err: any) {
      alert('Failed to save supplier quote: ' + err.message);
    }
  };

  const adv = viability?.advisory || {};
  const isLossMaking = adv.action === 'DROP_ORDER';
  const isRenegotiate = adv.action === 'RENEGOTIATE_PRICE';
  const isLockSupplier = adv.action === 'KEEP_BUT_LOCK_SUPPLIER';

  const badgeBg = isLossMaking
    ? 'bg-rose-950/80 text-rose-300 border-rose-800'
    : isRenegotiate
    ? 'bg-amber-950/80 text-amber-300 border-amber-800'
    : isLockSupplier
    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800'
    : 'bg-emerald-950/80 text-emerald-300 border-emerald-800';

  if (loading) {
    return (
      <div className="p-12 flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Loading Document Intelligence...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto animate-fadeIn">
      {/* 1. TOP HEADER & ONE-CLICK UPLOAD BAR */}
      <div className="pb-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight font-sans">
              Document Profitability & Viability Analyzer
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono font-semibold">
              ACTIVE
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Drop any Purchase Order, Quotation, or Invoice. The system instantly reads it, calculates your exact costs (raw material, labour, rent, power, and time), checks your cash reserves, and tells you whether to keep or drop the order.
          </p>
        </div>

        <div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-bold rounded-xl shadow-glow-cyan transition"
          >
            <Upload className="w-4 h-4" />
            <span>{uploading ? 'Analyzing Document...' : 'Upload Order / Quotation'}</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.csv,.xlsx,.xls"
            className="hidden"
          />
        </div>
      </div>

      {/* 2. LIVE DOCUMENT & ORDER EVALUATION WORKBENCH */}
      <div className="glass-panel-elevated rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 gap-3">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
              {activeDoc ? `Extracted from: ${activeDoc.filename}` : 'Active Order Evaluation'}
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {calculating ? 'Recalculating costs...' : 'Calculated deterministically'}
          </span>
        </div>

        {/* EDITABLE EXTRACTED FIELDS (NO MORE ZEROES!) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="lg:col-span-2">
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1 font-mono">
              Item / Product Name
            </label>
            <input
              type="text"
              value={itemName}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="e.g. Cotton T-Shirt, Steel Flange"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1 font-mono">
              Unit Rate / Price (₹)
            </label>
            <input
              type="number"
              step="any"
              value={unitPrice}
              onChange={(e) => handleFieldChange('price', e.target.value)}
              className="w-full bg-slate-950 border border-emerald-800/60 rounded-xl px-3 py-2 text-xs text-emerald-300 font-mono font-bold focus:outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1 font-mono">
              Quantity ({unit})
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => handleFieldChange('qty', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1 font-mono">
              Delivery Days
            </label>
            <input
              type="number"
              min="1"
              value={deliveryDays}
              onChange={(e) => handleFieldChange('days', e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono font-bold focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* 3. BIG CLEAR KEEP / DROP VERDICT BANNER */}
        {viability && (
          <div className={`rounded-2xl p-5 border ${badgeBg} flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg`}>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                {isLossMaking ? (
                  <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                ) : isRenegotiate ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                )}
                <span className="text-xs font-bold tracking-wider uppercase font-mono px-2 py-0.5 rounded bg-black/30 border border-current">
                  {adv.badge || 'VERDICT'}
                </span>
                <span className="text-xs font-mono opacity-80">
                  Total Order Value: ₹{Number(viability.total_revenue).toLocaleString()}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100">
                {adv.title || 'Viability Decision'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-3xl">
                {adv.advice}
              </p>
            </div>

            {/* Practical Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
              <button
                onClick={handleAddToCustomerOrders}
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-glow-emerald transition flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Book as Customer Order</span>
              </button>
              <button
                onClick={handleAddToProducts}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center space-x-1.5"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Save to Products</span>
              </button>
              <button
                onClick={handleSaveSupplierQuotation}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
              >
                <span>Save Supplier Quote</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. THE 3 CORE ANSWER PANELS */}
        {viability && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 pt-2">
            {/* PANEL 1: IS IT PROFITABLE? */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center space-x-1.5">
                  <TrendingUp className="w-4 h-4 text-cyan-400" />
                  <span>1. Profitability</span>
                </span>
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                  viability.profitability?.is_profitable
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {viability.profitability?.margin_percent}% Net Margin
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Revenue:</span>
                  <span className="font-mono font-bold text-slate-100">₹{Number(viability.total_revenue).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Factory Spend:</span>
                  <span className="font-mono text-rose-300 font-semibold">- ₹{Number(viability.spend_breakdown?.total_spend_required).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                  <span className="text-slate-200">Net Profit on Order:</span>
                  <span className={`font-mono text-sm ${viability.profitability?.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{Number(viability.profitability?.net_profit).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* PANEL 2: CAN I AFFORD IT? (MONEY I HAVE VS MONEY I MUST SPEND) */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center space-x-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>2. Cash Runway</span>
                </span>
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                  viability.cash_affordability?.can_afford
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-rose-950 text-rose-300 border border-rose-800'
                }`}>
                  {viability.cash_affordability?.can_afford ? 'Affordable' : 'Cash Shortfall'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cash in Bank / Reserves:</span>
                  {isEditingCash ? (
                    <div className="flex items-center space-x-1">
                      <input
                        type="number"
                        value={tempCash}
                        onChange={(e) => setTempCash(e.target.value)}
                        className="w-20 bg-slate-900 border border-cyan-500 rounded px-1 py-0.5 text-xs text-slate-100 font-mono"
                      />
                      <button
                        onClick={handleSaveWorkingCapital}
                        className="text-[10px] bg-cyan-600 text-white px-1.5 py-0.5 rounded font-bold"
                      >
                        OK
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <span className="font-mono font-bold text-slate-100">
                        ₹{Number(viability.cash_affordability?.available_cash).toLocaleString()}
                      </span>
                      <button
                        onClick={() => setIsEditingCash(true)}
                        className="text-[10px] text-cyan-400 underline font-mono"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Cash Spend Needed Upfront:</span>
                  <span className="font-mono text-rose-300 font-semibold">₹{Number(viability.cash_affordability?.spend_required).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                  <span className="text-slate-200">Remaining Cash Buffer:</span>
                  <span className={`font-mono text-sm ${viability.cash_affordability?.cash_balance_after_spend >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ₹{Number(viability.cash_affordability?.cash_balance_after_spend).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* PANEL 3: TIME & LEAD TIME */}
            <div className="glass-panel rounded-2xl p-4 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 uppercase font-mono flex items-center space-x-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>3. Production Time</span>
                </span>
                <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded ${
                  viability.production_time?.is_feasible
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : 'bg-amber-950 text-amber-300 border border-amber-800'
                }`}>
                  {viability.production_time?.is_feasible ? 'On Time' : 'Time Warning'}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Promised Delivery Window:</span>
                  <span className="font-mono font-bold text-slate-100">{viability.production_time?.promised_delivery_days} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Production Days Required:</span>
                  <span className="font-mono text-cyan-300 font-semibold">{viability.production_time?.days_to_produce} Days</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold">
                  <span className="text-slate-200">Delivery Safety Cushion:</span>
                  <span className={`font-mono text-sm ${viability.production_time?.days_buffer >= 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    +{viability.production_time?.days_buffer} Days
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. EXACT SPEND BREAKDOWN: RAW MATERIAL, LABOUR, RENT, POWER */}
        {viability && (
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider block font-mono">
              Exact Cost Breakdown: Where Your Money Goes
            </span>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 text-[11px]">Raw Material</div>
                <div className="text-sm font-bold text-slate-100 font-mono">
                  ₹{Number(viability.spend_breakdown?.raw_material?.total).toLocaleString()}
                </div>
                <div className="text-[10px] text-cyan-400 font-mono">
                  {viability.spend_breakdown?.raw_material?.percent_of_spend}% of spend
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 text-[11px]">Direct Labour & Wages</div>
                <div className="text-sm font-bold text-slate-100 font-mono">
                  ₹{Number(viability.spend_breakdown?.direct_labour?.total).toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-400 font-mono">
                  {viability.spend_breakdown?.direct_labour?.percent_of_spend}% of spend
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 text-[11px]">Factory Rent & Admin</div>
                <div className="text-sm font-bold text-slate-100 font-mono">
                  ₹{Number(viability.spend_breakdown?.rent_and_overhead?.total).toLocaleString()}
                </div>
                <div className="text-[10px] text-blue-400 font-mono">
                  {viability.spend_breakdown?.rent_and_overhead?.percent_of_spend}% of spend
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 text-xs space-y-1">
                <div className="text-slate-400 text-[11px]">Supply, Power & Logistics</div>
                <div className="text-sm font-bold text-slate-100 font-mono">
                  ₹{Number(viability.spend_breakdown?.supply_and_energy?.total).toLocaleString()}
                </div>
                <div className="text-[10px] text-purple-400 font-mono">
                  {viability.spend_breakdown?.supply_and_energy?.percent_of_spend}% of spend
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. WHAT IF PRICES INCREASE IN FUTURE? (SHOULD I KEEP THAT ORDER?) */}
        {viability && (
          <div className="pt-2 border-t border-slate-800/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Future Price Rise Sensitivity: Should You Keep It?</span>
              </span>
              <span className="text-xs text-amber-300 font-mono font-semibold">
                Order turns loss-making at +{viability.future_price_risk?.breakeven_material_spike_pct}% material price hike
              </span>
            </div>

            <div className="bg-slate-950/90 rounded-xl p-4 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300">Test Material Cost Inflation:</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">+{futurePriceShockPct}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={futurePriceShockPct}
                onChange={(e) => handleFieldChange('shock', e.target.value)}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% Current Cost</span>
                <span>+10% Rise</span>
                <span>+20% Rise</span>
                <span>+30% Rise</span>
                <span>+40% Severe Spike</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. RECENT PROCESSED DOCUMENTS TABLE */}
      <div className="glass-panel rounded-2xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
            Processed Documents ({documents.length})
          </h2>
          <span className="text-[11px] text-slate-400">
            Click any document to inspect its profitability & costs above
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Document File</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Extracted Item</th>
                <th className="py-3 px-4 text-right">Extracted Price</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {documents.map((doc) => {
                const rec = doc.extracted_data_json?.records?.[0] || {};
                const isSelected = activeDoc?.id === doc.id;
                return (
                  <tr
                    key={doc.id}
                    onClick={() => selectDocument(doc)}
                    className={`cursor-pointer transition ${isSelected ? 'bg-cyan-950/40 text-cyan-100' : 'hover:bg-slate-800/40'}`}
                  >
                    <td className="py-3.5 px-4 font-sans font-medium text-slate-100 flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span>{doc.filename}</span>
                    </td>
                    <td className="py-3.5 px-4">{doc.document_type.replace('_', ' ')}</td>
                    <td className="py-3.5 px-4 font-sans text-slate-200">
                      {rec.material_name || rec.raw_material_name || 'Extracted Item'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-emerald-400">
                      ₹{rec.unit_price ? Number(rec.unit_price).toLocaleString() : '---'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectDocument(doc);
                        }}
                        className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-xs rounded border border-cyan-500/40 transition font-semibold"
                      >
                        Inspect Profitability
                      </button>
                    </td>
                  </tr>
                );
              })}
              {documents.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                    No documents uploaded yet. Click "Upload Order / Quotation" above to analyze your first document.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
