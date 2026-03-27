import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'হ্যাঁ, নিশ্চিত',
  cancelText = 'না, থাক',
  type = 'danger'
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-black w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden transition-colors"
          >
            <div className="p-6 text-center">
              <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-colors ${
                type === 'danger' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 
                type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
              }`}>
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{message}</p>
            </div>
            <div className="flex p-4 gap-3 bg-gray-50 dark:bg-gray-900/50 transition-colors">
              <button
                onClick={onClose}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                {cancelText}
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg active:scale-95 transition-all ${
                  type === 'danger' ? 'bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600' : 
                  type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 dark:bg-amber-500 dark:hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
