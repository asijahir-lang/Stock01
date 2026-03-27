import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useStock } from '../hooks/useStock';
import { TRANSLATIONS } from '../constants';
import { Scale, Package, AlertTriangle, Save, History } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function ReconciliationModule() {
  const { products, getGodownStock, getOutletStock } = useStock();
  const [bulkData, setBulkData] = useState<{ [key: number]: { physical: string, damage: string, dhara: string } }>({});
  const [showHistory, setShowHistory] = useState(false);

  const reconciliations = useLiveQuery(() => 
    db.reconciliations.reverse().toArray()
  ) || [];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    
    const entries = [];
    const damageEntries = [];

    for (const [productId, data] of Object.entries(bulkData)) {
      if (data.physical === '' && data.damage === '' && data.dhara === '') continue;

      const pId = Number(productId);
      const godownStock = getGodownStock(pId);
      const totalDamage = Number(data.damage || 0) + Number(data.dhara || 0);
      
      // Calculate diff so that: godownStock - totalDamage + diff = physical
      const diff = Number(data.physical || 0) - (godownStock - totalDamage);

      if (totalDamage > 0) {
        damageEntries.push({
          productId: pId,
          quantity: totalDamage,
          date: today,
          note: `মিলকরণ: ড্যামেজ ${data.damage || 0}, ধরা ${data.dhara || 0}`
        });
      }

      entries.push({
        productId: pId,
        date: new Date().toISOString(),
        physicalQuantity: Number(data.physical || 0),
        damageQuantity: Number(data.damage || 0),
        dharaQuantity: Number(data.dhara || 0),
        difference: diff,
        note: 'ম্যানুয়াল মিলকরণ'
      });
    }

    if (entries.length === 0) return;

    try {
      if (damageEntries.length > 0) {
        await db.damages.bulkAdd(damageEntries);
      }
      await db.reconciliations.bulkAdd(entries);
      setBulkData({});
      alert('মিলকরণ তথ্য সংরক্ষিত হয়েছে।');
    } catch (err) {
      console.error('Reconciliation failed:', err);
      alert('দুঃখিত! মিলকরণ সম্পন্ন করা যায়নি।');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TRANSLATIONS.reconciliation}</h2>
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          {showHistory ? <Scale size={24} /> : <History size={24} />}
        </button>
      </div>

      {!showHistory ? (
        <div className="space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-4">
              {products.map((p) => {
                const productId = p.id!;
                const godownStock = getGodownStock(productId);
                const outletStock = getOutletStock(productId);

                const data = bulkData[productId] || { physical: '', damage: '', dhara: '' };
                const expectedStock = godownStock - Number(data.damage || 0) - Number(data.dhara || 0);
                const diff = data.physical !== '' ? Number(data.physical) - expectedStock : null;

                return (
                  <div key={productId} className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">{p.name}</h3>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">মূল: {godownStock}</span>
                          <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full">আউটলেট: {outletStock}</span>
                        </div>
                      </div>
                      {diff !== null && (
                        <div className={cn(
                          "px-3 py-1 rounded-full text-xs font-black transition-colors",
                          diff === 0 ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                          diff < 0 ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400" :
                          "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        )}>
                          পার্থক্য: {diff > 0 ? `+${diff}` : diff}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">বাস্তব স্টক</label>
                        <input
                          type="number"
                          value={data.physical}
                          onChange={(e) => setBulkData({
                            ...bulkData,
                            [productId]: { ...data, physical: e.target.value }
                          })}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-center font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">ড্যামেজ</label>
                        <input
                          type="number"
                          value={data.damage}
                          onChange={(e) => setBulkData({
                            ...bulkData,
                            [productId]: { ...data, damage: e.target.value }
                          })}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-center font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                          placeholder="0"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">ধরা</label>
                        <input
                          type="number"
                          value={data.dhara}
                          onChange={(e) => setBulkData({
                            ...bulkData,
                            [productId]: { ...data, dhara: e.target.value }
                          })}
                          className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-center font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-5 rounded-2xl text-xl font-bold shadow-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save size={24} />
              সকল হিসাব সংরক্ষণ করুন
            </button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="font-bold text-gray-600 dark:text-gray-400 flex items-center gap-2 px-2">
            <History size={18} />
            মিলকরণ ইতিহাস
          </h3>
          {reconciliations.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
              কোনো ইতিহাস পাওয়া যায়নি।
            </div>
          ) : (
            reconciliations.map((r) => {
              const p = products.find(prod => prod.id === r.productId);
              return (
                <div key={r.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-800 dark:text-white">{p?.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(r.date).toLocaleString('bn-BD')}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-[10px] font-bold text-gray-500 dark:text-gray-400">
                      ID: #{r.id}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-xl text-center">
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">বাস্তব</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{r.physicalQuantity}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-xl text-center">
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">ড্যামেজ</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{r.damageQuantity}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-xl text-center">
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">ধরা</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{r.dharaQuantity}</p>
                    </div>
                    <div className={cn(
                      "p-2 rounded-xl text-center transition-colors",
                      r.difference === 0 ? "bg-green-50 dark:bg-green-900/20" :
                      r.difference < 0 ? "bg-red-50 dark:bg-red-900/20" : "bg-blue-50 dark:bg-blue-900/20"
                    )}>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">পার্থক্য</p>
                      <p className={cn(
                        "text-sm font-bold",
                        r.difference === 0 ? "text-green-700 dark:text-green-400" :
                        r.difference < 0 ? "text-red-700 dark:text-red-400" : "text-blue-700 dark:text-blue-400"
                      )}>
                        {r.difference > 0 ? `+${r.difference}` : r.difference}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
