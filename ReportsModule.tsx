import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { useStock } from '../hooks/useStock';
import { Calendar, Package, Users, Download, FileText, RotateCcw, Scale, ChevronDown, ChevronUp, AlertTriangle, Gift } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ReportType = 'stock' | 'receive' | 'sales' | 'returns' | 'reconciliation' | 'damage' | 'free';

export default function ReportsModule({ initialType }: { initialType?: ReportType }) {
  const [reportType, setReportType] = useState<ReportType>(initialType || 'stock');
  const [expandedProducts, setExpandedProducts] = useState<Set<number>>(new Set());
  const [startDate, setStartDate] = useState<string>(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const { products, getProductStock, getGodownStock, getOutletStock } = useStock();

  const toggleProduct = (id: number) => {
    const newSet = new Set(expandedProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedProducts(newSet);
  };

  const resetExpanded = () => setExpandedProducts(newSet => {
    newSet.clear();
    return new Set(newSet);
  });

  const handleTypeChange = (type: ReportType) => {
    setReportType(type);
    resetExpanded();
  };
  
  const receives = useLiveQuery(() => 
    db.receives.toArray().then(items => 
      Promise.all(items.map(async i => ({
        ...i,
        productName: (await db.products.get(i.productId))?.name
      })))
    )
  ) || [];

  const sales = useLiveQuery(() => 
    db.sales.toArray().then(items => 
      Promise.all(items.map(async i => ({
        ...i,
        productName: (await db.products.get(i.productId))?.name,
        outletName: i.outletId ? (await db.outlets.get(i.outletId))?.name : 'মেইন গোডাউন'
      })))
    )
  ) || [];

  const outletSales = useLiveQuery(() => 
    db.outletSales.toArray().then(items => 
      Promise.all(items.map(async i => ({
        ...i,
        productName: (await db.products.get(i.productId))?.name,
        outletName: (await db.outlets.get(i.outletId))?.name
      })))
    )
  ) || [];

  const returns = useLiveQuery(() => 
    db.returns.toArray().then(items => 
      Promise.all(items.map(async i => ({
        ...i,
        productName: (await db.products.get(i.productId))?.name,
        outletName: (await db.outlets.get(i.outletId))?.name
      })))
    )
  ) || [];

  const reconciliations = useLiveQuery(() => 
    db.reconciliations.toArray().then(items => 
      Promise.all(items.map(async i => ({
        ...i,
        productName: (await db.products.get(i.productId))?.name
      })))
    )
  ) || [];

  const damages = useLiveQuery(() => 
    db.damages.toArray().then(items => 
      Promise.all(items.map(async i => ({
        ...i,
        productName: (await db.products.get(i.productId))?.name
      })))
    )
  ) || [];

  const filteredReceives = receives.filter(r => r.date >= startDate && r.date <= endDate);
  const filteredSales = sales.filter(s => s.date >= startDate && s.date <= endDate);
  const filteredOutletSales = outletSales.filter(s => s.date >= startDate && s.date <= endDate);
  const filteredReturns = returns.filter(r => r.date >= startDate && r.date <= endDate);
  const filteredReconciliations = reconciliations.filter(r => r.date.split('T')[0] >= startDate && r.date.split('T')[0] <= endDate);
  const filteredDamages = damages.filter(d => d.date >= startDate && d.date <= endDate);

  const renderStockReport = () => {
    const totalStock = products.reduce((sum, p) => sum + getProductStock(p.id!, endDate), 0);
    
    return (
      <div className="space-y-3">
        {products.map((p) => {
          const stock = getProductStock(p.id!, endDate);
          const godownStock = getGodownStock(p.id!, endDate);
          const outletStock = getOutletStock(p.id!, undefined, endDate);
          const diff = filteredReconciliations
            .filter(r => r.productId === p.id)
            .reduce((sum, r) => sum + (r.difference || 0), 0);
          const isExpanded = expandedProducts.has(p.id!);

          return (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
              <button 
                onClick={() => toggleProduct(p.id!)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded-xl text-red-600 dark:text-red-400">
                    <Package size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 dark:text-white">{p.name}</p>
                    <div className="flex gap-2 items-center">
                      <p className={cn(
                        "text-xs font-bold",
                        stock <= p.lowStockLimit ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                      )}>
                        স্টক: {stock} {p.unit}
                      </p>
                      {diff !== 0 && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                          diff < 0 ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                        )}>
                          পার্থক্য: {diff > 0 ? `+${diff}` : diff}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>

              {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900/20 border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  <div className="p-4 flex justify-between items-center text-sm">
                    <p className="font-medium text-gray-600 dark:text-gray-400">মেইন গোডাউন</p>
                    <p className="font-bold text-gray-800 dark:text-white">{godownStock} {p.unit}</p>
                  </div>
                  <div className="p-4 flex justify-between items-center text-sm">
                    <p className="font-medium text-gray-600 dark:text-gray-400">আউটলেট স্টক (মোট)</p>
                    <p className="font-bold text-gray-800 dark:text-white">{outletStock} {p.unit}</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Total Row */}
        <div className="bg-gray-800 text-white p-5 rounded-2xl shadow-xl flex justify-between items-center mt-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <Package size={20} />
            </div>
            <p className="font-bold text-lg">সর্বমোট স্টক</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{totalStock}</p>
            <p className="text-[10px] font-bold text-white/50 uppercase">সকল পণ্যের মোট স্টক</p>
          </div>
        </div>
      </div>
    );
  };

  const renderReceiveReport = () => {
    const totalReceived = filteredReceives.reduce((sum, r) => sum + r.quantity, 0);
    
    return (
      <div className="space-y-3">
        {products.map((p) => {
          const productReceives = filteredReceives.filter(r => r.productId === p.id);
          if (productReceives.length === 0) return null;
          
          const totalReceivedProduct = productReceives.reduce((sum, r) => sum + r.quantity, 0);
          const isExpanded = expandedProducts.has(p.id!);

          return (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button 
                onClick={() => toggleProduct(p.id!)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                    <Package size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">মোট রিসিভ: {totalReceivedProduct} {p.unit}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />}
              </button>

              {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {productReceives.map((item) => (
                    <div key={item.id} className="p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300">{item.invoiceNumber || 'ইনভয়েস নেই'}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.date}</p>
                      </div>
                      <p className="font-bold text-blue-600 dark:text-blue-400">+{item.quantity} {p.unit}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Total Row */}
        <div className="bg-blue-800 text-white p-5 rounded-2xl shadow-xl flex justify-between items-center mt-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <Package size={20} />
            </div>
            <p className="font-bold text-lg">সর্বমোট রিসিভ</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{totalReceived}</p>
            <p className="text-[10px] font-bold text-white/50 uppercase">সকল পণ্যের মোট রিসিভ</p>
          </div>
        </div>
      </div>
    );
  };

  const renderSalesReport = () => {
    const totalSalesValue = filteredSales.reduce((sum, s) => sum + (s.quantity * (s.price || 0)), 0);
    const totalOutletSalesValue = filteredOutletSales.reduce((sum, s) => sum + (s.quantity * (s.price || 0)), 0);
    const grandTotalValue = totalSalesValue + totalOutletSalesValue;

    return (
      <div className="space-y-3">
        {products.map((p) => {
          const productSales = filteredSales.filter(s => s.productId === p.id && s.note !== 'Outlet Distribution');
          const productOutletSales = filteredOutletSales.filter(s => s.productId === p.id);
          
          if (productSales.length === 0 && productOutletSales.length === 0) return null;

          const totalQty = productSales.reduce((sum, s) => sum + s.quantity, 0) + 
                          productOutletSales.reduce((sum, s) => sum + s.quantity, 0);
          const totalFree = productSales.reduce((sum, s) => sum + (s.freeQuantity || 0), 0) + 
                           productOutletSales.reduce((sum, s) => sum + (s.freeQuantity || 0), 0);
          const totalValue = productSales.reduce((sum, s) => sum + (s.quantity * (s.price || 0)), 0) + 
                            productOutletSales.reduce((sum, s) => sum + (s.quantity * (s.price || 0)), 0);
          const isExpanded = expandedProducts.has(p.id!);

          // Group by Outlet
          const outletGroups = [...productSales, ...productOutletSales].reduce((acc, s) => {
            const key = s.outletId ? `outlet-${s.outletId}` : 'godown';
            if (!acc[key]) acc[key] = { qty: 0, free: 0, value: 0, name: s.outletName || (s.outletId ? 'আউটলেট' : 'মেইন গোডাউন') };
            acc[key].qty += s.quantity;
            acc[key].free += (s.freeQuantity || 0);
            acc[key].value += (s.quantity * (s.price || 0));
            return acc;
          }, {} as Record<string, { qty: number, free: number, value: number, name: string }>);

          return (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button 
                onClick={() => toggleProduct(p.id!)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-xl text-green-600 dark:text-green-400">
                    <Users size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">মোট বিক্রয়: {totalQty + totalFree} {p.unit} (৳{totalValue})</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />}
              </button>

              {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {Object.entries(outletGroups).map(([key, data]: [string, any]) => (
                    <div key={key} className="p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300">{data.name}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">৳{data.value}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-800 dark:text-gray-200">{data.qty} {p.unit}</p>
                        {data.free > 0 && <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">+{data.free} ফ্রি</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Total Row */}
        <div className="bg-green-800 text-white p-5 rounded-2xl shadow-xl flex justify-between items-center mt-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <Users size={20} />
            </div>
            <p className="font-bold text-lg">সর্বমোট বিক্রয় মূল্য</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">৳{grandTotalValue}</p>
            <p className="text-[10px] font-bold text-white/50 uppercase">সকল বিক্রয়ের মোট মূল্য</p>
          </div>
        </div>
      </div>
    );
  };

  const renderReturnReport = () => {
    const totalReturned = filteredReturns.reduce((sum, r) => sum + r.quantity, 0);

    return (
      <div className="space-y-3">
        {products.map((p) => {
          const productReturns = filteredReturns.filter(r => r.productId === p.id);
          if (productReturns.length === 0) return null;

          const totalReturnedProduct = productReturns.reduce((sum, r) => sum + r.quantity, 0);
          const isExpanded = expandedProducts.has(p.id!);

          // Group by Outlet
          const outletReturns = productReturns.reduce((acc, r) => {
            const key = r.outletId;
            if (!acc[key]) acc[key] = { qty: 0, name: r.outletName || 'আউটলেট' };
            acc[key].qty += r.quantity;
            return acc;
          }, {} as Record<number, { qty: number, name: string }>);

          return (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button 
                onClick={() => toggleProduct(p.id!)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-orange-50 dark:bg-orange-900/30 p-2 rounded-xl text-orange-600 dark:text-orange-400">
                    <RotateCcw size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">মোট ফেরৎ: {totalReturnedProduct} {p.unit}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />}
              </button>

              {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {Object.entries(outletReturns).map(([key, data]) => (
                    <div key={key} className="p-4 flex justify-between items-center text-sm">
                      <p className="font-bold text-gray-700 dark:text-gray-300">{data.name}</p>
                      <p className="font-bold text-orange-600 dark:text-orange-400">+{data.qty} {p.unit}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Total Row */}
        <div className="bg-orange-800 text-white p-5 rounded-2xl shadow-xl flex justify-between items-center mt-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <RotateCcw size={20} />
            </div>
            <p className="font-bold text-lg">সর্বমোট ফেরৎ</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{totalReturned}</p>
            <p className="text-[10px] font-bold text-white/50 uppercase">সকল পণ্যের মোট ফেরৎ</p>
          </div>
        </div>
      </div>
    );
  };

  const renderReconciliationReport = () => {
    const totalDiff = filteredReconciliations.reduce((sum, r) => sum + (r.difference || 0), 0);

    return (
      <div className="space-y-3">
        {products.map((p) => {
          const productReconciliations = filteredReconciliations.filter(r => r.productId === p.id);
          if (productReconciliations.length === 0) return null;

          const totalDiffProduct = productReconciliations.reduce((sum, r) => sum + (r.difference || 0), 0);
          const isExpanded = expandedProducts.has(p.id!);

          return (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button 
                onClick={() => toggleProduct(p.id!)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-purple-50 dark:bg-purple-900/30 p-2 rounded-xl text-purple-600 dark:text-purple-400">
                    <Scale size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className={cn(
                      "text-xs font-bold",
                      totalDiffProduct === 0 ? "text-green-600 dark:text-green-400" :
                      totalDiffProduct < 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400"
                    )}>
                      মোট পার্থক্য: {totalDiffProduct > 0 ? `+${totalDiffProduct}` : totalDiffProduct} {p.unit}
                    </p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />}
              </button>

              {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {productReconciliations.map((item) => (
                    <div key={item.id} className="p-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">{new Date(item.date).toLocaleString('bn-BD')}</p>
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          item.difference === 0 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                          item.difference < 0 ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        )}>
                          {item.difference > 0 ? `+${item.difference}` : item.difference}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[10px]">
                        <div className="text-center">
                          <p className="text-gray-400 dark:text-gray-500 uppercase">বাস্তব</p>
                          <p className="font-bold text-gray-700 dark:text-gray-300">{item.physicalQuantity}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 dark:text-gray-500 uppercase">ড্যামেজ</p>
                          <p className="font-bold text-gray-700 dark:text-gray-300">{item.damageQuantity}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-gray-400 dark:text-gray-500 uppercase">ধরা</p>
                          <p className="font-bold text-gray-700 dark:text-gray-300">{item.dharaQuantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Total Row */}
        <div className="bg-purple-800 text-white p-5 rounded-2xl shadow-xl flex justify-between items-center mt-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <Scale size={20} />
            </div>
            <p className="font-bold text-lg">সর্বমোট পার্থক্য</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{totalDiff > 0 ? `+${totalDiff}` : totalDiff}</p>
            <p className="text-[10px] font-bold text-white/50 uppercase">সকল মিলকরণের মোট পার্থক্য</p>
          </div>
        </div>
      </div>
    );
  };

  const renderDamageReport = () => {
    const totalDamage = filteredDamages.reduce((sum, d) => sum + d.quantity, 0);

    return (
      <div className="space-y-3">
        {products.map((p) => {
          const productDamages = filteredDamages.filter(d => d.productId === p.id);
          if (productDamages.length === 0) return null;

          const totalDamageProduct = productDamages.reduce((sum, d) => sum + d.quantity, 0);
          const isExpanded = expandedProducts.has(p.id!);

          return (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button 
                onClick={() => toggleProduct(p.id!)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-red-50 dark:bg-red-900/30 p-2 rounded-xl text-red-600 dark:text-red-400">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-red-600 dark:text-red-400 font-bold">মোট ড্যামেজ: {totalDamageProduct} {p.unit}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />}
              </button>

              {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {productDamages.map((item) => (
                    <div key={item.id} className="p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300">{item.note || 'কারণ উল্লেখ নেই'}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.date}</p>
                      </div>
                      <p className="font-bold text-red-600 dark:text-red-400">-{item.quantity} {p.unit}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Total Row */}
        <div className="bg-red-800 text-white p-5 rounded-2xl shadow-xl flex justify-between items-center mt-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 p-2 rounded-xl">
              <AlertTriangle size={20} />
            </div>
            <p className="font-bold text-lg">সর্বমোট ড্যামেজ</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black">{totalDamage}</p>
            <p className="text-[10px] font-bold text-white/50 uppercase">সকল পণ্যের মোট ড্যামেজ</p>
          </div>
        </div>
      </div>
    );
  };

  const renderFreeReport = () => {
    const totalFreeReceive = filteredReceives.reduce((sum, r) => sum + (r.freeQuantity || 0), 0);
    const totalFreeSales = filteredSales.reduce((sum, s) => sum + (s.freeQuantity || 0), 0);
    const totalFreeOutletSales = filteredOutletSales.reduce((sum, s) => sum + (s.freeQuantity || 0), 0);
    const totalFreeGiven = totalFreeSales + totalFreeOutletSales;

    return (
      <div className="space-y-3">
        {products.map((p) => {
          const productReceives = filteredReceives.filter(r => r.productId === p.id && (r.freeQuantity || 0) > 0);
          const productSales = filteredSales.filter(s => s.productId === p.id && (s.freeQuantity || 0) > 0 && s.note !== 'Outlet Distribution');
          const productDistributions = filteredSales.filter(s => s.productId === p.id && (s.freeQuantity || 0) > 0 && s.note === 'Outlet Distribution');
          const productOutletSales = filteredOutletSales.filter(s => s.productId === p.id && (s.freeQuantity || 0) > 0);
          
          if (productReceives.length === 0 && productSales.length === 0 && productDistributions.length === 0 && productOutletSales.length === 0) return null;

          const totalFreeProduct = productReceives.reduce((sum, r) => sum + (r.freeQuantity || 0), 0) +
                                  productSales.reduce((sum, s) => sum + (s.freeQuantity || 0), 0) +
                                  productDistributions.reduce((sum, s) => sum + (s.freeQuantity || 0), 0) +
                                  productOutletSales.reduce((sum, s) => sum + (s.freeQuantity || 0), 0);
          const isExpanded = expandedProducts.has(p.id!);

          return (
            <div key={p.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <button 
                onClick={() => toggleProduct(p.id!)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded-xl text-green-600 dark:text-green-400">
                    <Gift size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-800 dark:text-gray-100">{p.name}</p>
                    <p className="text-xs text-green-600 dark:text-green-400 font-bold">মোট ফ্রি: {totalFreeProduct} {p.unit}</p>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={20} className="text-gray-400 dark:text-gray-500" /> : <ChevronDown size={20} className="text-gray-400 dark:text-gray-500" />}
              </button>

              {isExpanded && (
                <div className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {productReceives.map((item) => (
                    <div key={`rec-${item.id}`} className="p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300">রিসিভ (ফ্রি)</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.date}</p>
                      </div>
                      <p className="font-bold text-green-600 dark:text-green-400">+{item.freeQuantity} {p.unit}</p>
                    </div>
                  ))}
                  {productDistributions.map((item) => (
                    <div key={`dist-${item.id}`} className="p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300">বিতরণ (ফ্রি) - {item.outletName || 'আউটলেট'}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.date}</p>
                      </div>
                      <p className="font-bold text-green-600 dark:text-green-400">+{item.freeQuantity} {p.unit}</p>
                    </div>
                  ))}
                  {productSales.map((item) => (
                    <div key={`sale-${item.id}`} className="p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300">বিক্রয় (ফ্রি) - {item.customerName || 'ক্রেতা'}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.date}</p>
                      </div>
                      <p className="font-bold text-green-600 dark:text-green-400">+{item.freeQuantity} {p.unit}</p>
                    </div>
                  ))}
                  {productOutletSales.map((item) => (
                    <div key={`osale-${item.id}`} className="p-4 flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-gray-700 dark:text-gray-300">আউটলেট বিক্রয় (ফ্রি) - {item.outletName || 'আউটলেট'}</p>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500">{item.date}</p>
                      </div>
                      <p className="font-bold text-green-600 dark:text-green-400">+{item.freeQuantity} {p.unit}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Total Row */}
        <div className="bg-green-800 text-white p-5 rounded-2xl shadow-xl flex flex-col gap-4 mt-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-xl">
                <Gift size={20} />
              </div>
              <p className="font-bold text-lg">ফ্রি রিপোর্ট সারাংশ</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase">মোট রিসিভ (ফ্রি)</p>
              <p className="text-xl font-black">{totalFreeReceive}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-white/50 uppercase">মোট প্রদান (ফ্রি)</p>
              <p className="text-xl font-black">{totalFreeGiven}</p>
            </div>
          </div>
          
          <div className="pt-2 border-t border-white/10 flex justify-between items-end">
            <div>
              <p className="text-[10px] font-bold text-white/50 uppercase">সর্বমোট ফ্রি (নেট)</p>
              <p className="text-2xl font-black">{totalFreeReceive + totalFreeGiven}</p>
            </div>
            <p className="text-[10px] font-bold text-white/30 italic">সকল পণ্যের মোট ফ্রি শলাকা</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white transition-colors">{TRANSLATIONS.reports}</h2>
        <button 
          onClick={() => window.print()}
          className="bg-gray-100 dark:bg-gray-800 p-3 rounded-full text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <Download size={20} />
        </button>
      </div>

      {/* Date Range Picker */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3 transition-colors duration-300">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
          <Calendar size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">তারিখের পরিসীমা নির্বাচন করুন</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">শুরু</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-3 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">শেষ</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-3 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-2xl transition-colors">
        <button
          onClick={() => handleTypeChange('stock')}
          className={cn(
            "py-3 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1",
            reportType === 'stock' ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Package size={14} />
          স্টক
        </button>
        <button
          onClick={() => handleTypeChange('receive')}
          className={cn(
            "py-3 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1",
            reportType === 'receive' ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Calendar size={14} />
          রিসিভ
        </button>
        <button
          onClick={() => handleTypeChange('sales')}
          className={cn(
            "py-3 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1",
            reportType === 'sales' ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Users size={14} />
          বিক্রয়
        </button>
        <button
          onClick={() => handleTypeChange('free')}
          className={cn(
            "py-3 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1",
            reportType === 'free' ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Gift size={14} />
          ফ্রি
        </button>
        <button
          onClick={() => handleTypeChange('returns')}
          className={cn(
            "py-3 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1",
            reportType === 'returns' ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
          )}
        >
          <RotateCcw size={14} />
          ফেরৎ
        </button>
        <button
          onClick={() => handleTypeChange('reconciliation')}
          className={cn(
            "py-3 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1",
            reportType === 'reconciliation' ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
          )}
        >
          <Scale size={14} />
          মিলকরণ
        </button>
        <button
          onClick={() => handleTypeChange('damage')}
          className={cn(
            "py-3 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1",
            reportType === 'damage' ? "bg-white dark:bg-gray-800 text-red-600 shadow-sm" : "text-gray-500 dark:text-gray-400"
          )}
        >
          <AlertTriangle size={14} />
          ড্যামেজ
        </button>
      </div>

      {/* Report Content */}
      <div className="pb-12">
        {reportType === 'stock' && renderStockReport()}
        {reportType === 'receive' && renderReceiveReport()}
        {reportType === 'sales' && renderSalesReport()}
        {reportType === 'returns' && renderReturnReport()}
        {reportType === 'reconciliation' && renderReconciliationReport()}
        {reportType === 'damage' && renderDamageReport()}
        {reportType === 'free' && renderFreeReport()}
      </div>
    </div>
  );
}
