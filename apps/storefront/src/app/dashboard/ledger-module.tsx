"use client";

import React, { useState, useEffect } from 'react';
import {
  Search, Filter, Download, Plus, ChevronRight, Activity, ArrowUpRight, ArrowDownRight,
  CreditCard, Clock, CheckCircle, XCircle, ArrowLeft, Wallet, Smartphone, Landmark,
  FileText, Calendar, DollarSign, Receipt
} from 'lucide-react';
import {
  GetLedgersQuery, GetLedgerSummaryQuery, AddPaymentCommand, GetLedgerByIdQuery, CreateLedgerCommand,
  Ledger, LedgerSummary
} from '../../core/queries/ledger.query';

// Payment mode icon helper
const PaymentModeIcon = ({ mode, size = 16 }: { mode: string; size?: number }) => {
  switch (mode) {
    case 'CASH': return <Wallet size={size} />;
    case 'UPI': return <Smartphone size={size} />;
    case 'BANK': return <Landmark size={size} />;
    case 'CREDIT': return <CreditCard size={size} />;
    default: return <DollarSign size={size} />;
  }
};

const paymentModeLabel = (mode: string) => {
  switch (mode) {
    case 'CASH': return 'Cash';
    case 'UPI': return 'UPI / QR';
    case 'BANK': return 'Bank Transfer';
    case 'CREDIT': return 'Credit Card';
    default: return mode;
  }
};

