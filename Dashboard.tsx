import React, { useState } from 'react';
import { useStock } from '../hooks/useStock';
import { TRANSLATIONS } from '../constants';
import { Package, TrendingUp, Calendar, AlertTriangle, RotateCcw, ShoppingCart, Scale, Store, ChevronDown, ChevronUp, Truck } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface DashboardProps {
  onNavigate: (tab: 'opening' | 'receive' | 'sales' | 'distribution' | 'returns' | 'reconciliation' | 'reports' | 'damage') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { products, getGodownStock, getOutletStock, getProductStock, lowStockProducts, sales, outletSales } = useStock();
  const [startDate, setStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [showGodownDetails, setShowGodownDetails] = useState(false);
  const [showOutletDetails, setShowOutletDetails] = useState(false);
  const [showTotalDetails, setShowTotalDetails] = useState(false);
  const [showSalesDetails, setShowSalesDetails] = useState(false);
  const [showDistributionDetails, setShowDistributionDetails] = useState(false);
  const [showDamageDetails, setShowDamageDetails] = useState(false);
  const [expandedSalesProducts, setExpandedSalesProducts] = useState<Set<number>>(new Set());
  const [expandedSalesOutlets, setExpandedSalesOutlets] = useState<Set<number>>(new Set());
  const [expandedStockProducts, setExpandedStockProducts] = useState<Set<number>>(new Set());
  const [expandedStockOutlets, setExpandedStockOutlets] = useState<Set<number>>(new Set());
  const [expandedDistProducts, setExpandedDistProducts] = useState<Set<number>>(new Set());
  const [expandedOutletStockProducts, setExpandedOutletStockProducts] = useState<Set<number>>(new Set());
  const outlets = useLiveQuery(() => db.outlets.toArray()) || [];

  const toggleOutletStockProduct = (id: number) => {
    const newSet = new Set(expandedOutletStockProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedOutletStockProducts(newSet);
  };

  const toggleDistProduct = (id: number) => {
    const newSet = new Set(expandedDistProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedDistProducts(newSet);
  };

  const toggleSalesProduct = (id: number) => {
    const newSet = new Set(expandedSalesProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedSalesProducts(newSet);
  };

  const toggleSalesOutlet = (id: number) => {
    const newSet = new Set(expandedSalesOutlets);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedSalesOutlets(newSet);
  };

  const toggleStockProduct = (id: number) => {
    const newSet = new Set(expandedStockProducts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedStockProducts(newSet);
  };

  const toggleStockOutlet = (id: number) => {
    const newSet = new Set(expandedStockOutlets);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setExpandedStockOutlets(newSet);
  };

  const totalGodownStock = products.reduce((sum, p) => sum + getGodownStock(p.id!), 0);
  const totalOutletStock = products.reduce((sum, p) => sum + getOutletStock(p.id!), 0);
  const totalStock = totalGodownStock + totalOutletStock;

  const start = startOfDay(new Date(startDate));
  const end = endOfDay(new Date(endDate));

  const periodSales = [...sales, ...outletSales].filter(s => {
    const saleDate = new Date(s.date);
    return saleDate >= start && saleDate <= end && s.note !== 'Outlet Distribution';
  }).reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

  const periodDistribution = sales.filter(s => {
    const saleDate = new Date(s.date);
    return saleDate >= start && saleDate <= end && s.note === 'Outlet Distribution';
  }).reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

  const damages = useLiveQuery(() => db.damages.toArray()) || [];
  const periodDamage = damages.filter(d => {
    const damageDate = new Date(d.date);
    return damageDate >= start && damageDate <= end;
  }).reduce((sum, d) => sum + d.quantity, 0);

  const stats = [
    {
      type: 'godown',
      label: 'মেইন গোডাউন স্টক',
      value: totalGodownStock,
      icon: Package,
      color: 'bg-blue-600',
      unit: 'শলাকা/পিচ'
    },
    {
      type: 'outlet',
      label: 'আউটলেট স্টক',
      value: totalOutletStock,
      icon: Store,
      color: 'bg-purple-600',
      unit: 'শলাকা/পিচ'
    },
    {
      type: 'total',
      label: 'সর্বমোট (মূল) স্টক',
      value: totalStock,
      icon: Scale,
      color: 'bg-gray-800',
      unit: 'শলাকা/পিচ'
    },
    {
      type: 'sales',
      label: startDate === endDate ? TRANSLATIONS.todaySales : 'নির্ধারিত সময়ের বিক্রয়',
      value: periodSales,
      icon: TrendingUp,
      color: 'bg-green-600',
      unit: 'শলাকা/পিচ'
    },
    {
      type: 'distribution',
      label: startDate === endDate ? 'আজকের বিতরণ' : 'নির্ধারিত সময়ের বিতরণ',
      value: periodDistribution,
      icon: Truck,
      color: 'bg-red-600',
      unit: 'শলাকা/পিচ'
    },
    {
      type: 'damage',
      label: startDate === endDate ? 'আজকের ড্যামেজ' : 'নির্ধারিত সময়ের ড্যামেজ',
      value: periodDamage,
      icon: AlertTriangle,
      color: 'bg-red-500',
      unit: 'শলাকা/পিচ'
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Date Range Picker */}
      <div className="bg-white dark:bg-black p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3 transition-colors duration-300">
        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
          <Calendar size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">তারিখ নির্বাচন করুন</span>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={() => onNavigate('reconciliation')}
          className="bg-white dark:bg-black p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all active:scale-95"
        >
          <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-xl text-purple-600 dark:text-purple-400">
            <Scale size={24} />
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">স্টক মিলকরণ</span>
        </button>
        <button 
          onClick={() => onNavigate('damage')}
          className="bg-white dark:bg-black p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-all active:scale-95"
        >
          <div className="bg-red-100 dark:bg-red-900/30 p-3 rounded-xl text-red-600 dark:text-red-400">
            <AlertTriangle size={24} />
          </div>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">ড্যামেজ এন্ট্রি</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="flex flex-col bg-white dark:bg-black rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
            <div 
              className="p-6 flex items-center gap-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors"
              onClick={() => {
                if (stat.type === 'godown') setShowGodownDetails(!showGodownDetails);
                if (stat.type === 'outlet') setShowOutletDetails(!showOutletDetails);
                if (stat.type === 'total') setShowTotalDetails(!showTotalDetails);
                if (stat.type === 'sales') setShowSalesDetails(!showSalesDetails);
                if (stat.type === 'distribution') setShowDistributionDetails(!showDistributionDetails);
                if (stat.type === 'damage') setShowDamageDetails(!showDamageDetails);
              }}
            >
              <div className={`${stat.color} p-4 rounded-2xl text-white shadow-lg`}>
                <stat.icon size={28} />
              </div>
              <div className="flex-1">
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {stat.value} {stat.unit && <span className="text-sm font-normal text-gray-400 dark:text-gray-500">{stat.unit}</span>}
                </p>
              </div>
              <div className="p-2 text-gray-400 dark:text-gray-500">
                {(
                  (stat.type === 'godown' && showGodownDetails) ||
                  (stat.type === 'outlet' && showOutletDetails) ||
                  (stat.type === 'total' && showTotalDetails) ||
                  (stat.type === 'sales' && showSalesDetails) ||
                  (stat.type === 'distribution' && showDistributionDetails)
                ) ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
              </div>
            </div>
            
            {stat.type === 'godown' && showGodownDetails && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">পণ্য অনুযায়ী স্টক</span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {products.map(product => {
                    const stock = getGodownStock(product.id!);
                    if (stock === 0) return null;
                    return (
                      <div key={product.id} className="p-3 flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{product.name}</span>
                        <span className="font-bold text-gray-800 dark:text-white">{stock} {product.unit}</span>
                      </div>
                    );
                  })}
                  {products.every(p => getGodownStock(p.id!) === 0) && (
                    <p className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">গোডাউনে কোনো স্টক নেই</p>
                  )}
                </div>
              </div>
            )}

            {stat.type === 'outlet' && showOutletDetails && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">পণ্য অনুযায়ী আউটলেট স্টক</span>
                </div>
                <div className="space-y-2">
                  {products.map(product => {
                    const totalOutletStock = getOutletStock(product.id!);
                    if (totalOutletStock === 0) return null;
                    const isExpanded = expandedOutletStockProducts.has(product.id!);

                    return (
                      <div key={product.id} className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button 
                          onClick={() => toggleOutletStockProduct(product.id!)}
                          className="w-full p-3 flex justify-between items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-purple-600 dark:text-purple-400">{totalOutletStock} {product.unit}</span>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 p-3 space-y-1 animate-in slide-in-from-top-1 duration-200">
                            {outlets.map(outlet => {
                              const stock = getOutletStock(product.id!, outlet.id);
                              if (stock === 0) return null;
                              return (
                                <div key={outlet.id} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500 dark:text-gray-400">{outlet.name}</span>
                                  <span className="font-bold text-gray-700 dark:text-gray-200">{stock} {product.unit}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {totalOutletStock === 0 && (
                    <p className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">আউটলেটে কোনো স্টক নেই</p>
                  )}
                </div>
              </div>
            )}

            {stat.type === 'total' && showTotalDetails && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">পণ্য অনুযায়ী সর্বমোট স্টক</span>
                </div>
                <div className="space-y-2">
                  {products.map(product => {
                    const totalStock = getProductStock(product.id!);
                    if (totalStock === 0) return null;
                    const godownStock = getGodownStock(product.id!);
                    const outletStock = getOutletStock(product.id!);
                    const isExpanded = expandedStockProducts.has(product.id!);

                    return (
                      <div key={product.id} className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button 
                          onClick={() => toggleStockProduct(product.id!)}
                          className="w-full p-3 flex justify-between items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 dark:text-white">{totalStock} {product.unit}</span>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 p-3 space-y-2 animate-in slide-in-from-top-1 duration-200">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-500 dark:text-gray-400">মেইন গোডাউন</span>
                              <span className="font-bold text-gray-700 dark:text-gray-200">{godownStock} {product.unit}</span>
                            </div>
                            
                            <div className="space-y-1">
                              <button 
                                onClick={() => toggleStockOutlet(product.id!)}
                                className="w-full flex justify-between items-center text-xs hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <span className="text-gray-500 dark:text-gray-400">আউটলেট স্টক</span>
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-gray-700 dark:text-gray-200">{outletStock} {product.unit}</span>
                                  {expandedStockOutlets.has(product.id!) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </div>
                              </button>
                              
                              {expandedStockOutlets.has(product.id!) && (
                                <div className="pl-4 pt-1 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 ml-1">
                                  {outlets.map(outlet => {
                                    const stock = getOutletStock(product.id!, outlet.id);
                                    if (stock === 0) return null;
                                    return (
                                      <div key={outlet.id} className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-400 dark:text-gray-500">{outlet.name}</span>
                                        <span className="font-bold text-gray-600 dark:text-gray-400">{stock} {product.unit}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {products.every(p => getProductStock(p.id!) === 0) && (
                    <p className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">কোনো স্টক নেই</p>
                  )}
                </div>
              </div>
            )}

            {stat.type === 'sales' && showSalesDetails && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">পণ্য অনুযায়ী বিক্রয়</span>
                </div>
                <div className="space-y-2">
                  {products.map(product => {
                    // Godown Sales
                    const godownSalesQty = sales.filter(s => {
                      const saleDate = new Date(s.date);
                      return s.productId === product.id && saleDate >= start && saleDate <= end && s.note !== 'Outlet Distribution';
                    }).reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);

                    // Outlet Sales
                    const outletSalesData = outlets.map(outlet => {
                      const qty = outletSales.filter(s => {
                        const saleDate = new Date(s.date);
                        return s.productId === product.id && s.outletId === outlet.id && saleDate >= start && saleDate <= end;
                      }).reduce((sum, s) => sum + s.quantity + (s.freeQuantity || 0), 0);
                      return { name: outlet.name, qty };
                    }).filter(o => o.qty > 0);

                    const totalProductSales = godownSalesQty + outletSalesData.reduce((sum, o) => sum + o.qty, 0);
                    if (totalProductSales === 0) return null;

                    const isExpanded = expandedSalesProducts.has(product.id!);

                    return (
                      <div key={product.id} className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button 
                          onClick={() => toggleSalesProduct(product.id!)}
                          className="w-full p-3 flex justify-between items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 dark:text-white">{totalProductSales} {product.unit}</span>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 p-3 space-y-1 animate-in slide-in-from-top-1 duration-200">
                            {godownSalesQty > 0 && (
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 dark:text-gray-400">মেইন গোডাউন</span>
                                <span className="font-bold text-gray-700 dark:text-gray-200">{godownSalesQty} {product.unit}</span>
                              </div>
                            )}
                            {outletSalesData.map((data, idx) => (
                              <div key={idx} className="flex justify-between items-center text-xs">
                                <span className="text-gray-500 dark:text-gray-400">{data.name}</span>
                                <span className="font-bold text-gray-700 dark:text-gray-200">{data.qty} {product.unit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {periodSales === 0 && (
                    <p className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">এই সময়ে কোনো বিক্রয় নেই</p>
                  )}
                </div>
              </div>
            )}

            {stat.type === 'distribution' && showDistributionDetails && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">পণ্য অনুযায়ী বিতরণ</span>
                </div>
                <div className="space-y-2">
                  {products.map(product => {
                    const productDist = sales.filter(s => {
                      const saleDate = new Date(s.date);
                      return s.productId === product.id && saleDate >= start && saleDate <= end && s.note === 'Outlet Distribution';
                    });
                    const totalQty = productDist.reduce((sum, s) => sum + s.quantity, 0);
                    
                    if (totalQty === 0) return null;
                    const isExpanded = expandedDistProducts.has(product.id!);

                    return (
                      <div key={product.id} className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <button 
                          onClick={() => toggleDistProduct(product.id!)}
                          className="w-full p-3 flex justify-between items-center text-sm hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                        >
                          <span className="font-medium text-gray-700 dark:text-gray-300">{product.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-red-600 dark:text-red-400">{totalQty} {product.unit}</span>
                            {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="bg-gray-50/50 dark:bg-gray-900/40 border-t border-gray-100 dark:border-gray-700 p-3 space-y-1 animate-in slide-in-from-top-1 duration-200">
                            {outlets.map(outlet => {
                              const qty = productDist
                                .filter(s => s.outletId === outlet.id)
                                .reduce((sum, s) => sum + s.quantity, 0);
                              
                              if (qty === 0) return null;
                              return (
                                <div key={outlet.id} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500 dark:text-gray-400">{outlet.name}</span>
                                  <span className="font-bold text-gray-700 dark:text-gray-200">{qty} {product.unit}</span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {periodDistribution === 0 && (
                    <p className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">এই সময়ে কোনো বিতরণ নেই</p>
                  )}
                </div>
              </div>
            )}
            {stat.type === 'damage' && showDamageDetails && (
              <div className="px-6 pb-6 pt-2 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/20 space-y-2 animate-in slide-in-from-top-2 duration-300">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">পণ্য অনুযায়ী ড্যামেজ</span>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                  {products.map(product => {
                    const qty = damages.filter(d => {
                      const damageDate = new Date(d.date);
                      return d.productId === product.id && damageDate >= start && damageDate <= end;
                    }).reduce((sum, d) => sum + d.quantity, 0);
                    
                    if (qty === 0) return null;
                    return (
                      <div key={product.id} className="p-3 flex justify-between items-center text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{product.name}</span>
                        <span className="font-bold text-red-600 dark:text-red-400">{qty} {product.unit}</span>
                      </div>
                    );
                  })}
                  {periodDamage === 0 && (
                    <p className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">এই সময়ে কোনো ড্যামেজ নেই</p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3 text-red-600 dark:text-red-400">
            <AlertTriangle size={20} />
            <h2 className="font-bold">{TRANSLATIONS.lowStockAlert}</h2>
          </div>
          <div className="space-y-2">
            {lowStockProducts.map((p) => (
              <div key={p.id} className="bg-white dark:bg-black p-3 rounded-xl shadow-sm flex justify-between items-center border-l-4 border-red-500">
                <span className="font-medium text-gray-700 dark:text-gray-300">{p.name}</span>
                <span className="text-red-600 dark:text-red-400 font-bold">স্টক কম!</span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
