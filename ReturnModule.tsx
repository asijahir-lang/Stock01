import React, { useState } from 'react';
import { db } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { format } from 'date-fns';
import { Plus, X, Save, Trash2, RotateCcw } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import ConfirmModal from './ConfirmModal';

export default function ReturnModule() {
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const products = useLiveQuery(() => db.products.orderBy('order').toArray()) || [];
  const outlets = useLiveQuery(() => db.outlets.orderBy('order').toArray()) || [];
  const returns = useLiveQuery(() => 
    db.returns.orderBy('date').reverse().toArray().then(items => 
      Promise.all(items.map(async item => ({
        ...item,
        productName: (await db.products.get(item.productId))?.name || 'Unknown',
        outletName: (await db.outlets.get(item.outletId))?.name || 'Unknown',
        unit: (await db.products.get(item.productId))?.unit
      })))
    )
  ) || [];

  const [bulkData, setBulkData] = useState<{ [key: number]: string }>({});
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [outletId, setOutletId] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!outletId) {
      alert('অনুগ্রহ করে আউটলেট নির্বাচন করুন।');
      return;
    }

    const entries = Object.entries(bulkData)
      .filter(([_, qty]) => qty && Number(qty) > 0)
      .map(([productId, qty]) => ({
        productId: Number(productId),
        date,
        outletId: Number(outletId),
        quantity: Number(qty),
        note: ''
      }));

    if (entries.length === 0) return;

    await db.returns.bulkAdd(entries);

    setIsAdding(false);
    setBulkData({});
    setOutletId('');
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await db.returns.delete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TRANSLATIONS.returns}</h2>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-orange-600 text-white p-3 rounded-full shadow-lg hover:bg-orange-700 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-white dark:bg-black z-[100] p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">পণ্য ফেরৎ এন্ট্রি</h3>
            <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 dark:bg-gray-900 rounded-full text-gray-500 dark:text-gray-400">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6 pb-20">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{TRANSLATIONS.date}</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-colors"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-400">আউটলেট নির্বাচন করুন</label>
                <select
                  value={outletId}
                  onChange={(e) => setOutletId(e.target.value)}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-colors"
                  required
                >
                  <option value="">আউটলেট নির্বাচন করুন</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400">পণ্য অনুযায়ী ফেরৎ-এর পরিমাণ লিখুন:</label>
              {products.map((p) => (
                <div key={p.id} className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
                  <span className="font-bold text-gray-700 dark:text-gray-300">{p.name}</span>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={bulkData[p.id!] || ''}
                      onChange={(e) => setBulkData({ ...bulkData, [p.id!]: e.target.value })}
                      className="w-24 p-3 bg-white dark:bg-black border border-gray-200 dark:border-gray-700 rounded-lg text-center font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition-colors"
                      placeholder="০"
                    />
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-bold">{p.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full bg-orange-600 text-white p-5 rounded-2xl text-xl font-bold shadow-xl hover:bg-orange-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save size={24} />
              {TRANSLATIONS.save}
            </button>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {returns.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-black rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            {TRANSLATIONS.noData}
          </div>
        ) : (
          returns.map((item) => (
            <div key={item.id} className="bg-white dark:bg-black p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
              <div className="flex gap-4 items-center">
                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-xl text-orange-600 dark:text-orange-400">
                  <RotateCcw size={20} />
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
                <p className="font-bold text-orange-600 dark:text-orange-400">{item.quantity} {item.unit}</p>
                <button
                  onClick={() => handleDelete(item.id!)}
                  className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 mt-1 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="ফেরৎ এন্ট্রি মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি এটি মুছে ফেলতে চান?"
      />
    </div>
  );
}
