import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { useStock } from '../hooks/useStock';
import { Save, Trash2, Truck } from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ConfirmModal from './ConfirmModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DistributionModule() {
  const { getGodownStock } = useStock();
  const products = useLiveQuery(() => db.products.orderBy('order').toArray()) || [];
  const outlets = useLiveQuery(() => db.outlets.orderBy('order').toArray()) || [];
  
  const distributionHistory = useLiveQuery(async () => {
    const sales = await db.sales.where('note').equals('Outlet Distribution').toArray();
    
    return Promise.all(sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(async i => ({
      ...i,
      productName: (await db.products.get(i.productId))?.name,
      outletName: i.outletId ? (await db.outlets.get(i.outletId))?.name : undefined
    })));
  }) || [];

  const [bulkData, setBulkData] = useState<{ [key: number]: { quantity: string, freeQuantity: string } }>({});
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedOutletId, setSelectedOutletId] = useState<number | ''>('');
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOutletId) {
      alert('অনুগ্রহ করে আউটলেট নির্বাচন করুন।');
      return;
    }

    const entries = Object.entries(bulkData)
      .filter(([_, data]) => (data.quantity && Number(data.quantity) > 0) || (data.freeQuantity && Number(data.freeQuantity) > 0))
      .map(([productId, data]) => ({
        productId: Number(productId),
        date,
        customerName: outlets.find(o => o.id === Number(selectedOutletId))?.name || 'Distribution',
        outletId: Number(selectedOutletId),
        quantity: Number(data.quantity || 0),
        freeQuantity: Number(data.freeQuantity || 0),
        paymentType: undefined,
        price: 0,
        note: `Outlet Distribution`
      }));

    if (entries.length === 0) return;

    // Check stock
    for (const entry of entries) {
      const stock = getGodownStock(entry.productId);
      if ((entry.quantity + (entry.freeQuantity || 0)) > stock) {
        alert(`দুঃখিত! ${products.find(p => p.id === entry.productId)?.name} এর পর্যাপ্ত স্টক নেই। (বর্তমান স্টক: ${stock})`);
        return;
      }
    }

    try {
      await db.sales.bulkAdd(entries);
      setBulkData({});
      setSelectedOutletId('');
    } catch (err) {
      console.error('Distribution failed:', err);
      alert('দুঃখিত! বিতরণ সম্পন্ন করা যায়নি।');
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await db.sales.delete(deleteId);
        setDeleteId(null);
      } catch (err) {
        console.error('Delete failed:', err);
        alert('মুছে ফেলা সম্ভব হয়নি।');
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TRANSLATIONS.distribution}</h2>
      </div>

      <div className="bg-white dark:bg-black p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400">আউটলেট নির্বাচন করুন</label>
              <select
                value={selectedOutletId}
                onChange={(e) => setSelectedOutletId(e.target.value ? Number(e.target.value) : '')}
                className="w-full p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-lg font-bold text-red-700 dark:text-red-300 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                required
              >
                <option value="">আউটলেট নির্বাচন করুন</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{TRANSLATIONS.date}</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-gray-500 outline-none transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400">পণ্য অনুযায়ী বিতরণের পরিমাণ লিখুন:</label>
            {products.map((p) => {
              const stock = getGodownStock(p.id!);
              return (
                <div key={p.id} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 space-y-3 transition-colors">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold text-gray-700 dark:text-gray-300 block">{p.name}</span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">স্টক: {stock} {p.unit}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
            className="w-full text-white p-5 rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Save size={24} />
            বিতরণ সম্পন্ন করুন
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {distributionHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-black rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            {TRANSLATIONS.noData}
          </div>
        ) : (
          distributionHistory.map((item: any) => (
            <div key={item.id} className="bg-white dark:bg-black p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
              <div className="flex gap-4 items-center">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl">
                  <Truck size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white">{item.productName}</p>
                  <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.outletName}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-red-600 dark:text-red-400">{item.quantity} {products.find(p => p.id === item.productId)?.unit}</span>
                  {item.freeQuantity > 0 && <span className="text-gray-400 dark:text-gray-500 font-bold text-[10px]">+{item.freeQuantity} ফ্রি</span>}
                  <button
                    onClick={() => handleDelete(item.id!)}
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
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="বিতরণ এন্ট্রি মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি এটি মুছে ফেলতে চান?"
      />
    </div>
  );
}
