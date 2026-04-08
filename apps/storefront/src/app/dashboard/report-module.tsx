"use client";

import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Trash2, Search, Wifi, WifiOff, CreditCard, Calendar, IndianRupee, ShoppingBag, Filter
} from 'lucide-react';

interface ReportOrder {
  invoiceId: string;
  date: string;
  timestamp: string;
  saleType: 'ONLINE' | 'OFFLINE' | 'CREDIT';
  customer: { name: string; phone: string; address: string };
  items: { id: string; name: string; qty: number; price: number; total: number }[];
  subtotal: number;
  discount: number;
  transport: number;
  taxAmount: number;
  grandTotal: number;
  receivedAmount: number;
  balance: number;
}

export default function ReportModule() {
  const [reports, setReports] = useState<ReportOrder[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'ONLINE' | 'OFFLINE' | 'CREDIT'>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = () => {
    try {
      const data = JSON.parse(localStorage.getItem('pos_reports') || '[]');
      setReports(data);
    } catch {
      setReports([]);
    }
  };

  const clearReports = () => {
    if (confirm('Clear all reports? This cannot be undone.')) {
      localStorage.removeItem('pos_reports');
      setReports([]);
    }
  };

  const exportCSV = () => {
    const headers = "Invoice,Date,Time,Mode,Customer,Phone,Items,Subtotal,Discount,Tax,Grand Total,Received,Balance\n";
    const rows = filteredReports.map(r =>
      `${r.invoiceId},${r.date},${new Date(r.timestamp).toLocaleTimeString('en-IN')},${r.saleType},${r.customer.name},${r.customer.phone},${r.items.length},${r.subtotal},${r.discount},${r.taxAmount},${r.grandTotal},${r.receivedAmount},${r.balance}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `POS_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredReports = reports.filter(r => {
    const matchType = filterType === 'ALL' || r.saleType === filterType;
    const matchSearch = !search ||
      r.invoiceId.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // Summary calculations
  const totalSales = filteredReports.reduce((sum, r) => sum + r.grandTotal, 0);
  const onlineSales = filteredReports.filter(r => r.saleType === 'ONLINE').reduce((sum, r) => sum + r.grandTotal, 0);
  const offlineSales = filteredReports.filter(r => r.saleType === 'OFFLINE').reduce((sum, r) => sum + r.grandTotal, 0);
  const creditSales = filteredReports.filter(r => r.saleType === 'CREDIT').reduce((sum, r) => sum + r.grandTotal, 0);

  const modeIcon = (type: string) => {
    if (type === 'ONLINE') return <Wifi size={12} />;
    if (type === 'OFFLINE') return <WifiOff size={12} />;
    return <CreditCard size={12} />;
  };

  const modeBadge = (type: string) => {
    const cls = type === 'ONLINE' ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
      : type === 'OFFLINE' ? 'bg-blue-100 text-blue-700 border-blue-200'
      : 'bg-orange-100 text-orange-700 border-orange-200';
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${cls}`}>
        {modeIcon(type)} {type}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[85vh] text-slate-800 bg-slate-50 w-full rounded-2xl overflow-hidden font-sans border border-slate-200">

      {/* Summary Cards */}
      <div className="p-6 bg-white border-b border-slate-200 shadow-sm shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Sales</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
          <p className="text-[9px] font-bold text-slate-400 mt-1">{filteredReports.length} transactions</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-200 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1"><Wifi size={12} className="text-emerald-500" /><p className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Online</p></div>
          <h3 className="text-2xl font-black text-emerald-700 tracking-tight">₹{onlineSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-4 rounded-xl border border-blue-200 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1"><WifiOff size={12} className="text-blue-500" /><p className="text-[11px] font-black uppercase tracking-widest text-blue-500">Offline</p></div>
          <h3 className="text-2xl font-black text-blue-700 tracking-tight">₹{offlineSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-4 rounded-xl border border-orange-200 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1"><CreditCard size={12} className="text-orange-500" /><p className="text-[11px] font-black uppercase tracking-widest text-orange-500">Credit</p></div>
          <h3 className="text-2xl font-black text-orange-700 tracking-tight">₹{creditSales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h3>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 h-10 w-full md:w-auto">
          {(['ALL', 'ONLINE', 'OFFLINE', 'CREDIT'] as const).map(type => (
            <button key={type} onClick={() => setFilterType(type)} className={`flex-1 md:px-6 text-xs font-black uppercase tracking-widest transition-all rounded-md flex justify-center items-center gap-1.5 ${
              filterType === type
                ? type === 'ALL' ? 'bg-slate-800 text-white shadow-sm' : type === 'ONLINE' ? 'bg-emerald-600 text-white shadow-sm' : type === 'OFFLINE' ? 'bg-blue-600 text-white shadow-sm' : 'bg-orange-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-600'
            }`}>
              {type !== 'ALL' && modeIcon(type)} {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Invoice or Customer..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
          </div>
          <button onClick={exportCSV} className="h-10 px-4 border-2 border-slate-800 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2 shadow-sm font-bold text-sm">
            <Download size={16} /> CSV
          </button>
          <button onClick={clearReports} className="h-10 px-4 border border-red-200 bg-white text-red-500 rounded-lg hover:bg-red-50 transition flex items-center justify-center gap-2 shadow-sm font-bold text-sm">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left whitespace-nowrap text-sm border-collapse">
            <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-4 px-6 text-xs uppercase font-black tracking-widest text-slate-400">Invoice</th>
                <th className="p-4 text-xs uppercase font-black tracking-widest text-slate-400">Date & Time</th>
                <th className="p-4 text-xs uppercase font-black tracking-widest text-slate-400">Customer</th>
                <th className="p-4 text-xs uppercase font-black tracking-widest text-slate-400">Mode</th>
                <th className="p-4 text-xs uppercase font-black tracking-widest text-slate-400 text-center">Items</th>
                <th className="p-4 text-right text-xs uppercase font-black tracking-widest text-slate-400">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredReports.map((r) => (
                <React.Fragment key={r.invoiceId + r.timestamp}>
                  <tr
                    onClick={() => setExpandedId(expandedId === r.invoiceId ? null : r.invoiceId)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="p-4 px-6 font-bold text-slate-800">{r.invoiceId}</td>
                    <td className="p-4">
                      <p className="font-bold text-slate-700">{r.date}</p>
                      <p className="text-xs text-slate-400">{new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-700">{r.customer.name}</p>
                      {r.customer.phone && <p className="text-xs text-slate-400">{r.customer.phone}</p>}
                    </td>
                    <td className="p-4">{modeBadge(r.saleType)}</td>
                    <td className="p-4 text-center font-bold text-slate-600">{r.items.length}</td>
                    <td className="p-4 text-right font-black text-slate-800">₹{r.grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</td>
                  </tr>

                  {/* Expanded Detail */}
                  {expandedId === r.invoiceId && (
                    <tr className="bg-slate-50">
                      <td colSpan={6} className="p-0">
                        <div className="p-6 border-l-4 border-teal-400">
                          <div className="grid grid-cols-4 gap-4 mb-4 text-xs">
                            <div><span className="text-slate-400 font-black uppercase text-[10px]">Subtotal</span><p className="font-black text-slate-700">₹{r.subtotal.toFixed(2)}</p></div>
                            <div><span className="text-slate-400 font-black uppercase text-[10px]">Discount</span><p className="font-black text-red-500">-₹{r.discount.toFixed(2)}</p></div>
                            <div><span className="text-slate-400 font-black uppercase text-[10px]">Tax (5%)</span><p className="font-black text-slate-700">₹{r.taxAmount.toFixed(2)}</p></div>
                            <div><span className="text-slate-400 font-black uppercase text-[10px]">Received</span><p className="font-black text-emerald-600">₹{r.receivedAmount.toFixed(2)}</p></div>
                          </div>
                          <table className="w-full text-xs">
                            <thead className="bg-slate-100 text-[10px] font-black text-slate-400 uppercase">
                              <tr><th className="p-2 text-left">Product</th><th className="p-2 text-center">Qty</th><th className="p-2 text-right">Price</th><th className="p-2 text-right">Amount</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {r.items.map((item, i) => (
                                <tr key={i} className="bg-white">
                                  <td className="p-2 font-bold text-slate-700">{item.name}</td>
                                  <td className="p-2 text-center font-bold">{item.qty}</td>
                                  <td className="p-2 text-right font-bold">₹{item.price.toFixed(2)}</td>
                                  <td className="p-2 text-right font-black text-slate-800">₹{item.total.toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="inline-flex p-5 rounded-full bg-slate-50 border border-slate-100 mb-4">
                      <FileText size={40} className="text-slate-300" />
                    </div>
                    <p className="text-lg font-bold text-slate-400">No transactions found</p>
                    <p className="text-sm text-slate-300 mt-1">Complete a sale in POS Terminal to see reports here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
