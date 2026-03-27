import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { 
  Trash2, 
  Edit2, 
  Search, 
  Calendar, 
  Package, 
  ShoppingCart, 
  Truck, 
  RotateCcw, 
  Scale, 
  Database,
  X,
  Save,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ConfirmModal from './ConfirmModal';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type TransactionType = 'sales' | 'distribution' | 'outletSales' | 'receive' | 'returns' | 'reconciliation' | 'opening' | 'damage';

export default function EditModule() {
  const [type, setType] = useState<TransactionType>('sales');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const products = useLiveQuery(() => db.products.toArray()) || [];
  const outlets = useLiveQuery(() => db.outlets.toArray()) || [];

  const data = useLiveQuery(async () => {
    let items: any[] = [];
    switch (type) {
      case 'sales':
        items = await db.sales.where('note').notEqual('Outlet Distribution').toArray();
        break;
      case 'distribution':
        items = await db.sales.where('note').equals('Outlet Distribution').toArray();
        break;
      case 'outletSales':
        items = await db.outletSales.toArray();
        break;
      case 'receive':
        items = await db.receives.toArray();
        break;
      case 'returns':
        items = await db.returns.toArray();
        break;
      case 'reconciliation':
        items = await db.reconciliations.toArray();
        break;
      case 'opening':
        items = await db.openingStocks.toArray();
        break;
      case 'damage':
        items = await db.damages.toArray();
        break;
    }

    const sorted = items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    return Promise.all(sorted.map(async item => ({
      ...item,
      productName: products.find(p => p.id === item.productId)?.name || 'অজানা পণ্য',
      outletName: item.outletId ? outlets.find(o => o.id === item.outletId)?.name : (item.outletId === null ? 'মেইন গোডাউন' : undefined)
    })));
  }, [type, products, outlets]) || [];

  const filteredData = data.filter(item => 
    item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.customerName && item.customerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.invoiceNumber && item.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.outletName && item.outletName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.reason && item.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      switch (type) {
        case 'sales':
        case 'distribution':
          await db.sales.delete(deleteItem.id);
          break;
        case 'outletSales':
          await db.outletSales.delete(deleteItem.id);
          break;
        case 'receive':
          await db.receives.delete(deleteItem.id);
          break;
        case 'returns':
          await db.returns.delete(deleteItem.id);
          break;
        case 'reconciliation':
          await db.reconciliations.delete(deleteItem.id);
          break;
        case 'opening':
          await db.openingStocks.delete(deleteItem.id);
          break;
        case 'damage':
          await db.damages.delete(deleteItem.id);
          break;
      }
      setDeleteItem(null);
    } catch (err) {
      console.error('Delete failed:', err);
      alert('মুছে ফেলা সম্ভব হয়নি।');
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const { id, productName, outletName, ...updateData } = editingItem;
      // Ensure numeric fields are numbers
      if ('quantity' in updateData) updateData.quantity = Number(updateData.quantity);
      if ('freeQuantity' in updateData) updateData.freeQuantity = Number(updateData.freeQuantity);
      if ('price' in updateData) updateData.price = Number(updateData.price);
      if ('physicalQuantity' in updateData) updateData.physicalQuantity = Number(updateData.physicalQuantity);
      if ('damageQuantity' in updateData) updateData.damageQuantity = Number(updateData.damageQuantity);
      if ('dharaQuantity' in updateData) updateData.dharaQuantity = Number(updateData.dharaQuantity);
      if ('difference' in updateData) updateData.difference = Number(updateData.difference);

      switch (type) {
        case 'sales':
        case 'distribution':
          await db.sales.update(id, updateData);
          break;
        case 'outletSales':
          await db.outletSales.update(id, updateData);
          break;
        case 'receive':
          await db.receives.update(id, updateData);
          break;
        case 'returns':
          await db.returns.update(id, updateData);
          break;
        case 'reconciliation':
          await db.reconciliations.update(id, updateData);
          break;
        case 'opening':
          await db.openingStocks.update(id, updateData);
          break;
        case 'damage':
          await db.damages.update(id, updateData);
          break;
      }
      setEditingItem(null);
    } catch (err) {
      console.error('Update failed:', err);
      alert('আপডেট করা সম্ভব হয়নি।');
    }
  };

  const getIcon = (t: TransactionType) => {
    switch (t) {
      case 'sales': return <ShoppingCart size={18} />;
      case 'distribution': return <Truck size={18} />;
      case 'outletSales': return <ShoppingCart size={18} />;
      case 'receive': return <Package size={18} />;
      case 'returns': return <RotateCcw size={18} />;
      case 'reconciliation': return <Scale size={18} />;
      case 'opening': return <Database size={18} />;
      case 'damage': return <AlertTriangle size={18} />;
    }
  };

  const getLabel = (t: TransactionType) => {
    switch (t) {
      case 'sales': return 'বিক্রয়';
      case 'distribution': return 'বিতরণ';
      case 'outletSales': return 'আউটলেট বিক্রয়';
      case 'receive': return 'রিসিভ';
      case 'returns': return 'ফেরৎ';
      case 'reconciliation': return 'মিলকরণ';
      case 'opening': return 'ওপেনিং স্টক';
      case 'damage': return 'ড্যামেজ';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-4">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {(['sales', 'distribution', 'outletSales', 'receive', 'returns', 'reconciliation', 'opening', 'damage'] as TransactionType[]).map((t) => (
            <button
              key={t}
              onClick={() => { setType(t); setSearchTerm(''); }}
              className={cn(
                "flex-1 min-w-[100px] py-3 px-2 rounded-xl text-[10px] font-bold transition-all flex flex-col items-center justify-center gap-1",
                type === t ? "bg-white dark:bg-gray-700 text-red-600 dark:text-red-400 shadow-sm" : "text-gray-500 dark:text-gray-400"
              )}
            >
              {getIcon(t)}
              {getLabel(t)}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="পণ্য বা কাস্টমার দিয়ে খুঁজুন..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-700 dark:text-gray-200"
          />
        </div>
      </div>

      <div className="space-y-3 pb-20">
        {filteredData.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500 font-bold">
            {TRANSLATIONS.noData}
          </div>
        ) : (
          filteredData.map((item) => (
            <div key={item.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors">
              <div className="flex gap-4 items-center">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl text-gray-400 dark:text-gray-500">
                  {getIcon(type)}
                </div>
                <div>
                  <p className="font-bold text-gray-800 dark:text-white">{item.productName}</p>
                  <div className="flex flex-wrap gap-x-2 gap-y-0.5 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 font-bold">
                    <span className="flex items-center gap-1"><Calendar size={10} /> {item.date}</span>
                    {item.customerName && <span>• {item.customerName}</span>}
                    {item.outletName && <span className="text-purple-600 dark:text-purple-400">• {item.outletName}</span>}
                    {item.invoiceNumber && <span>• Inv: {item.invoiceNumber}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right mr-2">
                  <p className="font-bold text-gray-800 dark:text-white">
                    {type === 'reconciliation' ? (
                      <span className={cn(item.difference < 0 ? "text-red-600 dark:text-red-400" : "text-blue-600 dark:text-blue-400")}>
                        {item.difference > 0 ? `+${item.difference}` : item.difference}
                      </span>
                    ) : (
                      `${item.quantity} ${products.find(p => p.id === item.productId)?.unit || ''}`
                    )}
                  </p>
                  {item.freeQuantity > 0 && <p className="text-[10px] text-green-600 dark:text-green-400 font-bold">+{item.freeQuantity} ফ্রি</p>}
                </div>
                <div className="flex flex-col gap-2">
                  <button 
                    onClick={() => setEditingItem({ ...item })}
                    className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={() => setDeleteItem(item)}
                    className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingItem(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-red-600 dark:bg-red-900 p-6 text-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">এন্ট্রি সম্পাদনা</h3>
                <p className="text-xs opacity-80">{editingItem.productName}</p>
              </div>
              <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 dark:hover:bg-black/20 rounded-full">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">তারিখ</label>
                <input 
                  type="date" 
                  value={editingItem.date.split('T')[0]}
                  onChange={(e) => setEditingItem({ ...editingItem, date: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500"
                  required
                />
              </div>

              {type === 'sales' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">কাস্টমারের নাম</label>
                  <input 
                    type="text" 
                    value={editingItem.customerName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, customerName: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500"
                  />
                </div>
              )}

              {type === 'receive' && (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">ইনভয়েস নম্বর</label>
                    <input 
                      type="text" 
                      value={editingItem.invoiceNumber || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, invoiceNumber: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">সরবরাহকারী</label>
                    <input 
                      type="text" 
                      value={editingItem.supplier || ''}
                      onChange={(e) => setEditingItem({ ...editingItem, supplier: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </>
              )}

              {type !== 'reconciliation' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">পরিমাণ</label>
                    <input 
                      type="number" 
                      value={editingItem.quantity}
                      onChange={(e) => setEditingItem({ ...editingItem, quantity: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 text-center"
                      required
                    />
                  </div>
                  {(type === 'sales' || type === 'distribution' || type === 'outletSales' || type === 'receive') && (
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">ফ্রি পরিমাণ</label>
                      <input 
                        type="number" 
                        value={editingItem.freeQuantity || 0}
                        onChange={(e) => setEditingItem({ ...editingItem, freeQuantity: e.target.value })}
                        className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 text-center"
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">বাস্তব</label>
                    <input 
                      type="number" 
                      value={editingItem.physicalQuantity}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        // Recalculate difference if needed, but here we just let user edit
                        setEditingItem({ ...editingItem, physicalQuantity: val });
                      }}
                      className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-3 text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">ড্যামেজ</label>
                    <input 
                      type="number" 
                      value={editingItem.damageQuantity}
                      onChange={(e) => setEditingItem({ ...editingItem, damageQuantity: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-3 text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">ধরা</label>
                    <input 
                      type="number" 
                      value={editingItem.dharaQuantity}
                      onChange={(e) => setEditingItem({ ...editingItem, dharaQuantity: e.target.value })}
                      className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-3 text-xs font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 text-center"
                    />
                  </div>
                </div>
              )}

              {type === 'reconciliation' && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">পার্থক্য (সরাসরি এডিট)</label>
                  <input 
                    type="number" 
                    value={editingItem.difference}
                    onChange={(e) => setEditingItem({ ...editingItem, difference: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 text-center"
                  />
                </div>
              )}

              {(type === 'damage' || type === 'returns' || type === 'reconciliation' || type === 'opening' || type === 'receive' || type === 'sales' || type === 'distribution' || type === 'outletSales') && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase ml-1">নোট / কারণ</label>
                  <textarea 
                    value={editingItem.note || editingItem.reason || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-700 border-none rounded-xl p-4 text-sm font-bold text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 min-h-[80px]"
                    placeholder="অতিরিক্ত তথ্য..."
                  />
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 p-4 rounded-2xl font-bold active:scale-95 transition-all"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-red-600 text-white p-4 rounded-2xl font-bold shadow-lg shadow-red-200 dark:shadow-none active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteItem !== null}
        onClose={() => setDeleteItem(null)}
        onConfirm={handleDelete}
        title="এন্ট্রি মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি এই এন্ট্রিটি স্থায়ীভাবে মুছে ফেলতে চান?"
      />
    </div>
  );
}
