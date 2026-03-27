import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { useStock } from '../hooks/useStock';
import { Plus, X, Save, Trash2, ShoppingBag, Store } from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ConfirmModal from './ConfirmModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function SalesModule() {
  const { getGodownStock, getOutletStock } = useStock();
  const products = useLiveQuery(() => db.products.orderBy('order').toArray()) || [];
  const outlets = useLiveQuery(() => db.outlets.orderBy('order').toArray()) || [];
  
  const salesHistory = useLiveQuery(async () => {
    const godownSales = await db.sales.where('note').notEqual('Outlet Distribution').toArray();
    const outletSales = await db.outletSales.toArray();
    
    const allSales = [
      ...godownSales.map(s => ({ ...s, type: 'godown' })),
      ...outletSales.map(s => ({ ...s, type: 'outlet' }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return Promise.all(allSales.map(async i => ({
      ...i,
      productName: (await db.products.get(i.productId))?.name,
      outletName: i.outletId ? (await db.outlets.get(i.outletId))?.name : undefined
    })));
  }) || [];

  const [transactionType, setTransactionType] = useState<'direct' | 'outlet'>('direct');
  const [bulkData, setBulkData] = useState<{ [key: number]: { quantity: string, freeQuantity: string } }>({});
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [customerName, setCustomerName] = useState('');
  const [selectedOutletId, setSelectedOutletId] = useState<number | ''>('');
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (transactionType === 'outlet' && !selectedOutletId) {
      alert('অনুগ্রহ করে আউটলেট নির্বাচন করুন।');
      return;
    }

    if (transactionType === 'direct' && !customerName) {
      alert('অনুগ্রহ করে কাস্টমারের নাম লিখুন।');
      return;
    }

    const entries = Object.entries(bulkData)
      .filter(([_, data]) => (data.quantity && Number(data.quantity) > 0) || (data.freeQuantity && Number(data.freeQuantity) > 0))
      .map(([productId, data]) => ({
        productId: Number(productId),
        date,
        customerName: transactionType === 'outlet' ? 'আউটলেট কাস্টমার' : customerName,
        outletId: transactionType === 'outlet' ? Number(selectedOutletId) : undefined,
        quantity: Number(data.quantity || 0),
        freeQuantity: Number(data.freeQuantity || 0),
        paymentType: undefined,
        note: transactionType === 'outlet' ? `Sale from Outlet` : 'Direct Sale from Godown'
      }));

    if (entries.length === 0) return;

    // Check stock
    for (const entry of entries) {
      const stock = transactionType === 'outlet' 
        ? getOutletStock(entry.productId, entry.outletId)
        : getGodownStock(entry.productId);
      
      if ((entry.quantity + (entry.freeQuantity || 0)) > stock) {
        alert(`দুঃখিত! ${products.find(p => p.id === entry.productId)?.name} এর পর্যাপ্ত স্টক নেই। (বর্তমান স্টক: ${stock})`);
        return;
      }
    }

    try {
      if (transactionType === 'outlet') {
        await db.outletSales.bulkAdd(entries);
      } else {
        await db.sales.bulkAdd(entries);
      }
      setBulkData({});
      setCustomerName('');
      setSelectedOutletId('');
    } catch (err) {
      console.error('Sale failed:', err);
      alert('দুঃখিত! বিক্রয় সম্পন্ন করা যায়নি।');
    }
  };

  const handleDelete = async (item: any) => {
    setDeleteItem(item);
  };

  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        if (deleteItem.type === 'outlet') {
          await db.outletSales.delete(deleteItem.id!);
        } else {
          await db.sales.delete(deleteItem.id!);
        }
        setDeleteItem(null);
      } catch (err) {
        console.error('Delete failed:', err);
        alert('মুছে ফেলা সম্ভব হয়নি।');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TRANSLATIONS.sales}</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setTransactionType('direct')}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
              transactionType === 'direct' ? "bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm" : "text-gray-500 dark:text-gray-400"
            )}
          >
            গোডাউন বিক্রয়
          </button>
          <button
            onClick={() => setTransactionType('outlet')}
            className={cn(
              "flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
              transactionType === 'outlet' ? "bg-white dark:bg-gray-600 text-purple-600 dark:text-purple-400 shadow-sm" : "text-gray-500 dark:text-gray-400"
            )}
          >
            আউটলেট বিক্রয়
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {transactionType === 'outlet' ? (
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-400">আউটলেট নির্বাচন করুন</label>
                <select
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl text-lg font-bold text-purple-700 dark:text-purple-300 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                  required
                >
                  <option value="">আউটলেট নির্বাচন করুন</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-400">কাস্টমারের নাম</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl text-lg font-bold text-green-700 dark:text-green-300 focus:ring-2 focus:ring-green-500 outline-none transition-colors"
                  placeholder="কাস্টমারের নাম লিখুন"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{TRANSLATIONS.date}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-gray-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400">পণ্য অনুযায়ী বিক্রয়ের পরিমাণ লিখুন:</label>
            {products.map((p) => {
              const stock = transactionType === 'outlet' 
                ? getOutletStock(p.id!, Number(selectedOutletId))
                : getGodownStock(p.id!);
              return (
                <div key={p.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600 space-y-3 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-700 dark:text-gray-300 block">{p.name}</span>
                      <span className={cn(
                        "text-xs font-bold",
                        transactionType === 'outlet' ? "text-purple-600 dark:text-purple-400" : "text-green-600 dark:text-green-400"
                      )}>
                        স্টক: {stock} {p.unit}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">পরিমাণ ({p.unit})</span>
                      <input
                        type="number"
                        value={bulkData[p.id!]?.quantity || ''}
                        onChange={(e) => setBulkData({ 
                          ...bulkData, 
                          [p.id!]: { ...bulkData[p.id!], quantity: e.target.value } 
                        })}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-gray-500 outline-none transition-colors"
                        placeholder="০"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">ফ্রি ({p.unit})</span>
                      <input
                        type="number"
                        value={bulkData[p.id!]?.freeQuantity || ''}
                        onChange={(e) => setBulkData({ 
                          ...bulkData, 
                          [p.id!]: { ...bulkData[p.id!], freeQuantity: e.target.value } 
                        })}
                        className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-gray-500 outline-none transition-colors"
                        placeholder="০"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="submit"
            className={cn(
              "w-full text-white p-5 rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2",
              transactionType === 'outlet' ? "bg-purple-600 hover:bg-purple-700" : "bg-green-600 hover:bg-green-700"
            )}
          >
            <Save size={24} />
            বিক্রয় সম্পন্ন করুন
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {salesHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            {TRANSLATIONS.noData}
          </div>
        ) : (
          salesHistory.map((item: any) => (
            <div key={`${item.type}-${item.id}`} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
              <div className="flex gap-4 items-center">
                <div className={cn(
                  "p-3 rounded-xl",
                  item.type === 'outlet' ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" : 
                  item.outletId ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" : "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                )}>
                  <ShoppingBag size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white">{item.productName}</p>
                  <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.customerName}</span>
                    {item.type === 'outlet' && <span className="text-purple-500 dark:text-purple-400 font-bold">(আউটলেট)</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className={cn(
                    "font-bold",
                    item.type === 'outlet' ? "text-purple-600 dark:text-purple-400" : 
                    item.outletId ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"
                  )}>{item.quantity} {products.find(p => p.id === item.productId)?.unit}</span>
                  {item.freeQuantity ? <span className="text-gray-400 dark:text-gray-500 font-bold text-[10px]">+{item.freeQuantity} ফ্রি</span> : null}
                  <button
                    onClick={() => handleDelete(item)}
                    className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={confirmDelete}
        title="বিক্রয় এন্ট্রি মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি এটি মুছে ফেলতে চান?"
      />
    </div>
  );
}
