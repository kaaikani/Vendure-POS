"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { 
  BarChart, BookOpen, Grid, Box, ShoppingBag, ScanLine, FileText, UserCircle,
  Package, PlusCircle, RefreshCw
} from 'lucide-react';

import InventoryModule from './inventory-module';
import LedgerModule from './ledger-module';
import CategoryModule from './category-module';
import PosModule from './pos-module';
import BarcodeModule from './barcode-module';
import DashboardModule from './dashboard-module';
import ReportModule from './report-module';

function PlaceholderView({ title, icon: Icon, desc }: any) {
  return (
    <div className="flex flex-col items-center justify-center h-[80vh] text-slate-400 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="text-slate-300 mb-6 p-6 bg-slate-50 rounded-full border border-slate-100">
        <Icon size={64} strokeWidth={1.5} />
      </div>
      <h2 className="text-3xl font-bold text-slate-700 tracking-wide mb-2">{title}</h2>
      <p className="text-slate-500 max-w-sm text-center">Module is ready to be connected to the corresponding Vendure GraphQL API models for {desc}.</p>
    </div>
  );
}

// --- MAIN PAGE LAYOUT ---
export default function VendureDashboard() {
  const [activeTab, setActiveTab] = useState('pos');

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart },
    { id: 'ledger', label: 'Ledger', icon: BookOpen },
    { id: 'category', label: 'Category', icon: Grid },
    { id: 'inventory', label: 'Inventory', icon: Box },
    { id: 'pos', label: 'Retail POS Terminal', icon: ShoppingBag },
    { id: 'barcode', label: 'Barcode', icon: ScanLine },
    { id: 'report', label: 'Report', icon: FileText },
  ];

  const renderContent = () => {
    const content = (() => {
      switch(activeTab) {
        case 'inventory': return <InventoryModule />;
        case 'pos': return <PosModule />;
        case 'dashboard': return <DashboardModule />;
        case 'ledger': return <LedgerModule />;
        case 'category': return <CategoryModule />;
        case 'barcode': return <BarcodeModule />;
        case 'report': return <ReportModule />;
        default: return null;
      }
    })();
    return <Suspense fallback={<div className="flex items-center justify-center h-[80vh] text-slate-400">Loading...</div>}>{content}</Suspense>;
  };

  return (
    <div className="flex h-screen bg-slate-100 font-sans">
      {/* LEFT SIDEBAR ALWAYS VISIBLE */}
      <aside className="w-64 bg-slate-900 flex flex-col text-slate-300 shadow-xl z-20 flex-shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-black text-xl text-white tracking-widest">
              <span className="text-yellow-500 text-3xl">#</span> HASHTAG
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Billing Solutions</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                  isActive 
                  ? 'bg-emerald-600 text-white shadow-md transform scale-[1.02]' 
                  : 'hover:bg-slate-800 hover:text-white text-slate-400'
                }`}
              >
                <Icon className={`mr-4 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* MAIN CONTENT AREA - NO HEADER */}
      <div className="flex-1 flex flex-col overflow-hidden relative w-full bg-slate-100">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
