"use client";

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ScanLine, ShoppingCart, Trash2, Plus, Minus, Printer, Download, Save, XCircle, Wifi, WifiOff, CreditCard
} from 'lucide-react';
import {
  PosProduct, PosCustomer,
  GetPosProductsQuery, GetPosCustomersQuery,
  CreateSaleTransactionCommand, LookupBarcodeQuery
} from '../../core/queries/PosQueries';
import { CreateLedgerCommand } from '../../core/queries/ledger.query';

interface CartItem {
  id: string;
  name: string;
  barcode: string;
  price: number;
  qty: number;
  discountPct: number;
  total: number;
  quantityStr: string;
}

interface ParkedBill {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  saleType: 'ONLINE' | 'OFFLINE' | 'CREDIT';
  cart: CartItem[];
  parkedAt: string;
  total: number;
}

// Report storage helper
function saveToReport(order: any) {
  try {
    const existing = JSON.parse(localStorage.getItem('pos_reports') || '[]');
    existing.unshift({
      ...order,
      timestamp: new Date().toISOString(),
    });
    localStorage.setItem('pos_reports', JSON.stringify(existing));
  } catch(e) {
    console.error('Failed to save report:', e);
  }
}

export default function PosModule() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);

  // Invoice Details
  const [invoiceNo, setInvoiceNo] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  const [saleType, setSaleType] = useState<'ONLINE' | 'OFFLINE' | 'CREDIT'>('OFFLINE');

  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Cart & Search State
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [dropdownIndex, setDropdownIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);

  // Row Entry State
  const quickEntryRef = useRef<HTMLInputElement>(null);
  const [quickCode, setQuickCode] = useState('');

  // Financial State
  const [receivedAmount, setReceivedAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [transportAmount, setTransportAmount] = useState('0');

  // Parked Bills State
  const [parkedBills, setParkedBills] = useState<ParkedBill[]>([]);
  const [showParkedModal, setShowParkedModal] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setInvoiceNo('INV-' + Math.floor(Math.random() * 900000 + 100000));
    setCurrentDate(new Date().toLocaleDateString('en-GB'));
    try {
      const saved = localStorage.getItem('pos_cart');
      if (saved) {
         const parsed = JSON.parse(saved);
         const robustCart = parsed.map((c: any) => ({
           id: c.id || c.productId,
           name: c.name,
           barcode: c.barcode || c.code || '',
           price: c.price || c.rate || 0,
           qty: c.qty || 1,
           discountPct: c.discountPct || 0,
           total: c.total || (c.qty * (c.price || c.rate)),
           quantityStr: c.quantityStr || '1 Pc'
         }));
         setCart(robustCart);
      }
    } catch(e) {}

    new GetPosProductsQuery().execute().then(setProducts);
    new GetPosCustomersQuery().execute().then(setCustomers);

    // Load parked bills
    try {
      const savedParked = localStorage.getItem('pos_parked_bills');
      if (savedParked) setParkedBills(JSON.parse(savedParked));
    } catch(e) {}

    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  // Persist parked bills
  useEffect(() => {
    if (isClient) localStorage.setItem('pos_parked_bills', JSON.stringify(parkedBills));
  }, [parkedBills, isClient]);

  useEffect(() => {
    if (isClient) localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart, isClient]);

  // Refs for hotkeys (must exist before useEffect)
  const handleCheckoutRef = useRef<() => void>(() => {});
  const printLastInvoiceRef = useRef<() => void>(() => {});
  const clearBillRef = useRef<() => void>(() => {});
  const holdBillRef = useRef<() => void>(() => {});

  // --- Global Key Handlers ---
  useEffect(() => {
    let keys = '';
    let timer: NodeJS.Timeout;
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      // Hotkeys: F-keys + Ctrl combos (Ctrl combos are reliable, F-keys may be blocked by browser)
      const isHotkey = ['F1','F2','F3','F4','F5','F6','F7','F8','Escape'].includes(e.key)
        || (e.ctrlKey && ['Enter','p','l','m','f','s','h','j'].includes(e.key.toLowerCase()));

      if (isHotkey) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Checkout: F1 OR Ctrl+Enter OR Ctrl+S
      if (e.key === 'F1' || (e.ctrlKey && (e.key === 'Enter' || e.key.toLowerCase() === 's'))) {
        handleCheckoutRef.current();
        return;
      }
      // Print: F2 OR Ctrl+P
      if (e.key === 'F2' || (e.ctrlKey && e.key.toLowerCase() === 'p')) {
        printLastInvoiceRef.current();
        return;
      }
      // Clear: F3 OR Ctrl+L
      if (e.key === 'F3' || (e.ctrlKey && e.key.toLowerCase() === 'l')) {
        clearBillRef.current();
        return;
      }
      // Search Focus: F4 OR Ctrl+F
      if (e.key === 'F4' || (e.ctrlKey && e.key.toLowerCase() === 'f')) {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
          searchInputRef.current.select();
          searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        return;
      }
      // Mode Toggle: F6 OR Ctrl+M (F5 = browser reload, can't override)
      if (e.key === 'F6' || (e.ctrlKey && e.key.toLowerCase() === 'm')) {
        setSaleType(prev => prev === 'ONLINE' ? 'OFFLINE' : prev === 'OFFLINE' ? 'CREDIT' : 'ONLINE');
        return;
      }
      // Hold Bill: F7 OR Ctrl+H
      if (e.key === 'F7' || (e.ctrlKey && e.key.toLowerCase() === 'h')) {
        holdBillRef.current();
        return;
      }
      // Show Parked Bills: F8 OR Ctrl+J
      if (e.key === 'F8' || (e.ctrlKey && e.key.toLowerCase() === 'j')) {
        setShowParkedModal(true);
        return;
      }
      // Escape = close toast
      if (e.key === 'Escape') {
        setShowToast(false);
        return;
      }

      if ((e.target as HTMLElement).tagName === 'INPUT' && (e.target as HTMLElement) !== searchInputRef.current) return;

      clearTimeout(timer);
      if (e.key === 'Enter') {
        if (keys.length > 3) {
          const match = await new LookupBarcodeQuery().execute(keys);
          if (match) addToCart(match);
        }
        keys = '';
      } else if (e.key.length === 1) {
        keys += e.key;
      }
      timer = setTimeout(() => { keys = ''; }, 50);
    };
    window.addEventListener('keydown', handleGlobalKeyDown, true);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown, true);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const p = e.target.value;
    setCustomerPhone(p);
    const existing = customers.find(c => c.phone === p);
    if (existing) {
      setCustomerName(existing.name);
      setCustomerAddress('Retail Location ' + existing.id);
    }
  };

  const filteredProducts = products.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || p.barcode.includes(s) || p.id.toLowerCase().includes(s);
  }).slice(0, 40);

  const addToCart = (p: PosProduct) => {
    setCart(prev => {
      const idx = prev.findIndex(item => item.id === p.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].qty += 1;
        updated[idx].total = updated[idx].qty * updated[idx].price * (1 - updated[idx].discountPct / 100);
        return updated;
      }
      return [...prev, {
        id: p.id, name: p.name, barcode: p.barcode, price: p.price, qty: 1, discountPct: 0, total: p.price, quantityStr: p.quantityStr
      }];
    });
    setSearch('');
    setShowDropdown(false);
    setDropdownIndex(-1);
    setQuickCode('');
    setTimeout(() => {
      if (quickEntryRef.current) quickEntryRef.current.focus();
      else if (searchInputRef.current) searchInputRef.current.focus();
    }, 10);
  };

  const handleQuickEntryKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && quickCode.trim()) {
      const match = await new LookupBarcodeQuery().execute(quickCode);
      if (match) {
        addToCart(match);
      } else {
        alert("Product Code not found!");
      }
    }
  };

  const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setDropdownIndex(prev => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setDropdownIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (search.length >= 4 && filteredProducts.length === 0) {
         const match = await new LookupBarcodeQuery().execute(search);
         if (match) { addToCart(match); return; }
      }
      if (dropdownIndex >= 0 && dropdownIndex < filteredProducts.length) {
        addToCart(filteredProducts[dropdownIndex]);
      } else if (filteredProducts.length > 0) {
        addToCart(filteredProducts[0]);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };

  const updateRow = (id: string, field: 'qty' | 'price' | 'discountPct', val: string) => {
    const num = parseFloat(val) || 0;
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const copy = { ...item };
        copy[field] = num;
        copy.total = copy.qty * copy.price * (1 - copy.discountPct / 100);
        return copy;
      }
      return item;
    }));
  };
  const removeRow = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearBill = () => { if(confirm("Clear current bill?")) { setCart([]); setReceivedAmount(''); setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); }};

  // ===== PARK BILL (Hold current customer's bill, start new) =====
  const holdBill = () => {
    if (cart.length === 0) {
      alert("Cart is empty. Nothing to hold.");
      return;
    }
    const currentTotal = cart.reduce((s, i) => s + i.total, 0);
    const newParked: ParkedBill = {
      id: 'PARK-' + Date.now(),
      customerName: customerName || 'Walk-in',
      customerPhone: customerPhone,
      customerAddress: customerAddress,
      saleType,
      cart: [...cart],
      parkedAt: new Date().toISOString(),
      total: currentTotal,
    };
    setParkedBills(prev => [newParked, ...prev]);
    // Clear current
    setCart([]);
    setReceivedAmount('');
    setDiscountAmount('0');
    setTransportAmount('0');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setShowToast(false);
    setTimeout(() => searchInputRef.current?.focus(), 10);
  };

  // ===== RESUME PARKED BILL =====
  const resumeBill = (parkedId: string) => {
    const parked = parkedBills.find(p => p.id === parkedId);
    if (!parked) return;

    // If current cart has items, ask to park it first
    if (cart.length > 0) {
      if (!confirm("Current cart has items. Park current bill and resume the selected one?")) return;
      holdBill();
    }

    setCart(parked.cart);
    setCustomerName(parked.customerName === 'Walk-in' ? '' : parked.customerName);
    setCustomerPhone(parked.customerPhone);
    setCustomerAddress(parked.customerAddress);
    setSaleType(parked.saleType);
    setParkedBills(prev => prev.filter(p => p.id !== parkedId));
    setShowParkedModal(false);
  };

  // ===== DELETE PARKED BILL =====
  const deleteParkedBill = (parkedId: string) => {
    if (!confirm("Delete this parked bill permanently?")) return;
    setParkedBills(prev => prev.filter(p => p.id !== parkedId));
  };

  // Math
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const manualDisc = parseFloat(discountAmount) || 0;
  const manualTransport = parseFloat(transportAmount) || 0;

  const taxableAmount = subtotal - manualDisc;
  const taxAmount = taxableAmount * 0.05;
  let grandTotal = taxableAmount + taxAmount + manualTransport;

  const rAmt = parseFloat(receivedAmount) || 0;
  const balance = (rAmt > 0 && rAmt > grandTotal) ? (rAmt - grandTotal) : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty.");
    if (saleType === 'CREDIT' && (!customerName || !customerPhone)) {
       return alert("Customer Name and Phone are REQUIRED for Credit Sales!");
    }

    const payload = {
       invoiceId: invoiceNo,
       date: currentDate,
       customer: { name: customerName || 'Walk-in Customer', phone: customerPhone, address: customerAddress },
       saleType,
       items: cart,
       subtotal,
       discount: manualDisc,
       transport: manualTransport,
       taxAmount,
       grandTotal,
       receivedAmount: rAmt,
       balance
    };

    // SAVE TRANSACTION
    const cmd = new CreateSaleTransactionCommand();
    await cmd.execute(payload as any);

    // STORE IN REPORT for Online/Offline/Credit
    saveToReport(payload);

    // IF CREDIT SALE -> Create Customer Ledger Entry
    if (saleType === 'CREDIT') {
      try {
        await new CreateLedgerCommand().execute({
          type: 'CUSTOMER',
          partyName: customerName,
          invoiceNumber: invoiceNo,
          invoiceDate: new Date().toISOString(),
          amount: Math.round(grandTotal),
          creditDays: 30
        });
      } catch (err) {
        console.error("Ledger Update Failed:", err);
      }
    }

    // CLEAR FOR NEXT ORDER
    setLastOrder(payload);
    setCart([]);
    setReceivedAmount('');
    setDiscountAmount('0');
    setTransportAmount('0');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');

    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);

    setTimeout(() => {
        if (quickEntryRef.current) quickEntryRef.current.focus();
    }, 10);
  };

  const printLastInvoice = () => {
    if (!lastOrder) {
      alert('No invoice to print. Please complete a checkout first.');
      return;
    }
    const printWindow = window.open('', '', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(generateBeautifulHTML(lastOrder));
      printWindow.document.close();
    }
  };

  const generateBeautifulHTML = (data: any) => {
     const items = (data.items || []).map((item: any, i: number) => `
       <tr>
         <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b">${i + 1}</td>
         <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;font-weight:700">${item.name}${item.quantityStr && item.quantityStr !== '1 Pc' ? ` <span style="color:#059669;font-size:11px">(${item.quantityStr})</span>` : ''}</td>
         <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:center">${item.qty}</td>
         <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right">₹${item.price.toFixed(2)}</td>
         <td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:700">₹${item.total.toFixed(2)}</td>
       </tr>
     `).join('');

     const now = new Date();
     const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

     return `
     <html>
     <head>
       <title>Invoice ${data.invoiceId}</title>
       <style>
         * { margin: 0; padding: 0; box-sizing: border-box; }
         body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; color: #1e293b; max-width: 380px; margin: 0 auto; }
         @media print { body { padding: 5px; max-width: 100%; } }
       </style>
     </head>
     <body onload="window.print()">
       <!-- Header -->
       <div style="text-align:center;border-bottom:2px dashed #cbd5e1;padding-bottom:12px;margin-bottom:12px">
         <h1 style="font-size:22px;font-weight:900;letter-spacing:2px;margin-bottom:2px"># HASHTAG</h1>
         <p style="font-size:10px;color:#64748b;letter-spacing:3px;text-transform:uppercase">Billing Solutions</p>
         <p style="font-size:11px;color:#475569;margin-top:6px">123, Main Road, Your City - 600001</p>
         <p style="font-size:11px;color:#475569">Ph: +91 98765 43210 | GSTIN: 33XXXXX1234X1ZX</p>
       </div>

       <!-- Invoice Info -->
       <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
         <div>
           <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Invoice No</div>
           <div style="font-weight:800;color:#0f172a">${data.invoiceId}</div>
         </div>
         <div style="text-align:center">
           <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Date</div>
           <div style="font-weight:700">${data.date}</div>
         </div>
         <div style="text-align:right">
           <div style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Time</div>
           <div style="font-weight:700">${timeStr}</div>
         </div>
       </div>

       <!-- Customer -->
       <div style="font-size:12px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
         <div style="display:flex;justify-content:space-between">
           <div><span style="color:#64748b">Customer:</span> <strong>${data.customer?.name || 'Walk-in Customer'}</strong></div>
           <div><span style="color:#64748b">Mode:</span> <strong style="color:${data.saleType === 'CREDIT' ? '#ea580c' : '#059669'}">${data.saleType}</strong></div>
         </div>
         ${data.customer?.phone ? `<div style="margin-top:2px"><span style="color:#64748b">Phone:</span> ${data.customer.phone}</div>` : ''}
       </div>

       <!-- Items Table -->
       <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:12px">
         <thead>
           <tr style="background:#f1f5f9">
             <th style="padding:8px 6px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;border-bottom:2px solid #cbd5e1;width:30px">#</th>
             <th style="padding:8px 6px;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;border-bottom:2px solid #cbd5e1">Item</th>
             <th style="padding:8px 6px;text-align:center;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;border-bottom:2px solid #cbd5e1;width:40px">Qty</th>
             <th style="padding:8px 6px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;border-bottom:2px solid #cbd5e1;width:65px">Rate</th>
             <th style="padding:8px 6px;text-align:right;font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#64748b;border-bottom:2px solid #cbd5e1;width:75px">Amount</th>
           </tr>
         </thead>
         <tbody>${items}</tbody>
       </table>

       <!-- Totals -->
       <div style="border-top:2px dashed #cbd5e1;padding-top:10px;font-size:12px">
         <div style="display:flex;justify-content:space-between;margin-bottom:4px">
           <span style="color:#64748b">Sub Total</span>
           <span style="font-weight:700">₹${data.subtotal.toFixed(2)}</span>
         </div>
         ${data.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px">
           <span style="color:#64748b">Discount</span>
           <span style="font-weight:700;color:#ef4444">-₹${data.discount.toFixed(2)}</span>
         </div>` : ''}
         <div style="display:flex;justify-content:space-between;margin-bottom:4px">
           <span style="color:#64748b">Tax (5%)</span>
           <span style="font-weight:700">₹${data.taxAmount.toFixed(2)}</span>
         </div>
         ${data.transport > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:4px">
           <span style="color:#64748b">Transport</span>
           <span style="font-weight:700">₹${data.transport.toFixed(2)}</span>
         </div>` : ''}
         <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:2px solid #0f172a;font-size:18px;font-weight:900">
           <span>GRAND TOTAL</span>
           <span>₹${data.grandTotal.toFixed(2)}</span>
         </div>
         ${data.receivedAmount > 0 ? `
         <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:12px">
           <span style="color:#059669;font-weight:700">Paid</span>
           <span style="color:#059669;font-weight:700">₹${data.receivedAmount.toFixed(2)}</span>
         </div>
         <div style="display:flex;justify-content:space-between;font-size:12px">
           <span style="color:#64748b">Balance</span>
           <span style="font-weight:700">₹${data.balance.toFixed(2)}</span>
         </div>` : ''}
       </div>

       <!-- Footer -->
       <div style="text-align:center;margin-top:20px;padding-top:12px;border-top:2px dashed #cbd5e1;font-size:11px;color:#94a3b8">
         <p style="font-weight:700;margin-bottom:4px">Thank You! Visit Again!</p>
         <p>Items: ${data.items.length} | Total Qty: ${data.items.reduce((s: number, i: any) => s + i.qty, 0)}</p>
         <p style="margin-top:6px;font-size:9px;letter-spacing:1px">Powered by HASHTAG Billing Solutions</p>
       </div>
     </body>
     </html>`;
  };

  // Update ref values on every render so closures use latest functions
  handleCheckoutRef.current = handleCheckout;
  printLastInvoiceRef.current = printLastInvoice;
  clearBillRef.current = clearBill;
  holdBillRef.current = holdBill;

  const modeIcon = saleType === 'ONLINE' ? <Wifi size={12} /> : saleType === 'OFFLINE' ? <WifiOff size={12} /> : <CreditCard size={12} />;
  const modeColor = saleType === 'ONLINE' ? 'text-emerald-600' : saleType === 'OFFLINE' ? 'text-blue-600' : 'text-orange-600';

  return (
    <div className="flex flex-col h-[85vh] bg-slate-100 rounded-lg overflow-hidden font-sans border border-slate-300 shadow-xl relative w-full">

      {/* 1. TOP INFO */}
      <div className="bg-white border-b-2 border-slate-400 p-2 shadow-sm shrink-0 flex flex-col xl:flex-row gap-2 z-20">
         <div className="flex-1 bg-slate-100 border border-slate-300 p-2 text-[11px] font-bold text-slate-700 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
             <div className="flex items-center gap-2 w-48"><span className="w-16 uppercase text-slate-500">Bill No</span><span className="bg-white border px-1 w-full text-blue-700 h-5 flex items-center">{invoiceNo}</span></div>
             <div className="flex items-center gap-2"><span className="w-20 uppercase text-slate-500">Name</span><input type="text" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="bg-white border px-1 w-full uppercase outline-none focus:border-blue-500 h-5" /></div>
             <div className="flex items-center gap-2 w-48"><span className="w-16 uppercase text-slate-500">Date</span><span className="bg-white border px-1 w-full h-5 flex items-center">{currentDate}</span></div>
             <div className="flex items-center gap-2"><span className="w-20 uppercase text-slate-500">Phone</span><input type="text" value={customerPhone} onChange={handlePhoneChange} className="bg-white border px-1 w-full uppercase outline-none focus:border-blue-500 h-5" /></div>
             <div className="flex items-center gap-2 w-48">
               <span className="w-16 uppercase text-slate-500">Mode</span>
               <select value={saleType} onChange={e=>setSaleType(e.target.value as any)} className={`bg-white border w-full h-5 outline-none font-black text-[10px] ${modeColor}`}>
                 <option value="ONLINE">ONLINE</option>
                 <option value="OFFLINE">OFFLINE</option>
                 <option value="CREDIT">CREDIT</option>
               </select>
             </div>
             <div className="flex items-center gap-2"><span className="w-20 uppercase text-slate-500">Address</span><input type="text" value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)} className="bg-white border px-1 w-full outline-none h-5" /></div>
         </div>
         <div className="flex-1 bg-white border border-slate-300 flex flex-col min-w-[350px] shadow-sm">
            <div className="p-1 px-2 flex items-center justify-between bg-slate-50 border-b">
               <label className="text-[10px] font-black uppercase text-emerald-700 tracking-tighter">Product Browse / Search</label>
               <span className="text-[9px] font-bold text-slate-400">Items: {filteredProducts.length}</span>
            </div>
            <div className="p-2 flex gap-2">
               <div className="flex relative items-stretch flex-1">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"><Search size={14}/></div>
                  <input ref={searchInputRef} type="text" value={search} onChange={e=>{setSearch(e.target.value); setShowDropdown(true);}} onKeyDown={handleSearchKeyDown} placeholder="Type Name or Scan..." className="w-full pl-7 pr-2 py-2 bg-white border-2 border-emerald-500 outline-none font-black text-sm text-slate-900 rounded placeholder:text-slate-400" />
               </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[160px] p-2 bg-slate-50 scrollbar-thin">
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {filteredProducts.map((p, i) => (
                    <button key={p.id} onClick={() => addToCart(p)} className={`group relative flex flex-col p-2 bg-white border rounded shadow-sm hover:border-emerald-500 hover:shadow-md transition text-left active:scale-[0.98] min-h-[65px] ${dropdownIndex === i ? 'ring-2 ring-emerald-400' : ''}`}>
                       <div className="text-[10px] font-extrabold text-slate-700 leading-snug mb-0.5 break-words whitespace-normal">{p.name}</div>
                       {p.quantityStr !== '1 Pc' && <div className="text-[9px] font-black text-emerald-600 mb-1">{p.quantityStr}</div>}
                       <div className="mt-auto flex items-center justify-between">
                          <span className="text-[11px] font-black text-emerald-700">₹{p.price.toFixed(0)}</span>
                          <span className="text-[7px] bg-slate-100 px-1 rounded font-bold text-slate-400 uppercase truncate max-w-[55px]">{p.categoryId}</span>
                       </div>
                       <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition">
                          <Plus size={10} className="text-emerald-500 font-bold"/>
                       </div>
                    </button>
                  ))}
                  {filteredProducts.length === 0 && (
                     <div className="col-span-full py-10 text-center text-[10px] uppercase font-black text-slate-300 tracking-widest">No Matches Found</div>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* 2. TABLE */}
      <div className="flex-1 overflow-auto bg-white border-b-2 border-slate-400 relative">
        <table className="w-full text-left whitespace-nowrap text-xs border-collapse">
          <thead className="bg-[#e2e8f0] sticky top-0 z-10 text-slate-800 font-bold border-b-2 border-slate-400">
             <tr><th className="p-1 px-2 border-r w-10">S.No</th><th className="p-1 px-2 border-r">Description</th><th className="p-1 px-2 border-r w-16 text-center">Qty</th><th className="p-1 px-2 text-right border-r w-24">Rate</th><th className="p-1 px-2 text-right w-28">Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-bold text-slate-900 bg-[#f8fafc]">
             {cart.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50">
                   <td className="p-1 px-2 text-center text-slate-500 border-r">{index + 1}</td>
                   <td className="p-1 px-2 uppercase border-r flex justify-between items-center group">
                     <span className="flex-1">
                       {item.name}
                       {item.quantityStr !== '1 Pc' && <span className="text-emerald-600 text-[9px] ml-1 font-black normal-case">({item.quantityStr})</span>}
                     </span>
                     <button onClick={()=>removeRow(item.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                   </td>
                   <td className="p-0 border-r"><input type="number" value={item.qty} onChange={(e) => updateRow(item.id, 'qty', e.target.value)} className="w-16 text-center font-black outline-none bg-transparent h-7" /></td>
                   <td className="p-0 border-r"><input type="number" value={item.price} onChange={(e) => updateRow(item.id, 'price', e.target.value)} className="w-24 text-right font-black outline-none bg-transparent pr-2 h-7" /></td>
                   <td className="p-1 px-2 text-right font-black text-blue-800">₹{item.total.toFixed(2)}</td>
                </tr>
             ))}
             {cart.length === 0 && (<tr><td colSpan={5} className="text-center py-20 text-slate-300">Empty Invoice</td></tr>)}
             <tr className="bg-white border-t-2 border-slate-300">
                <td className="p-1 px-2 text-center text-emerald-600 border-r"><Plus size={14} className="mx-auto"/></td>
                <td className="p-0 border-r" colSpan={2}><input ref={quickEntryRef} type="text" value={quickCode} onChange={e=>setQuickCode(e.target.value)} onKeyDown={handleQuickEntryKeyDown} placeholder="Scan Item Here..." className="w-full h-8 px-3 font-black text-blue-700 outline-none uppercase" /></td>
                <td colSpan={2} className="bg-slate-50"></td>
             </tr>
          </tbody>
        </table>
      </div>

      {/* 3. FOOTER */}
      <div className="flex bg-slate-100 h-44 shrink-0 text-xs font-bold border-t-2 border-slate-400">
         <div className="w-[30%] border-r border-slate-400 flex flex-col justify-end">
            <div className="grid grid-cols-5 text-center bg-teal-800 text-white font-medium p-[1px]">
               <button onClick={clearBill} className="bg-teal-600 py-2 flex flex-col items-center"><span>Clear</span><span className="text-[8px] opacity-60">F3</span></button>
               <button onClick={printLastInvoice} className="bg-teal-600 flex flex-col items-center justify-center"><span>Print</span><span className="text-[8px] opacity-60">F2</span></button>
               <button onClick={() => searchInputRef.current?.focus()} className="bg-teal-600 flex flex-col items-center justify-center"><span>Search</span><span className="text-[8px] opacity-60">F4</span></button>
               <button onClick={holdBill} className="bg-amber-600 hover:bg-amber-500 flex flex-col items-center justify-center"><span>Hold</span><span className="text-[8px] opacity-60">F7/^H</span></button>
               <button onClick={() => setShowParkedModal(true)} className="bg-blue-600 hover:bg-blue-500 flex flex-col items-center justify-center relative">
                 <span>Parked</span>
                 <span className="text-[8px] opacity-60">F8/^J</span>
                 {parkedBills.length > 0 && (
                   <span className="absolute top-0 right-1 bg-red-500 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{parkedBills.length}</span>
                 )}
               </button>
            </div>
         </div>
         <div className="w-[40%] bg-[#5CC8F2] border-r border-slate-400 flex flex-col items-center justify-center p-3 shadow-inner">
            <div className="flex items-center gap-2 mb-1">
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                saleType === 'ONLINE' ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' :
                saleType === 'OFFLINE' ? 'bg-blue-100 text-blue-700 border border-blue-300' :
                'bg-orange-100 text-orange-700 border border-orange-300'
              }`}>
                {modeIcon} {saleType}
              </span>
            </div>
            <div className="text-red-600 text-xl font-black uppercase tracking-tighter" style={{textShadow: '1px 1px 0 #fff'}}>Total Amount</div>
            <div className="text-blue-950 text-7xl font-black leading-none my-1">{grandTotal.toFixed(2)}</div>
            <div className="flex gap-2 w-full mt-auto">
               <button
                 onClick={handleCheckout}
                 className={`flex-1 py-3 rounded-lg border-b-4 font-black uppercase text-xs shadow-lg active:translate-y-1 active:border-b-0 transition flex flex-col items-center ${
                   saleType === 'CREDIT'
                     ? 'bg-orange-600 text-white border-orange-800'
                     : 'bg-emerald-600 text-white border-emerald-800'
                 }`}
               >
                 <span className="flex items-center gap-1">{modeIcon} Checkout (F1)</span>
                 <span className="text-[9px] opacity-70">
                   {saleType === 'ONLINE' ? 'Online Payment' : saleType === 'OFFLINE' ? 'Cash Payment' : 'Credit → Ledger'}
                 </span>
               </button>
            </div>
         </div>
         <div className="w-[30%] bg-white p-2 flex flex-col justify-center">
            <table className="w-full text-right border-collapse text-[12px]">
               <tbody>
                  <tr><td className="text-left font-bold text-slate-500">Items</td><td className="font-black text-slate-800">{cart.length} | {totalItems.toFixed(0)}</td></tr>
                  <tr><td className="text-left font-bold text-slate-500">Sub Total</td><td className="font-black text-blue-800">₹{subtotal.toFixed(2)}</td></tr>
                  <tr className="border-t"><td className="text-left font-bold text-emerald-600">Paid</td><td><input type="number" value={receivedAmount} onChange={e=>setReceivedAmount(e.target.value)} placeholder="0" className="w-full text-right outline-none bg-emerald-50 h-8 border-2 border-emerald-300 rounded px-2 font-black text-[14px] focus:border-emerald-500" /></td></tr>
                  <tr><td className="text-left font-bold text-red-600">Balance</td><td className="text-red-700 font-black text-lg">₹{balance.toFixed(2)}</td></tr>
               </tbody>
            </table>
         </div>
      </div>

      {showToast && (
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-350">
            <div className="bg-slate-900 text-white rounded-full px-8 py-4 shadow-2xl flex items-center gap-6 border border-emerald-500/50">
               <span className="font-black uppercase tracking-widest text-xs flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                 {lastOrder?.saleType === 'CREDIT' ? 'Credit Saved to Ledger' : 'Sale Complete'}: {lastOrder?.invoiceId}
               </span>
               <button onClick={printLastInvoice} className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-black uppercase text-xs pl-6 border-l border-slate-700"><Printer size={16}/> Print</button>
               <button onClick={() => setShowToast(false)} className="text-slate-500 hover:text-white transition"><XCircle size={20}/></button>
            </div>
         </div>
      )}

      {/* PARKED BILLS MODAL */}
      {showParkedModal && (
        <div className="fixed inset-0 z-[200] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white max-w-3xl w-full max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black uppercase tracking-widest text-white">Parked Bills</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">{parkedBills.length} bill{parkedBills.length !== 1 ? 's' : ''} on hold</p>
              </div>
              <button onClick={() => setShowParkedModal(false)} className="text-slate-400 hover:text-white"><XCircle size={24}/></button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-slate-50">
              {parkedBills.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex p-5 rounded-full bg-white border border-slate-200 mb-4">
                    <ShoppingCart size={40} className="text-slate-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-400">No parked bills</p>
                  <p className="text-sm text-slate-300 mt-1">Press <kbd className="px-2 py-0.5 bg-slate-200 rounded text-xs">F7</kbd> or click Hold to park current bill</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {parkedBills.map(p => (
                    <div key={p.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-black text-slate-800 text-base">{p.customerName}</span>
                          {p.customerPhone && <span className="text-xs text-slate-500 font-bold">📞 {p.customerPhone}</span>}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                            p.saleType === 'ONLINE' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            p.saleType === 'OFFLINE' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-orange-50 text-orange-700 border-orange-200'
                          }`}>{p.saleType}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-bold flex items-center gap-3">
                          <span>{p.cart.length} items</span>
                          <span>•</span>
                          <span>₹{p.total.toFixed(2)}</span>
                          <span>•</span>
                          <span>Parked: {new Date(p.parkedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => resumeBill(p.id)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-black text-xs uppercase tracking-wider hover:bg-emerald-500 transition shadow-sm">Resume</button>
                        <button onClick={() => deleteParkedBill(p.id)} className="px-3 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition border border-red-100"><Trash2 size={14}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
