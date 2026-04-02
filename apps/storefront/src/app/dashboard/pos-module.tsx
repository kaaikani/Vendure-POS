"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, ScanLine, ShoppingCart, Trash2, Plus, Minus, Printer, Download, Save, XCircle
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

export default function PosModule() {
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [customers, setCustomers] = useState<PosCustomer[]>([]);
  
  // Invoice Details
  const [invoiceNo] = useState('INV-' + Math.floor(Math.random() * 900000 + 100000));
  const [currentDate] = useState(new Date().toLocaleDateString('en-GB'));
  
  const [saleType, setSaleType] = useState<'CASH' | 'CREDIT'>('CASH');
  
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
  const [lastOrder, setLastOrder] = useState<any>(null); // For non-blocking print
  const [showToast, setShowToast] = useState(false);
  
  // Row Entry State
  const quickEntryRef = useRef<HTMLInputElement>(null);
  const [quickCode, setQuickCode] = useState('');

  // Financial State
  const [receivedAmount, setReceivedAmount] = useState('');
  const [discountAmount, setDiscountAmount] = useState('0');
  const [transportAmount, setTransportAmount] = useState('0');

  useEffect(() => {
    setIsClient(true);
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
    
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  useEffect(() => {
    if (isClient) localStorage.setItem('pos_cart', JSON.stringify(cart));
  }, [cart, isClient]);

  // --- Global Key Handlers ---
  useEffect(() => {
    let keys = '';
    let timer: NodeJS.Timeout;
    const handleGlobalKeyDown = async (e: KeyboardEvent) => {
      // Hotkey for Save
      if (e.key === 'F1') {
         e.preventDefault();
         handleCheckout();
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
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [products]);

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
    if (!search) return true; // Show all by default (filtered to top 40 for UI)
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
    setQuickCode(''); // Clear direct row too
    // Prioritize focus to quick entry row if it exists
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

  const manualAddBtnClick = async () => {
      if (search.length >= 4 && filteredProducts.length === 0) {
         const match = await new LookupBarcodeQuery().execute(search);
         if (match) { addToCart(match); return; }
      }
      if (dropdownIndex >= 0 && dropdownIndex < filteredProducts.length) addToCart(filteredProducts[dropdownIndex]);
      else if (filteredProducts.length > 0) addToCart(filteredProducts[0]);
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
  const clearBill = () => { if(confirm("Clear current bill?")) { setCart([]); setReceivedAmount(''); }};

  // Math
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const manualDisc = parseFloat(discountAmount) || 0;
  const manualTransport = parseFloat(transportAmount) || 0;

  const taxableAmount = subtotal - manualDisc;
  const taxAmount = taxableAmount * 0.05; // fixed 5% mockup
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
       customer: { name: customerName, phone: customerPhone, address: customerAddress },
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

    // IF CREDIT SALE -> Update Customer Ledger
    if (saleType === 'CREDIT') {
      try {
        await new CreateLedgerCommand().execute({
          type: 'CUSTOMER',
          partyName: customerName,
          invoiceNumber: invoiceNo,
          invoiceDate: new Date().toISOString().split('T')[0],
          amount: grandTotal,
          creditDays: 30 
        });
      } catch (err) {
        console.error("Ledger Update Failed:", err);
      }
    }

    // IMMEDIATE COMPLETION: CLEAR FOR NEXT ORDER
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
    if (!lastOrder) return;
    const printWindow = window.open('', '', 'width=800,height=900');
    if (printWindow) {
      printWindow.document.write(generateBeautifulHTML(lastOrder));
      printWindow.document.close();
    }
  };

  const generateBeautifulHTML = (data: any) => {
     return `
     <html>
     <head><style>body { font-family: sans-serif; padding: 20px; }</style></head>
     <body>
       <h1>BILL: ${data.invoiceId}</h1>
       <p>Customer: ${data.customer.name}</p>
       <p>Total: ₹${data.grandTotal.toFixed(2)}</p>
     </body>
     </html>`;
  };

  return (
    <div className="flex flex-col h-[85vh] bg-slate-100 rounded-lg overflow-hidden font-sans border border-slate-300 shadow-xl relative w-full">
      
      {/* 1. TOP INFO */}
      <div className="bg-white border-b-2 border-slate-400 p-2 shadow-sm shrink-0 flex flex-col xl:flex-row gap-2 z-20">
         <div className="flex-1 bg-slate-100 border border-slate-300 p-2 text-[11px] font-bold text-slate-700 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
             <div className="flex items-center gap-2 w-48"><span className="w-16 uppercase text-slate-500">Bill No</span><span className="bg-white border px-1 w-full text-blue-700 h-5 flex items-center">{invoiceNo}</span></div>
             <div className="flex items-center gap-2"><span className="w-20 uppercase text-slate-500">Name</span><input type="text" value={customerName} onChange={e=>setCustomerName(e.target.value)} className="bg-white border px-1 w-full uppercase outline-none focus:border-blue-500 h-5" /></div>
             <div className="flex items-center gap-2 w-48"><span className="w-16 uppercase text-slate-500">Date</span><span className="bg-white border px-1 w-full h-5 flex items-center">{currentDate}</span></div>
             <div className="flex items-center gap-2"><span className="w-20 uppercase text-slate-500">Phone</span><input type="text" value={customerPhone} onChange={handlePhoneChange} className="bg-white border px-1 w-full uppercase outline-none focus:border-blue-500 h-5" /></div>
             <div className="flex items-center gap-2 w-48"><span className="w-16 uppercase text-slate-500">Mode</span><select value={saleType} onChange={e=>setSaleType(e.target.value as any)} className="bg-white border w-full text-blue-700 h-5 outline-none font-bold"><option value="CASH">CASH</option><option value="CREDIT">CREDIT PENDING</option></select></div>
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
                  <input ref={searchInputRef} type="text" value={search} onChange={e=>{setSearch(e.target.value); setShowDropdown(true);}} onKeyDown={handleSearchKeyDown} placeholder="Type Name or Scan..." className="w-full pl-7 pr-2 py-1.5 bg-emerald-50 border-2 border-emerald-500 outline-none font-black text-xs uppercase" />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto max-h-[160px] p-2 bg-slate-50 scrollbar-thin">
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {filteredProducts.map((p, i) => (
                    <button key={p.id} onClick={() => addToCart(p)} className={`group relative flex flex-col p-2 bg-white border rounded shadow-sm hover:border-emerald-500 hover:shadow-md transition text-left active:scale-[0.98] ${dropdownIndex === i ? 'ring-2 ring-emerald-400' : ''}`}>
                       <div className="text-[9px] font-black text-slate-400 mb-0.5 truncate uppercase">#{p.barcode.slice(-4)}</div>
                       <div className="text-[10px] font-extrabold text-slate-700 leading-tight mb-1 line-clamp-2 h-7">{p.name}</div>
                       <div className="mt-auto flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-700">₹{p.price.toFixed(1)}</span>
                          <span className="text-[8px] bg-slate-100 px-1 rounded font-bold text-slate-500 uppercase">{p.categoryId}</span>
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
             <tr><th className="p-1 px-2 border-r w-10">S.No</th><th className="p-1 px-2 border-r w-full">Description</th><th className="p-1 px-2 border-r w-20 text-center">Qty</th><th className="p-1 px-2 text-right border-r w-28">Rate</th><th className="p-1 px-2 text-right w-28">Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-bold text-slate-900 bg-[#f8fafc]">
             {cart.map((item, index) => (
                <tr key={item.id} className="hover:bg-blue-50">
                   <td className="p-1 px-2 text-center text-slate-500 border-r">{index + 1}</td>
                   <td className="p-1 px-2 uppercase border-r flex justify-between items-center group"><span>{item.name}</span><button onClick={()=>removeRow(item.id)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button></td>
                   <td className="p-0 border-r"><input type="number" value={item.qty} onChange={(e) => updateRow(item.id, 'qty', e.target.value)} className="w-full text-center font-black outline-none bg-transparent h-7" /></td>
                   <td className="p-0 border-r"><input type="number" value={item.price} onChange={(e) => updateRow(item.id, 'price', e.target.value)} className="w-full text-right font-black outline-none bg-transparent pr-2 h-7" /></td>
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
               <button onClick={clearBill} className="bg-teal-600 py-2">Clear</button>
               <button className="bg-teal-600">Print</button>
               <button className="bg-teal-600">View</button>
               <button className="bg-teal-600">Cancel</button>
               <button className="bg-teal-600">Close</button>
            </div>
         </div>
         <div className="w-[40%] bg-[#5CC8F2] border-r border-slate-400 flex flex-col items-center justify-center p-3 shadow-inner">
            <div className="text-red-600 text-xl font-black uppercase tracking-tighter" style={{textShadow: '1px 1px 0 #fff'}}>Total Amount</div>
            <div className="text-blue-950 text-7xl font-black leading-none my-1">{grandTotal.toFixed(2)}</div>
            <div className="flex gap-2 w-full mt-auto">
               <button onClick={() => { setSaleType('CASH'); setTimeout(handleCheckout, 0); }} className="flex-1 bg-emerald-600 text-white py-3 rounded-lg border-b-4 border-emerald-800 font-black uppercase text-xs shadow-lg active:translate-y-1 active:border-b-0 transition flex flex-col items-center"><span>Cash Pay</span><span className="text-[9px] opacity-70">Credit: OFF</span></button>
               <button onClick={() => { setSaleType('CREDIT'); setTimeout(handleCheckout, 0); }} className="flex-1 bg-blue-700 text-white py-3 rounded-lg border-b-4 border-blue-900 font-black uppercase text-xs shadow-lg active:translate-y-1 active:border-b-0 transition flex flex-col items-center"><span>Credit Pay</span><span className="text-[9px] opacity-70">Credit: ON</span></button>
            </div>
         </div>
         <div className="w-[30%] bg-white p-2 flex flex-col justify-center">
            <table className="w-full text-right border-collapse text-[12px]">
               <tbody>
                  <tr><td className="text-left font-bold text-slate-500">Items</td><td className="font-black text-slate-800">{cart.length} | {totalItems.toFixed(0)}</td></tr>
                  <tr><td className="text-left font-bold text-slate-500">Sub Total</td><td className="font-black text-blue-800">₹{subtotal.toFixed(2)}</td></tr>
                  <tr className="border-t"><td className="text-left font-bold text-emerald-600">Paid</td><td><input type="number" value={receivedAmount} onChange={e=>setReceivedAmount(e.target.value)} className="w-full text-right outline-none bg-emerald-50 h-7 border-b-2 border-emerald-200 font-black" /></td></tr>
                  <tr><td className="text-left font-bold text-red-600">Balance</td><td className="text-red-700 font-black text-lg">₹{balance.toFixed(2)}</td></tr>
               </tbody>
            </table>
         </div>
      </div>

      {showToast && (
         <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-350">
            <div className="bg-slate-900 text-white rounded-full px-8 py-4 shadow-2xl flex items-center gap-6 border border-emerald-500/50">
               <span className="font-black uppercase tracking-widest text-xs flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Success: {lastOrder?.invoiceId}</span>
               <button onClick={printLastInvoice} className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-black uppercase text-xs pl-6 border-l border-slate-700"><Printer size={16}/> Print</button>
               <button onClick={() => setShowToast(false)} className="text-slate-500 hover:text-white transition"><XCircle size={20}/></button>
            </div>
         </div>
      )}
    </div>
  );
}
