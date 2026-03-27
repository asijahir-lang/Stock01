import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { Plus, X, Save, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import ConfirmModal from './ConfirmModal';

export default function ReceiveModule() {
  const [isAdding, setIsAdding] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const products = useLiveQuery(() => db.products.orderBy('order').toArray()) || [];
  const receives = useLiveQuery(() => 
    db.receives.toArray().then(items => 
      Promise.all(items.map(async i => ({
        ...i,
        productName: (await db.products.get(i.productId))?.name,
        unit: (await db.products.get(i.productId))?.unit
      })))
    )
  ) || [];

  const [bulkData, setBulkData] = useState<{ [key: number]: { quantity: string, freeQuantity: string } }>({});
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplier, setSupplier] = useState('আকিজ গ্রুপ');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const entries = Object.entries(bulkData)
      .filter(([_, data]) => (data.quantity && Number(data.quantity) > 0) || (data.freeQuantity && Number(data.freeQuantity) > 0))
      .map(([productId, data]) => ({
        productId: Number(productId),
        date,
        invoiceNumber,
        quantity: Number(data.quantity || 0),
        freeQuantity: Number(data.freeQuantity || 0),
        supplier,
        note: ''
      }));

    if (entries.length === 0) return;

    await db.receives.bulkAdd(entries);

    setIsAdding(false);
    setBulkData({});
    setInvoiceNumber('');
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await db.receives.delete(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TRANSLATIONS.receive}</h2>
      </div>

      <div className="bg-white dark:bg-black p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400 mb-2">
          <Plus size={20} />
          <h3 className="font-bold">নতুন পণ্য গ্রহণ এন্ট্রি</h3>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{TRANSLATIONS.invoiceNumber}</label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                placeholder="INV-001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{TRANSLATIONS.supplier}</label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">পণ্য অনুযায়ী পরিমাণ:</label>
            <div className="grid gap-2">
              {products.map((p) => (
                <div key={p.id} className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 space-y-2 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{p.name}</span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{p.unit}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">পরিমাণ</span>
                      <input
                        type="number"
                        value={bulkData[p.id!]?.quantity || ''}
                        onChange={(e) => setBulkData({ 
                          ...bulkData, 
                          [p.id!]: { ...bulkData[p.id!], quantity: e.target.value } 
                        })}
                        className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                        placeholder="০"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">ফ্রি</span>
                      <input
                        type="number"
                        value={bulkData[p.id!]?.freeQuantity || ''}
                        onChange={(e) => setBulkData({ 
                          ...bulkData, 
                          [p.id!]: { ...bulkData[p.id!], freeQuantity: e.target.value } 
                        })}
                        className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-center font-bold text-sm text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                        placeholder="০"
                      />
                    </div>
                  </div>
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
          <FileText size={16} />
          <span className="text-xs font-bold uppercase tracking-wider">রিসিভ হিস্ট্রি</span>
        </div>
        {receives.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-white dark:bg-black rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
            {TRANSLATIONS.noData}
          </div>
        ) : (
          receives.map((item) => (
            <div key={item.id} className="bg-white dark:bg-black p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
              <div className="flex gap-4 items-center">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl text-blue-600 dark:text-blue-400">
                  <FileText size={20} />
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white">{item.productName}</p>
                  <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    <span>{item.date}</span>
                    <span>•</span>
                    <span>{item.invoiceNumber || 'No Invoice'}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-blue-600 dark:text-blue-400">+{item.quantity} {item.unit}</p>
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
        title="এন্ট্রি মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি এটি মুছে ফেলতে চান?"
      />
    </div>
  );
}
