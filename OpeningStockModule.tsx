import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { Plus, X, Save, Trash2, Database } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmModal from './ConfirmModal';

export default function OpeningStockModule() {
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const products = useLiveQuery(() => db.products.orderBy('order').toArray()) || [];
  const openingStocks = useLiveQuery(() => 
    db.openingStocks.toArray().then(stocks => 
      Promise.all(stocks.map(async s => ({
        ...s,
        productName: (await db.products.get(s.productId))?.name,
        unit: (await db.products.get(s.productId))?.unit
      })))
    )
  ) || [];

  const [bulkData, setBulkData] = useState<{ [key: number]: string }>({});
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const entries = Object.entries(bulkData)
      .filter(([_, qty]) => qty && Number(qty) > 0)
      .map(([productId, qty]) => ({
        productId: Number(productId),
        date,
        quantity: Number(qty)
      }));

    if (entries.length === 0) return;

    for (const entry of entries) {
      const existing = await db.openingStocks.where('productId').equals(entry.productId).first();
      if (existing) {
        await db.openingStocks.update(existing.id!, { quantity: entry.quantity, date: entry.date });
      } else {
        await db.openingStocks.add(entry);
      }
    }

    setIsAdding(false);
    setBulkData({});
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await db.openingStocks.delete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TRANSLATIONS.openingStock}</h2>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <Plus size={20} />
          <h3 className="font-bold">নতুন ওপেনিং স্টক এন্ট্রি</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{TRANSLATIONS.date}</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">পণ্য অনুযায়ী পরিমাণ:</label>
            <div className="grid gap-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl border border-gray-100 dark:border-gray-600 transition-colors">
                  <span className="flex-1 text-sm font-bold text-gray-700 dark:text-gray-300">{p.name}</span>
                  <div className="w-24">
                    <input
                      type="number"
                      value={bulkData[p.id!] || ''}
                      onChange={(e) => setBulkData({ ...bulkData, [p.id!]: e.target.value })}
                      className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                      placeholder="০"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 w-8">{p.unit}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 text-white p-4 rounded-xl text-lg font-bold shadow-lg hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {TRANSLATIONS.save}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-gray-400 dark:text-gray-500 px-2">
          <Database size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">ওপেনিং স্টক হিস্ট্রি</span>
        </div>
        {openingStocks.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            {TRANSLATIONS.noData}
          </div>
        ) : (
          openingStocks.map((stock) => (
            <div key={stock.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
              <div>
                <p className="font-bold text-gray-800 dark:text-white text-lg">{stock.productName}</p>
                <div className="flex gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span>{stock.date}</span>
                  <span>•</span>
                  <span className="font-bold text-red-600 dark:text-red-400">{stock.quantity} {stock.unit}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(stock.id!)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))
        )}
      </div>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="ওপেনিং স্টক মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি এটি মুছে ফেলতে চান?"
      />
    </div>
  );
}
