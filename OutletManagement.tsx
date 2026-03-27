import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { Plus, X, Save, Trash2, Store, Edit2, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import ConfirmModal from './ConfirmModal';

export default function OutletManagement() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const outlets = useLiveQuery(() => db.outlets.orderBy('order').toArray()) || [];

  const [formData, setFormData] = useState({
    name: '',
    address: ''
  });

  const handleEdit = (outlet: any) => {
    setEditingId(outlet.id);
    setFormData({
      name: outlet.name,
      address: outlet.address || ''
    });
    setIsAdding(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingId) {
      await db.outlets.update(editingId, {
        name: formData.name,
        address: formData.address
      });
    } else {
      const maxOrder = outlets.length > 0 ? Math.max(...outlets.map(o => o.order || 0)) : -1;
      await db.outlets.add({
        name: formData.name,
        address: formData.address,
        order: maxOrder + 1
      });
    }

    setIsAdding(false);
    setEditingId(null);
    setFormData({ name: '', address: '' });
  };

  const handleDelete = async (id: number) => {
    setDeleteId(id);
  };

  const confirmDelete = async () => {
    if (deleteId) {
      await db.outlets.delete(deleteId);
      setDeleteId(null);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(outlets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update all items with their new order
    const updates = items.map((item, index) => 
      db.outlets.update(item.id!, { order: index })
    );
    await Promise.all(updates);
  };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">{TRANSLATIONS.outlets}</h2>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ name: '', address: '' });
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
              {editingId ? 'আউটলেট এডিট করুন' : TRANSLATIONS.addOutlet}
            </h3>
            <button onClick={() => setIsAdding(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400">আউটলেটের নাম</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                placeholder="আউটলেটের নাম লিখুন"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-600 dark:text-gray-400">ঠিকানা</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-lg text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 outline-none transition-colors"
                rows={3}
                placeholder="আউটলেটের ঠিকানা লিখুন"
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
        <Droppable droppableId="outlets">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              className="space-y-3"
            >
              {outlets.map((o, index) => (
                <Draggable key={o.id} draggableId={o.id!.toString()} index={index}>
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
                          <Store size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">{o.name}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{o.address || 'ঠিকানা নেই'}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleEdit(o)} className="text-gray-300 dark:text-gray-600 hover:text-blue-500 dark:hover:text-blue-400 p-2 transition-colors">
                          <Edit2 size={20} />
                        </button>
                        <button onClick={() => handleDelete(o.id!)} className="text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 p-2 transition-colors">
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
        title="আউটলেট মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি এই আউটলেটটি মুছে ফেলতে চান?"
      />
    </div>
  );
}
