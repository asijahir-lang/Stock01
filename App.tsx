/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db, seedDatabase } from './db';
import { TRANSLATIONS } from './constants';
import Dashboard from './components/Dashboard';
import OpeningStockModule from './components/OpeningStockModule';
import ReceiveModule from './components/ReceiveModule';
import SalesModule from './components/SalesModule';
import DistributionModule from './components/DistributionModule';
import ReturnModule from './components/ReturnModule';
import ReconciliationModule from './components/ReconciliationModule';
import ReportsModule from './components/ReportsModule';
import DamageModule from './components/DamageModule';
import EditModule from './components/EditModule';
import ProductManagement from './components/ProductManagement';
import OutletManagement from './components/OutletManagement';
import SettingsModal from './components/Settings';
import { 
  LayoutDashboard, 
  PackagePlus, 
  ShoppingCart, 
  FileText, 
  Settings,
  Database,
  Store,
  Package,
  RotateCcw,
  Scale,
  Plus,
  Edit2,
  AlertTriangle,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Tab = 'dashboard' | 'opening' | 'receive' | 'distribution' | 'sales' | 'returns' | 'outletSales' | 'reconciliation' | 'reports' | 'products' | 'outlets' | 'edit' | 'damage';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    seedDatabase()
      .then(() => setIsInitialized(true))
      .catch(err => {
        console.error('Database initialization failed:', err);
        setIsInitialized(true);
      });
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50 dark:bg-black">
        <div className="text-xl font-bold text-gray-600 dark:text-white animate-pulse">
          লোড হচ্ছে...
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
      case 'opening': return <OpeningStockModule />;
      case 'receive': return <ReceiveModule />;
      case 'distribution': return <DistributionModule />;
      case 'sales': return <SalesModule />;
      case 'returns': return <ReturnModule />;
      case 'reconciliation': return <ReconciliationModule />;
      case 'reports': return <ReportsModule />;
      case 'damage': return <DamageModule />;
      case 'edit': return <EditModule />;
      case 'products': return <ProductManagement />;
      case 'outlets': return <OutletManagement />;
      default: return <Dashboard onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: TRANSLATIONS.dashboard, icon: LayoutDashboard },
    { id: 'receive', label: TRANSLATIONS.receive, icon: PackagePlus },
    { id: 'sales', label: TRANSLATIONS.sales, icon: ShoppingCart },
    { id: 'reconciliation', label: TRANSLATIONS.reconciliation, icon: Scale },
    { id: 'reports', label: TRANSLATIONS.reports, icon: FileText },
  ];

  const manageItems = [
    { id: 'opening', label: TRANSLATIONS.openingStock, icon: Database, category: 'Stock' },
    { id: 'distribution', label: TRANSLATIONS.distribution, icon: PackagePlus, category: 'Stock' },
    { id: 'returns', label: TRANSLATIONS.returns, icon: RotateCcw, category: 'Transactions' },
    { id: 'damage', label: TRANSLATIONS.damage, icon: AlertTriangle, category: 'Transactions' },
    { id: 'edit', label: TRANSLATIONS.editTransactions, icon: Edit2, category: 'Transactions' },
    { id: 'products', label: TRANSLATIONS.products, icon: Package, category: 'Setup' },
    { id: 'outlets', label: TRANSLATIONS.outlets, icon: Store, category: 'Setup' },
  ];

  const allTabs = [...navItems, ...manageItems];

  return (
    <div className={cn(
      "flex flex-col h-screen bg-gray-100 dark:bg-black font-sans max-w-md mx-auto shadow-2xl relative overflow-hidden transition-colors duration-500",
      darkMode && "dark"
    )}>
      {/* Sidebar Drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[200] flex">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="relative w-2/3 max-w-[240px] bg-white dark:bg-black h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="bg-red-600 p-6 text-white flex flex-col items-center gap-3">
              <div className="text-center">
                <h2 className="text-xl font-black uppercase tracking-tighter">Akij Group</h2>
                <p className="text-[10px] font-bold opacity-80 italic">Quality First</p>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6 no-scrollbar">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase px-3 mb-2">প্রধান মেনু</p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as Tab);
                        setIsSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all active:scale-95",
                        isActive 
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" 
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      )}
                    >
                      <Icon size={20} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight size={14} className={isActive ? "opacity-100" : "opacity-0"} />
                    </button>
                  );
                })}
              </div>

              <div className="space-y-1">
                <p className="text-[10px] font-black text-gray-400 uppercase px-3 mb-2">ম্যানেজমেন্ট</p>
                {manageItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as Tab);
                        setIsSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-xl font-bold transition-all active:scale-95",
                        isActive 
                          ? "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400" 
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      )}
                    >
                      <Icon size={20} />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronRight size={14} className={isActive ? "opacity-100" : "opacity-0"} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700">
              <button 
                onClick={() => { setShowSettings(true); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all"
              >
                <Settings size={20} />
                <span>সেটিংস</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-red-600 dark:bg-red-900 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-50 transition-colors duration-300">
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="p-2 hover:bg-red-700 rounded-full transition-colors"
        >
          <Menu size={24} />
        </button>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          <h1 className="text-lg font-black tracking-tight uppercase">
            {allTabs.find(i => i.id === activeTab)?.label || TRANSLATIONS.dashboard}
          </h1>
        </div>

        <button 
          onClick={() => setShowSettings(true)}
          className="p-2 hover:bg-red-700 rounded-full transition-colors"
        >
          <Settings size={20} />
        </button>
      </header>

      {showSettings && (
        <SettingsModal 
          onClose={() => setShowSettings(false)} 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 p-4">
        {renderContent()}
      </main>

      {/* Add Menu Overlay */}
      {showAddMenu && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" 
            onClick={() => setShowAddMenu(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-black rounded-t-3xl shadow-2xl p-6 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">ম্যানেজমেন্ট মেনু</h3>
              <button onClick={() => setShowAddMenu(false)} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                <Plus size={20} className="rotate-45" />
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {manageItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as Tab);
                      setShowAddMenu(false);
                    }}
                    className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all active:scale-95"
                  >
                    <div className={cn(
                      "p-3 rounded-xl",
                      isActive 
                        ? "bg-red-600 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    )}>
                      <Icon size={24} />
                    </div>
                    <span className="text-[10px] font-bold text-center leading-tight dark:text-gray-300">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-700 flex items-center justify-around h-16 max-w-md mx-auto z-50 px-2 transition-colors duration-300">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as Tab);
                setShowAddMenu(false);
              }}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200",
                isActive ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
              )}
            >
              <div className={cn(
                "p-1 rounded-lg transition-colors",
                isActive ? "bg-red-50 dark:bg-red-900/20" : ""
              )}>
                <Icon size={22} />
              </div>
              <span className="text-[10px] font-bold mt-0.5">{item.label}</span>
            </button>
          );
        })}
        
        {/* Manage Button */}
        <button
          onClick={() => setShowAddMenu(!showAddMenu)}
          className={cn(
            "flex flex-col items-center justify-center flex-1 h-full transition-all duration-200 relative",
            manageItems.some(i => i.id === activeTab) ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"
          )}
        >
          <div className={cn(
            "p-1 rounded-lg transition-colors",
            showAddMenu ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400" : ""
          )}>
            <Plus size={22} className={cn("transition-transform duration-300", showAddMenu ? "rotate-45" : "")} />
          </div>
          <span className="text-[10px] font-bold mt-0.5">ম্যানেজ</span>
          {manageItems.some(i => i.id === activeTab) && !showAddMenu && (
            <div className="absolute top-2 right-4 w-2 h-2 bg-red-600 rounded-full border-2 border-white dark:border-gray-800" />
          )}
        </button>
      </nav>

    </div>
  );
}
