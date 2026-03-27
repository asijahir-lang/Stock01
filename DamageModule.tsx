import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { useStock } from '../hooks/useStock';
import { Save, Trash2, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ConfirmModal from './ConfirmModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function DamageModule() {
  const { getGodownStock } = useStock();
  const products = useLiveQuery(() => db.products.orderBy('order').toArray()) || [];
  
  const damageHistory = useLiveQuery(async () => {
    const items = await db.damages.where('outletId').equals(0).or('outletId').notEqual(0).toArray(); // This is tricky with Dexie, let's just get all and filter
    const all = await db.damages.toArray();
    const godownDamages = all.filter(d => !d.outletId);
    
    return Promise.all(godownDamages.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(async i => ({
      ...i,
      productName: (await db.products.get(i.productId))?.name
    })));
  }) || [];

  const [bulkData, setBulkData] = useState<{ [key: number]: { quantity: string, note: string } }>({});
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const entries = Object.entries(bulkData)
      .filter(([_, data]) => data.quantity && Number(data.quantity) > 0)
      .map(([productId, data]) => ({
        productId: Number(productId),
        date,
        quantity: Number(data.quantity || 0),
        note: data.note || 'Godown Damage'
      }));

    if (entries.length === 0) return;

    // Check stock
    for (const entry of entries) {
      const stock = getGodownStock(entry.productId);
      if (entry.quantity > stock) {
        alert(`দুঃখিত! ${products.find(p => p.id === entry.productId)?.name} এর পর্যাপ্ত স্টক নেই। (বর্তমান স্টক: ${stock})`);
        return;
      }
    }

    try {
      await db.damages.bulkAdd(entries);
      setBulkData({});
    } catch (err) {
      console.error('Damage entry failed:', err);
      alert('দুঃখিত! ড্যামেজ এন্ট্রি সম্পন্ন করা যায়নি।');
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      try {
        await db.damages.delete(deleteId);
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
        <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
          {TRANSLATIONS.damage} (গোডাউন)
        </h2>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{TRANSLATIONS.date}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">পণ্য অনুযায়ী ড্যামেজ পরিমাণ:</label>
            <div className="grid gap-3">
              {products.map((p) => {
                const stock = getGodownStock(p.id!);
                return (
                  <div key={p.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600 space-y-3 transition-colors">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700 dark:text-gray-300">{p.name}</span>
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">গোডাউন স্টক: {stock} {p.unit}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">পরিমাণ</span>
                        <input
                          type="number"
                          value={bulkData[p.id!]?.quantity || ''}
                          onChange={(e) => setBulkData({ 
                            ...bulkData, 
                            [p.id!]: { ...bulkData[p.id!], quantity: e.target.value } 
                          })}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                          placeholder="০"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">কারণ/নোট</span>
                        <input
                          type="text"
                          value={bulkData[p.id!]?.note || ''}
                          onChange={(e) => setBulkData({ 
                            ...bulkData, 
                            [p.id!]: { ...bulkData[p.id!], note: e.target.value } 
                          })}
                          className="w-full p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                          placeholder="কারণ লিখুন..."
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full text-white p-5 rounded-2xl text-xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700"
          >
            <Save size={24} />
            ড্যামেজ এন্ট্রি করুন
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider ml-1">সাম্প্রতিক ড্যামেজ এন্ট্রি</h3>
        {damageHistory.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            {TRANSLATIONS.noData}
          </div>
        ) : (
          damageHistory.map((item: any) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
              <div className="flex gap-4 items-center">
                <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white">{item.productName}</p>
                  <div className="flex gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-bold">
                    <span>{item.date}</span>
                    {item.note && (
                      <>
                        <span>•</span>
                        <span className="text-red-400 dark:text-red-300 italic">{item.note}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex flex-col items-end gap-1">
                  <span className="font-bold text-red-600 dark:text-red-400">-{item.quantity} {products.find(p => p.id === item.productId)?.unit}</span>
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
        title="ড্যামেজ এন্ট্রি মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি এই ড্যামেজ এন্ট্রিটি মুছে ফেলতে চান?"
      />
    </div>
  );
}
