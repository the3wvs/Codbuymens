/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './components/AuthProvider';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { POSView } from './components/POSView';
import { SalesHistoryView } from './components/SalesHistoryView';
import { AuthView } from './components/AuthView';
import { Search, Plus, LogOut } from 'lucide-react';
import { logout } from './lib/firebase';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'inventory':
        return <InventoryView />;
      case 'pos':
        return <POSView />;
      case 'history':
        return <SalesHistoryView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex font-sans" dir="rtl">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />
      
      <main className="flex-1 mr-56 min-h-screen flex flex-col bg-gray-100">
        {/* Header Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center gap-4 w-96">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="بحث سريع عن منتج أو فاتورة..." 
                className="w-full bg-gray-50 border border-gray-100 rounded-md px-10 py-2 text-xs font-bold focus:ring-2 focus:ring-blue-500/20 transition-all" 
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setCurrentView('pos')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-xs font-black uppercase tracking-wider flex items-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
            >
              <Plus className="w-4 h-4" /> فاتورة جديدة
            </button>
            <div className="w-9 h-9 border border-gray-200 rounded-md flex items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-50 transition-colors">
              <LogOut className="w-4 h-4" onClick={() => logout()} />
            </div>
          </div>
        </header>

        <div className="p-8 flex-1 overflow-auto custom-scrollbar">
          {renderView()}
        </div>

        {/* Status Bar */}
        <footer className="h-8 bg-white border-t border-gray-200 flex items-center justify-between px-8 text-[10px] text-gray-400 font-bold uppercase tracking-widest">
          <div className="flex gap-6">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 
              النظام متصل
            </span>
            <span>تحديث تلقائي: مفعل</span>
          </div>
          <div className="flex gap-6">
            <span>v2.4.0 (Enterprise)</span>
            <span className="text-gray-900">{new Date().toLocaleDateString('ar-EG')}</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
