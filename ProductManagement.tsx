import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { Plus, X, Save, Trash2, Package, Edit2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import ConfirmModal from './ConfirmModal';

export default function ProductManagement() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const products = useLiveQuery(() => db.products.orderBy('order').toArray()) || [];

  const [formData, setFormData] = useState({
    name: '',
    unit: 'শলাকা' as 'শলাকা' | 'পিচ',
    lowStockLimit: 10
  });

  const handleEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      unit: product.unit,
      lowStockLimit: product.lowStockLimit
    });
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
      await db.products.update(editingId, {
        name: formData.name,
        unit: formData.unit,
        lowStockLimit: Number(formData.lowStockLimit)
      });
    } else {
      const maxOrder = products.length > 0 ? Math.max(...products.map(p => p.order || 0)) : -1;
      await db.products.add({
        name: formData.name,
        unit: formData.unit,
        lowStockLimit: Number(formData.lowStockLimit),
        order: maxOrder + 1
      });
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', unit: 'শলাকা', lowStockLimit: 10 });
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await db.products.delete(deleteId);
      setDeleteId(null);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(products);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update all items with their new order
    const updates = items.map((item, index) => 
      db.products.update(item.id!, { order: index })
    );
    await Promise.all(updates);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TRANSLATIONS.products}</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', unit: 'শলাকা', lowStockLimit: 10 });
            setIsAdding(true);
          }}
          className="bg-red-600 text-white p-3 rounded-full shadow-lg hover:bg-red-700 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[100] p-6 animate-in slide-in-from-right duration-300 overflow-y-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
              {editingId ? 'পণ্য এডিট করুন' : TRANSLATIONS.addProduct}
            </h3>
            <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{TRANSLATIONS.productName}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                placeholder="পণ্যের নাম লিখুন"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400">{TRANSLATIONS.unit}</label>
              <div className="grid grid-cols-2 gap-4">
                {['শলাকা', 'পিচ'].map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setFormData({ ...formData, unit: u as any })}
                    className={`p-4 rounded-xl font-bold border-2 transition-all ${
                      formData.unit === u 
                        ? 'bg-red-600 text-white border-red-600' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400">লো স্টক লিমিট</label>
              <input
                type="number"
                value={formData.lowStockLimit}
                onChange={(e) => setFormData({ ...formData, lowStockLimit: Number(e.target.value) })}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white p-5 rounded-2xl text-xl font-bold shadow-xl hover:bg-red-700 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Save size={24} />
              {TRANSLATIONS.save}
            </button>
          </form>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="products">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              className="space-y-3"
            >
              {products.map((p, index) => (
                <Draggable key={p.id} draggableId={p.id!.toString()} index={index}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center transition-colors ${
                        snapshot.isDragging ? 'shadow-lg ring-2 ring-red-500 ring-opacity-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div {...provided.dragHandleProps} className="text-gray-400 dark:text-gray-600 cursor-grab active:cursor-grabbing p-1">
                          <GripVertical size={20} />
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl text-red-600 dark:text-red-400">
                          <Package size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">{p.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">ইউনিট: {p.unit}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(p)} className="text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 p-2 transition-colors">
                          <Edit2 size={20} />
                        </button>
                        <button onClick={() => handleDelete(p.id!)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <ConfirmModal
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="পণ্য মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি এই পণ্যটি মুছে ফেলতে চান?"
      />
    </div>
  );
}