const paymentModeColor = (mode: string) => {
  switch (mode) {
    case 'CASH': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'UPI': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'BANK': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'CREDIT': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

export default function LedgerModule() {
  const [activeTab, setActiveTab] = useState<'CUSTOMER' | 'SUPPLIER'>('CUSTOMER');
  const [summary, setSummary] = useState<LedgerSummary>({ totalSales: 0, totalPurchase: 0, totalReceivable: 0, totalPayable: 0 });
  const [ledgers, setLedgers] = useState<Ledger[]>([]);
  const [search, setSearch] = useState('');

  // Detail view state
  const [selectedLedger, setSelectedLedger] = useState<Ledger | null>(null);
  const [detailView, setDetailView] = useState(false);

  // Payment Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'CASH' | 'BANK' | 'UPI' | 'CREDIT'>('CASH');
  const [payDate, setPayDate] = useState('');
  const [payTime, setPayTime] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Add Supplier Modal State
  const [addSupplierOpen, setAddSupplierOpen] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');
  const [newSupplierInvoice, setNewSupplierInvoice] = useState('');
  const [newSupplierAmount, setNewSupplierAmount] = useState('');
  const [newSupplierCreditDays, setNewSupplierCreditDays] = useState('30');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    const s = await new GetLedgerSummaryQuery().execute();
    setSummary(s);
    const l = await new GetLedgersQuery().execute(activeTab);
    setLedgers(l);
  };

  const openDetailView = (l: Ledger) => {
    setSelectedLedger(l);
    setDetailView(true);
  };

  const closeDetailView = () => {
    setDetailView(false);
    setSelectedLedger(null);
  };

  const refreshSelectedLedger = async () => {
    if (!selectedLedger) return;
    const updated = await new GetLedgerByIdQuery().execute(selectedLedger.id);
    if (updated) setSelectedLedger(updated);
    fetchData();
  };

  const openPaymentModal = (l: Ledger) => {
    setSelectedLedger(l);
    setPayAmount(l.balance.toString());
    setPayMode('CASH');
    const now = new Date();
    setPayDate(now.toISOString().split('T')[0]);
    setPayTime(now.toTimeString().slice(0, 5));
    setPayNotes('');
    setPaymentModalOpen(true);
  };

  const submitPayment = async () => {
    if (!selectedLedger) return;
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) return alert("Invalid amount.");

    const dateTime = new Date(`${payDate}T${payTime}:00`).toISOString();

    try {
      const updated = await new AddPaymentCommand().execute(selectedLedger.id, {
        amount: amt,
        paymentMode: payMode,
        paymentDate: dateTime
      });
      setPaymentModalOpen(false);
      setSelectedLedger(updated);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const submitNewSupplier = async () => {
    if (!newSupplierName || !newSupplierInvoice || !newSupplierAmount) return alert('All fields are required.');
    const amt = parseFloat(newSupplierAmount);
    if (!amt || amt <= 0) return alert('Invalid amount.');
    try {
      await new CreateLedgerCommand().execute({
        type: 'SUPPLIER',
        partyName: newSupplierName,
        invoiceNumber: newSupplierInvoice,
        invoiceDate: new Date().toISOString(),
        amount: Math.round(amt),
        creditDays: parseInt(newSupplierCreditDays) || 30,
      });
      setAddSupplierOpen(false);
      setNewSupplierName('');
      setNewSupplierInvoice('');
      setNewSupplierAmount('');
      setNewSupplierCreditDays('30');
      fetchData();
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

  const paidPercent = selectedLedger ? Math.min(100, Math.round((selectedLedger.paidAmount / selectedLedger.amount) * 100)) : 0;

  // =====================================================
  // CUSTOMER / SUPPLIER DETAIL VIEW
  // =====================================================
  if (detailView && selectedLedger) {
    const sortedPayments = [...selectedLedger.payments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return (
      <div className="flex flex-col h-[85vh] text-slate-800 bg-slate-50 w-full rounded-2xl overflow-hidden font-sans border border-slate-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={closeDetailView} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-black text-white tracking-wide">{selectedLedger.partyName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-slate-400 text-xs font-bold">{selectedLedger.invoiceNumber}</span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 text-xs font-bold">
                  {new Date(selectedLedger.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-slate-400 text-xs font-bold">Credit: {selectedLedger.creditDays} days</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => openPaymentModal(selectedLedger)}
            disabled={selectedLedger.status === 'FULLY_PAID'}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-black text-sm uppercase tracking-widest transition shadow-lg shadow-teal-500/30 disabled:opacity-30 disabled:hover:bg-teal-500 active:scale-95"
          >
            <Plus size={18} /> Add Payment
          </button>
        </div>

        {/* Summary Cards */}
        <div className="p-6 bg-white border-b border-slate-200 shrink-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 rounded-xl border border-blue-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-100"><Receipt size={18} className="text-blue-600" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Total Amount</span>
              </div>
              <h3 className="text-2xl font-black text-blue-700 tracking-tight">₹{selectedLedger.amount.toLocaleString()}</h3>
            </div>

            <div className="bg-gradient-to-br from-teal-50 to-teal-100/50 p-5 rounded-xl border border-teal-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-teal-100"><CheckCircle size={18} className="text-teal-600" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Paid Amount</span>
              </div>
              <h3 className="text-2xl font-black text-teal-700 tracking-tight">₹{selectedLedger.paidAmount.toLocaleString()}</h3>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 p-5 rounded-xl border border-orange-200 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-orange-100"><Clock size={18} className="text-orange-600" /></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Balance</span>
              </div>
              <h3 className="text-2xl font-black text-orange-700 tracking-tight">₹{selectedLedger.balance.toLocaleString()}</h3>
            </div>

            <div className={`p-5 rounded-xl border shadow-sm ${
              selectedLedger.status === 'FULLY_PAID'
                ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200'
                : selectedLedger.status === 'PARTIALLY_PAID'
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200'
                  : 'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  selectedLedger.status === 'FULLY_PAID' ? 'bg-emerald-100' : selectedLedger.status === 'PARTIALLY_PAID' ? 'bg-amber-100' : 'bg-red-100'
                }`}>
                  <Activity size={18} className={
                    selectedLedger.status === 'FULLY_PAID' ? 'text-emerald-600' : selectedLedger.status === 'PARTIALLY_PAID' ? 'text-amber-600' : 'text-red-600'
                  } />
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${
                  selectedLedger.status === 'FULLY_PAID' ? 'text-emerald-400' : selectedLedger.status === 'PARTIALLY_PAID' ? 'text-amber-400' : 'text-red-400'
                }`}>Status</span>
              </div>
              <h3 className={`text-xl font-black tracking-tight ${
                selectedLedger.status === 'FULLY_PAID' ? 'text-emerald-700' : selectedLedger.status === 'PARTIALLY_PAID' ? 'text-amber-700' : 'text-red-700'
              }`}>
                {selectedLedger.status === 'FULLY_PAID' ? 'Fully Paid' : selectedLedger.status === 'PARTIALLY_PAID' ? 'Partially Paid' : 'Pending'}
              </h3>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Payment Progress</span>
              <span className="text-xs font-black text-slate-600">{paidPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  paidPercent >= 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                    : paidPercent > 0 ? 'bg-gradient-to-r from-teal-500 to-teal-400'
                    : 'bg-slate-200'
                }`}
                style={{ width: `${paidPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="flex-1 overflow-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <FileText size={16} /> Transaction History
            </h3>
            <span className="text-xs font-bold text-slate-400">{sortedPayments.length} payment{sortedPayments.length !== 1 ? 's' : ''} recorded</span>
          </div>

          {sortedPayments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-16 text-center">
              <div className="inline-flex p-5 rounded-full bg-slate-50 border border-slate-100 mb-4">
                <Receipt size={40} className="text-slate-300" />
              </div>
              <p className="text-lg font-bold text-slate-400">No payments recorded yet</p>
              <p className="text-sm text-slate-300 mt-1">Click "+ Add Payment" to record the first payment</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedPayments.map((p, i) => (
                <div key={p.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-4 flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    {/* Serial Number */}
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-500 group-hover:bg-teal-50 group-hover:text-teal-600 transition">
                      #{sortedPayments.length - i}
                    </div>

                    {/* Payment Mode Badge */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider ${paymentModeColor(p.paymentMode)}`}>
                      <PaymentModeIcon mode={p.paymentMode} size={14} />
                      {paymentModeLabel(p.paymentMode)}
                    </div>

                    {/* Date & Time */}
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-700 text-sm">
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                      <span className="text-slate-400 text-xs font-bold">
                        {new Date(p.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </span>
                    </div>

                    {/* Status */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                      <CheckCircle size={10} /> Completed
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-right">
                    <span className="text-lg font-black text-teal-600">₹{p.amount.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment Modal */}
        {paymentModalOpen && selectedLedger && renderPaymentModal()}
      </div>
    );
  }

  // =====================================================
  // PAYMENT MODAL (Shared)
  // =====================================================
  function renderPaymentModal() {
    if (!selectedLedger) return null;
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-center text-white relative">
            <button onClick={() => setPaymentModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
              <XCircle size={22} />
            </button>
            <div className="inline-flex p-3 rounded-full bg-teal-500/20 mb-3">
              <Plus size={24} className="text-teal-400" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-widest text-teal-400">Add Payment</h2>
            <p className="font-bold text-sm tracking-wider mt-1 text-slate-300">{selectedLedger.partyName}</p>
          </div>

          {/* Modal Body */}
          <div className="p-6 bg-slate-50 flex-1 space-y-4">
            {/* Invoice & Balance Info */}
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Invoice</span>
                <span className="text-sm font-bold text-slate-700">{selectedLedger.invoiceNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black uppercase tracking-widest text-red-400 block">Balance Due</span>
                <span className="text-sm font-black text-red-600">₹{selectedLedger.balance.toLocaleString()}</span>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Payment Amount (₹)</label>
              <input
                type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} max={selectedLedger.balance} min="1"
                className="w-full border border-slate-300 rounded-xl p-3.5 text-lg font-black outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
              />
            </div>

            {/* Payment Mode */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Payment Method</label>
              <div className="grid grid-cols-4 gap-2">
                {(['CASH', 'UPI', 'BANK', 'CREDIT'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setPayMode(mode)}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-xs font-black uppercase tracking-wider ${
                      payMode === mode
                        ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    <PaymentModeIcon mode={mode} size={20} />
                    {mode === 'BANK' ? 'Bank' : mode === 'CREDIT' ? 'Card' : mode === 'UPI' ? 'UPI' : 'Cash'}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Date</label>
                <input
                  type="date" value={payDate} onChange={e => setPayDate(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Time</label>
                <input
                  type="time" value={payTime} onChange={e => setPayTime(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Notes (Optional)</label>
              <textarea
                value={payNotes} onChange={e => setPayNotes(e.target.value)}
                placeholder="e.g., Partial payment via GPay"
                rows={2}
                className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white resize-none"
              />
            </div>

            {/* Submit Button */}
            <button onClick={submitPayment} className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl font-black uppercase tracking-widest text-sm transition shadow-lg shadow-teal-500/30 active:scale-[0.98]">
              Confirm Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // MAIN LEDGER LIST VIEW
  // =====================================================
  return (
    <div className="flex flex-col h-[85vh] text-slate-800 bg-slate-50 w-full rounded-2xl overflow-hidden font-sans border border-slate-200">

      {/* 1. Dashboard Top Cards */}
      <div className="p-6 bg-white border-b border-slate-200 shadow-sm shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-4 z-10">
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-emerald-500 opacity-20 group-hover:opacity-100 transition-opacity"><ArrowUpRight size={32} /></div>
          <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Sales</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">₹{summary.totalSales.toLocaleString()}</h3>
        </div>
        <div className="bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] p-4 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-4 right-4 text-red-400 opacity-20 group-hover:opacity-100 transition-opacity"><ArrowDownRight size={32} /></div>
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
            <Activity size={14} /> Customer Ledger
          </button>
          <button onClick={() => setActiveTab('SUPPLIER')} className={`flex-1 md:w-48 text-xs font-black uppercase tracking-widest transition-all rounded-md flex justify-center items-center gap-2 ${activeTab === 'SUPPLIER' ? 'bg-slate-800 shadow-sm text-white' : 'text-slate-400 hover:text-slate-600'}`}>
            <CreditCard size={14} /> Supplier Ledger
          </button>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search Party or Invoice..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-bold" />
          </div>
          <button className="h-10 px-4 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition flex items-center justify-center gap-2 shadow-sm bg-white font-bold text-sm">
            <Filter size={16} /> <span className="hidden lg:inline">Filter</span>
          </button>
          <button onClick={exportCSV} className="h-10 px-4 border-2 border-slate-800 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition flex items-center justify-center gap-2 shadow-sm font-bold text-sm">
            <Download size={16} /> <span className="hidden lg:inline">CSV</span>
          </button>
          {activeTab === 'SUPPLIER' && (
            <button onClick={() => setAddSupplierOpen(true)} className="h-10 px-4 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition flex items-center justify-center gap-2 shadow-sm font-bold text-sm">
              <Plus size={16} /> <span className="hidden lg:inline">Add Supplier</span>
            </button>
          )}
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
                <tr
                  key={l.id}
                  onClick={() => openDetailView(l)}
                  className="hover:bg-teal-50/30 cursor-pointer transition-colors group"
                >
                  <td className="p-4 px-6 flex items-center gap-3">
                    <span className="text-slate-300 group-hover:text-teal-500 transition"><ChevronRight size={18} /></span>
                    <div>
                      <p className="font-bold text-slate-800 truncate max-w-[200px] group-hover:text-teal-700 transition">{l.partyName}</p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-0.5">ID: {l.id}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-700">{l.invoiceNumber}</p>
                    <p className="text-xs text-slate-400">{new Date(l.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                  </td>
                  <td className="p-4">
                    {l.status === 'FULLY_PAID' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider border border-emerald-200"><CheckCircle size={12} /> Paid</span>}
                    {l.status === 'PARTIALLY_PAID' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-wider border border-orange-200"><Clock size={12} /> Partially Paid</span>}
                    {l.status === 'PENDING' && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider border border-red-200"><Activity size={12} /> Pending</span>}
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
                      onClick={(e) => { e.stopPropagation(); openPaymentModal(l); }}
                      disabled={l.status === 'FULLY_PAID'}
                      className="px-3 py-1.5 bg-slate-900 text-white rounded font-bold text-[11px] uppercase tracking-widest hover:bg-teal-600 transition disabled:opacity-30 disabled:hover:bg-slate-900"
                    >
                      Pay
                    </button>
                  </td>
                </tr>
              ))}

              {filteredLedgers.length === 0 && (
                <tr><td colSpan={7} className="py-20 text-center text-slate-400 font-bold bg-white">No ledger entries match your filter.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {paymentModalOpen && selectedLedger && !detailView && renderPaymentModal()}

      {/* Add Supplier Modal */}
      {addSupplierOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-center text-white relative">
              <button onClick={() => setAddSupplierOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition">
                <XCircle size={22} />
              </button>
              <div className="inline-flex p-3 rounded-full bg-teal-500/20 mb-3">
                <Plus size={24} className="text-teal-400" />
              </div>
              <h2 className="text-lg font-black uppercase tracking-widest text-teal-400">Add Supplier</h2>
              <p className="font-bold text-sm tracking-wider mt-1 text-slate-300">Create new supplier ledger entry</p>
            </div>

            <div className="p-6 bg-slate-50 flex-1 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Supplier Name</label>
                <input
                  type="text" value={newSupplierName} onChange={e => setNewSupplierName(e.target.value)}
                  placeholder="e.g., Karthi Traders"
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Invoice Number</label>
                <input
                  type="text" value={newSupplierInvoice} onChange={e => setNewSupplierInvoice(e.target.value)}
                  placeholder="e.g., SUP-INV-001"
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Invoice Amount (₹)</label>
                <input
                  type="number" value={newSupplierAmount} onChange={e => setNewSupplierAmount(e.target.value)}
                  placeholder="e.g., 25000"
                  className="w-full border border-slate-300 rounded-xl p-3.5 text-lg font-black outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Credit Days</label>
                <input
                  type="number" value={newSupplierCreditDays} onChange={e => setNewSupplierCreditDays(e.target.value)}
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"
                />
              </div>

              <button onClick={submitNewSupplier} className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl font-black uppercase tracking-widest text-sm transition shadow-lg shadow-teal-500/30 active:scale-[0.98]">
                Create Supplier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
