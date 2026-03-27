import React, { useState } from 'react';
import { db } from '../db';
import { TRANSLATIONS } from '../constants';
import { Trash2, Shield, Info, LogOut, X, Moon, Sun } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface SettingsProps {
  onClose: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function Settings({ onClose, darkMode, setDarkMode }: SettingsProps) {
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleResetData = async () => {
    setIsResetModalOpen(true);
  };

  const confirmReset = async () => {
    try {
      await db.openingStocks.clear();
      await db.receives.clear();
      await db.sales.clear();
      await db.returns.clear();
      await db.outletSales.clear();
      await db.damages.clear();
      await db.reconciliations.clear();
      setIsResetModalOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Reset failed:', err);
      alert('ডেটা রিসেট করা সম্ভব হয়নি।');
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-900 z-[200] p-6 animate-in slide-in-from-top duration-300 overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-white">সেটিংস</h3>
        <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
          <X size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-gray-700 transition-all active:scale-95"
        >
          <div className={cn(
            "p-3 rounded-xl transition-colors",
            darkMode ? "bg-indigo-900/40 text-indigo-400" : "bg-orange-100 text-orange-600"
          )}>
            {darkMode ? <Moon size={24} /> : <Sun size={24} />}
          </div>
          <div className="text-left flex-1">
            <p className="font-bold text-gray-800 dark:text-white">
              {darkMode ? 'ডার্ক মুড' : 'লাইট মুড'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              অ্যাপের থিম পরিবর্তন করুন
            </p>
          </div>
          <div className={cn(
            "w-12 h-6 rounded-full relative transition-colors duration-300",
            darkMode ? "bg-indigo-600" : "bg-gray-300"
          )}>
            <div className={cn(
              "absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300",
              darkMode ? "left-7" : "left-1"
            )} />
          </div>
        </button>

        <button
          onClick={handleResetData}
          className="w-full bg-red-50 dark:bg-red-900/10 p-5 rounded-2xl flex items-center gap-4 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all border border-red-100 dark:border-red-900/20"
        >
          <div className="bg-red-100 dark:bg-red-900/40 p-3 rounded-xl text-red-600 dark:text-red-400">
            <Trash2 size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-red-600 dark:text-red-400">ডেটা রিসেট করুন</p>
            <p className="text-sm text-red-400 dark:text-red-500/70">সমস্ত তথ্য মুছে ফেলুন</p>
          </div>
        </button>

        <div className="bg-gray-50 dark:bg-gray-800 p-5 rounded-2xl flex items-center gap-4 border border-gray-100 dark:border-gray-700">
          <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-xl text-gray-600 dark:text-gray-400">
            <Info size={24} />
          </div>
          <div className="text-left">
            <p className="font-bold text-gray-800 dark:text-white">অ্যাপ ভার্সন</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">১.০.০ (বেটা)</p>
          </div>
        </div>
      </div>

      <div className="mt-10 text-center text-gray-400 dark:text-gray-600 text-sm">
        <p>© ২০২৬ আকিজ বিড়ি ডিস্ট্রিবিউটর ম্যানেজমেন্ট</p>
      </div>

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={confirmReset}
        title="সমস্ত তথ্য মুছে ফেলুন"
        message="আপনি কি নিশ্চিত যে আপনি সমস্ত তথ্য মুছে ফেলতে চান? এটি আর ফেরৎ আনা যাবে না।"
      />
    </div>
  );
}
