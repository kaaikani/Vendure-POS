"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Plus, ChevronDown, ChevronRight, Activity, ArrowUpRight, ArrowDownRight, CreditCard, Clock, CheckCircle
} from 'lucide-react';
import { 
  GetLedgersQuery, GetLedgerSummaryQuery, AddPaymentCommand, 
  Ledger, LedgerSummary 
} from '../../core/queries/ledger.query';

export default function LedgerModule() {
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  
  const [summary, setSummary] = useState<LedgerSummary>({ totalSales: 0, totalPurchase: 0, totalReceivable: 0, totalPayable: 0 });
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'CASH'|'BANK'|'UPI'>('CASH');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    const s = await new GetLedgerSummaryQuery().execute();
    setSummary(s);
    
    const l = await new GetLedgersQuery().execute(activeTab);
    setLedgers(l);
  };

  const handleOpenPayment = (e: React.MouseEvent, l: Ledger) => {
    e.stopPropagation();
    setSelectedLedger(l);
    setPayAmount(l.balance.toString());
    setPaymentModalOpen(true);
  };

  const submitPayment = async () => {
    if (!selectedLedger) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return alert("Invalid amount.");
    
    try {
      await new AddPaymentCommand().execute(selectedLedger.id, {
        amount: amt,
        paymentMode: payMode,
        paymentDate: new Date().toISOString().split('T')[0]
      });
      setPaymentModalOpen(false);
      fetchData(); // Refresh UI dynamically via IQuery
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportCSV = () => {
    const headers = "Invoice Date,Invoice Number,Party Name,Status,Total Amount,Paid Amount,Balance\n";
    const rows = ledgers.map(l => `${l.invoiceDate},${l.invoiceNumber},${l.partyName},${l.status},${l.amount},${l.paidAmount},${l.balance}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}_Ledger_Export.csv`;
    a.click();
  };

  const filteredLedgers = ledgers.filter(l => 
    l.partyName.toLowerCase().includes(search.toLowerCase()) || 
    l.invoiceNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-[85vh] text-slate-800 bg-slate-50 w-full rounded-2xl overflow-hidden font-sans border border-slate-200">
      
      {/* 1. Dashboard Top Cards */}
      <div className="p-6 bg-white border-b border-slate-200 shadow-sm shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-4 z-10">
         <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"><ArrowUpRight size={32}/></div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Sales</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹{summary.totalSales.toLocaleString()}</h3>
         </div>
         <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-4 right-4 text-red-400 opacity-20 group-hover:opacity-100 transition-opacity"><ArrowDownRight size={32}/></div>
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Purchase</p>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹{summary.totalPurchase.toLocaleString()}</h3>
         </div>
         <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-4 rounded-xl border border-emerald-200 shadow-sm relative overflow-hidden">
            <p className="text-[11px] font-black uppercase tracking-widest text-emerald-600 mb-1">Total Receivable</p>
            <h3 className="text-2xl font-black text-emerald-700 tracking-tight">₹{summary.totalReceivable.toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-emerald-600/60 uppercase mt-1">Pending from Customers</p>
         </div>
         <div className="bg-gradient-to-br from-red-50 to-red-100/50 p-4 rounded-xl border border-red-200 shadow-sm relative overflow-hidden">
            <p className="text-[11px] font-black uppercase tracking-widest text-red-600 mb-1">Total Payable</p>
            <h3 className="text-2xl font-black text-red-700 tracking-tight">₹{summary.totalPayable.toLocaleString()}</h3>
            <p className="text-[9px] font-bold text-red-500/60 uppercase mt-1">Pending to Suppliers</p>
         </div>
      </div>

      {/* 2. Operations Bar */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 shrink-0 flex flex-col md:flex-row justify-between items-center gap-4 z-10 shadow-[0_10px_20px_rgba(0,0,0,0.02)]">
         <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 h-10 w-full md:w-auto">
            <button onClick={() => setActiveTab('CUSTOMER')} className={`flex-1 md:w-48 text-xs font-black uppercase tracking-widest transition-all rounded-md flex justify-center items-center gap-2 ${activeTab === 'CUSTOMER' ? 'bg-white shadow-sm text-emerald-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
              <Activity size={14}/> Customer Ledger
            </button>
            <button onClick={() => setActiveTab('SUPPLIER')} className={`flex-1 md:w-48 text-xs font-black uppercase tracking-widest transition-all rounded-md flex justify-center items-center gap-2 ${activeTab === 'SUPPLIER' ? 'bg-slate-800 shadow-sm text-white' : 'text-slate-400 hover:text-slate-600'}`}>
              <CreditCard size={14}/> Supplier Ledger
            </button>
         </div>

         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={16}/>
               <input type="text" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search Party or Invoice..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
            </div>
            <button className="h-10 px-4 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition flex items-center justify-center gap-2 shadow-sm bg-white font-bold text-sm">
               <Filter size={16}/> <span className="hidden lg:inline">Filter</span>
            </button>
            <button onClick={exportCSV} className="h-10 px-4 border-2 border-slate-800 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2 shadow-sm font-bold text-sm">
               <Download size={16}/> <span className="hidden lg:inline">CSV</span>
            </button>
         </div>
      </div>

      {/* 3. Main Data Table */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6 relative">
         <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-left whitespace-nowrap text-sm border-collapse">
               <thead className="bg-[#f8fafc] sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                  <tr>
                     <th className="p-4 px-6 text-xs uppercase font-black tracking-widest text-slate-400">Ledger Entity</th>
                     <th className="p-4 text-xs uppercase font-black tracking-widest text-slate-400">Invoice Ref</th>
                     <th className="p-4 text-xs uppercase font-black tracking-widest text-slate-400">Status</th>
                     <th className="p-4 text-right text-xs uppercase font-black tracking-widest text-slate-400">Total Amt</th>
                     <th className="p-4 text-right text-xs uppercase font-black tracking-widest text-slate-400">Paid</th>
                     <th className="p-4 text-right text-xs uppercase font-black tracking-widest text-slate-400">Balance</th>
                     <th className="p-4 text-center text-xs uppercase font-black tracking-widest text-slate-400 w-32">Actions</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredLedgers.map((l) => (
                    <React.Fragment key={l.id}>
                      {/* Parent Row */}
                      <tr 
                        onClick={() => setExpandedRow(expandedRow === l.id ? null : l.id)}
                        className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedRow === l.id ? 'bg-slate-50' : ''}`}
                      >
                         <td className="p-4 px-6 flex items-center gap-3">
                            <span className={`text-slate-400 transition-transform ${expandedRow === l.id ? 'rotate-90' : ''}`}><ChevronRight size={18}/></span>
                            <div>
                               <p className="font-bold text-slate-800 truncate max-w-[200px]">{l.partyName}</p>
                               <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-0.5">{l.id}</p>
                            </div>
                         </td>
                         <td className="p-4">
                            <p className="font-bold text-slate-700">{l.invoiceNumber}</p>
                            <p className="text-xs text-slate-400">{l.invoiceDate}</p>
                         </td>
                         <td className="p-4">
                            {l.status === 'COMPLETED' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200"><CheckCircle size={12}/> Paid</span>}
                            {l.status === 'PARTIAL' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider border border-orange-200"><Clock size={12}/> Partial</span>}
                            {l.status === 'PENDING' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider border border-red-200"><Activity size={12}/> Pending</span>}
                         </td>
                         <td className="p-4 text-right font-black text-slate-800">₹{l.amount.toLocaleString()}</td>
                         <td className="p-4 text-right font-black text-emerald-600">₹{l.paidAmount.toLocaleString()}</td>
                         <td className="p-4 text-right">
                           {l.balance === 0 ? (
                             <span className="font-bold text-slate-300">₹0</span>
                           ) : (
                             <span className="font-black text-red-600">₹{l.balance.toLocaleString()}</span>
                           )}
                         </td>
                         <td className="p-4 text-center">
                            <button 
                               onClick={(e) => handleOpenPayment(e, l)} 
                               disabled={l.status === 'COMPLETED'}
                               className="px-3 py-1.5 bg-slate-900 text-white rounded font-bold text-[11px] uppercase tracking-widest hover:bg-emerald-600 transition disabled:opacity-30 disabled:hover:bg-slate-900"
                            >
                               Pay
                            </button>
                         </td>
                      </tr>

                      {/* Expanded Payment History Child Row */}
                      {expandedRow === l.id && (
                        <tr className="bg-slate-50 border-t border-slate-100">
                          <td colSpan={7} className="p-0">
                             <div className="py-4 px-12 pb-6 border-l-4 border-slate-300">
                               <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Transaction History</h4>
                               {l.payments.length === 0 ? (
                                  <p className="text-sm font-bold text-slate-300">No payments recorded for this invoice yet.</p>
                               ) : (
                                  <div className="grid gap-2">
                                     {l.payments.map((p, i) => (
                                        <div key={p.id} className="flex justify-between items-center bg-white border border-slate-200 rounded-lg p-3 shadow-sm max-w-xl">
                                           <div className="flex items-center gap-4">
                                              <span className="bg-slate-100 text-slate-500 font-mono text-[10px] px-2 py-0.5 rounded">{p.id}</span>
                                              <span className="font-bold text-slate-700 text-sm">{p.paymentDate}</span>
                                              <span className="bg-blue-50 text-blue-600 font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider border border-blue-100">{p.paymentMode}</span>
                                           </div>
                                           <span className="font-black text-emerald-600">₹{p.amount.toLocaleString()}</span>
                                        </div>
                                     ))}
                                  </div>
                               )}
                             </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                  
                  {filteredLedgers.length === 0 && (
                     <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold bg-white">No ledger entries match your filter.</td></tr>
                  )}
               </tbody>
            </table>
         </div>
      </div>

      {/* 4. Make Payment Modal */}
      {paymentModalOpen && selectedLedger && (
         <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
               <div className="bg-slate-900 p-5 text-center text-white relative">
                 <button onClick={()=>setPaymentModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><Search className="hidden"/><XCircle size={20}/></button>
                 <h2 className="text-lg font-black uppercase tracking-widest text-emerald-400">Record Payment</h2>
                 <p className="font-bold text-xs tracking-wider mt-1 opacity-80">{selectedLedger.partyName}</p>
               </div>
               
               <div className="p-6 bg-slate-50 flex-1">
                 <div className="flex justify-between text-xs font-black uppercase text-slate-500 tracking-widest mb-6 border-b border-slate-200 pb-2">
                    <span>Inv: {selectedLedger.invoiceNumber}</span>
                    <span className="text-red-500">Bal: ₹{selectedLedger.balance.toLocaleString()}</span>
                 </div>
                 
                 <div className="mb-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Payment Amount (₹)</label>
                    <input 
                      type="number" value={payAmount} onChange={e=>setPayAmount(e.target.value)} max={selectedLedger.balance} min="1"
                      className="w-full border border-slate-300 rounded-lg p-3 text-lg font-black outline-none focus:border-emerald-500 shadow-inner bg-white" 
                    />
                 </div>
                 
                 <div className="mb-6">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Payment Method</label>
                    <select value={payMode} onChange={e=>setPayMode(e.target.value as any)} className="w-full border border-slate-300 rounded-lg p-3 text-sm font-bold outline-none focus:border-emerald-500 shadow-sm bg-white text-slate-700">
                       <option value="CASH">CASH</option>
                       <option value="BANK">BANK CLEARANCE</option>
                       <option value="UPI">UPI / QR</option>
                    </select>
                 </div>

                 <button onClick={submitPayment} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-sm transition shadow-lg shadow-emerald-600/20 active:scale-95">
                    Confirm Record
                 </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}
