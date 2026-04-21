"use client";
import React, { useState, useEffect, useRef } from 'react';
import { LookupBarcodeQuery } from '../../core/queries/PosQueries';
import { CreateLedgerCommand } from '../../core/queries/ledger.query';
import { ListItemsQuery, CreateSaleCommand, ListSalesQuery } from '../../core/queries/pharma.query';

const GST_RATE = 0.18;

function saveToReport(order) { try { const e = JSON.parse(localStorage.getItem('pos_reports') || '[]'); e.unshift({ ...order, timestamp: new Date().toISOString() }); localStorage.setItem('pos_reports', JSON.stringify(e)); } catch {} }

export default function PosModule() {
    const [pharmaItems, setPharmaItems] = useState([]);
    const [billNo, setBillNo] = useState('');
    const [lastBillNo, setLastBillNo] = useState('3');
    const [date, setDate] = useState(new Date().toLocaleDateString('en-GB'));
    const [mode, setMode] = useState('CASH');
    const [book, setBook] = useState('NA');
    const [billRef, setBillRef] = useState('');
    const [customerEnabled, setCustomerEnabled] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [salesMan, setSalesMan] = useState('');
    const [customerRef, setCustomerRef] = useState('');
    const [quotation, setQuotation] = useState('');
    const [bundleNo, setBundleNo] = useState('');
    const [igst, setIgst] = useState(false);
    const [nonAcc, setNonAcc] = useState(false);
    const [header, setHeader] = useState(false);
    const [taxType, setTaxType] = useState('WTax');
    const [rateType, setRateType] = useState('ARate');
    const [rows, setRows] = useState([{ sno: 1, code: '', itemName: '', qty: '', rate: '', amount: '', total: '' }]);
    const [receivedAmt, setReceivedAmt] = useState('');
    const [discount, setDiscount] = useState('0');
    const [transportCharges, setTransportCharges] = useState('0');
    const [debitPoint, setDebitPoint] = useState('0');
    const [remarks, setRemarks] = useState('');

    const [showSearch, setShowSearch] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [searchRowIdx, setSearchRowIdx] = useState(-1);
    const [searchSelIdx, setSearchSelIdx] = useState(0);
    const [selectedProduct, setSelectedProduct] = useState(null); // For stock display
    const searchRef = useRef(null);

    const [lastOrder, setLastOrder] = useState(null);
    const [showToast, setShowToast] = useState(false);

    // Parked/Hold bills
    const [parkedBills, setParkedBills] = useState([]);
    const [showParkedModal, setShowParkedModal] = useState(false);
    const [parkedSelIdx, setParkedSelIdx] = useState(0);

    // Keyboard navigation
    const [focusedRow, setFocusedRow] = useState(-1); // cart row index under arrow focus

    useEffect(() => {
        setBillNo(String(Math.floor(Math.random() * 900 + 100)));
        setDate(new Date().toLocaleDateString('en-GB'));
        const reports = JSON.parse(localStorage.getItem('pos_reports') || '[]');
        setLastBillNo(String(reports.length || 3));
        // Load items via API (cached — only one hit)
        new ListItemsQuery().execute().then(setPharmaItems).catch(e => console.error(e));
        // Load parked bills
        try { setParkedBills(JSON.parse(localStorage.getItem('pos_parked_bills') || '[]')); } catch {}
        // ⚡ AUTO-OPEN search popup on load — keyboard-first workflow
        setTimeout(() => {
            setSearchRowIdx(0);
            setSearchText('');
            setSearchSelIdx(0);
            setShowSearch(true);
            searchRef.current?.focus();
        }, 300);
    }, []);

    // Persist parked bills
    useEffect(() => {
        localStorage.setItem('pos_parked_bills', JSON.stringify(parkedBills));
    }, [parkedBills]);

    const totalItems = rows.reduce((s, r) => s + (parseFloat(r.qty) || 0), 0);
    const subTotal = rows.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const taxAmount = taxType === 'WTax' ? Math.round(subTotal * GST_RATE * 100) / 100 : 0;
    const discAmt = parseFloat(discount) || 0;
    const transportAmt = parseFloat(transportCharges) || 0;
    const grandTotal = Math.round((subTotal + taxAmount + transportAmt - discAmt) * 100) / 100;
    const receivedA = parseFloat(receivedAmt) || 0;
    const balance = Math.round((grandTotal - receivedA) * 100) / 100;

    const addRow = () => setRows(prev => [...prev, { sno: prev.length + 1, code: '', itemName: '', qty: '', rate: '', amount: '', total: '' }]);

    const updateRow = (idx, field, val) => {
        setRows(prev => prev.map((r, i) => {
            if (i !== idx) return r;
            const u = { ...r, [field]: val };
            const qty = parseFloat(u.qty) || 0;
            const rate = parseFloat(u.rate) || 0;
            const amt = qty * rate;
            u.amount = amt.toFixed(2);
            u.total = amt.toFixed(2);
            return u;
        }));
    };

    const openSearch = (rowIdx) => {
        setSearchRowIdx(rowIdx); setSearchText(''); setSearchSelIdx(0); setShowSearch(true);
        setTimeout(() => searchRef.current?.focus(), 50);
    };

    const pickItem = (item) => {
        if (!item) return;
        setSelectedProduct(item);
        let idx = searchRowIdx;
        let isLastRow = false;
        setRows(prev => {
            let nr = [...prev];
            while (nr.length <= idx) nr.push({ sno: nr.length + 1, code: '', itemName: '', qty: '', rate: '', amount: '', total: '' });
            const r = {
                ...nr[idx], code: item.code, itemName: item.itemName,
                qty: '1', rate: item.salesRate || item.mrpRate || '0',
                amount: '0', total: '0',
            };
            const q = 1; const rate = parseFloat(r.rate) || 0;
            r.amount = (q * rate).toFixed(2); r.total = r.amount;
            nr[idx] = r;
            isLastRow = idx === nr.length - 1;
            // Always add a next blank row so we can continue adding items
            if (isLastRow) nr.push({ sno: nr.length + 1, code: '', itemName: '', qty: '', rate: '', amount: '', total: '' });
            return nr;
        });
        // ⚡ AUTO-REOPEN search popup for next item — full keyboard flow
        setTimeout(() => {
            setSearchRowIdx(idx + 1);
            setSearchText('');
            setSearchSelIdx(0);
            setShowSearch(true);
            searchRef.current?.focus();
        }, 80);
    };

    // When clicking a row in the cart, show that product's stock
    const selectRowForStock = (row) => {
        const prod = pharmaItems.find(p => p.code === row.code || p.itemName === row.itemName);
        if (prod) setSelectedProduct(prod);
    };

    const filteredSearchItems = pharmaItems.filter(it => {
        if (!searchText) return true;
        const s = searchText.toLowerCase();
        return (it.itemName || '').toLowerCase().includes(s) || String(it.code).includes(s);
    });

    const handleSave = async () => {
        const validRows = rows.filter(r => r.itemName && parseFloat(r.qty) > 0);
        if (validRows.length === 0) return alert('Add at least one item.');
        const balanceDue = mode === 'CREDIT' ? grandTotal : Math.max(0, grandTotal - receivedA);
        const changeReturned = mode !== 'CREDIT' && receivedA > grandTotal ? receivedA - grandTotal : 0;
        const now = new Date();
        const saleInput = {
            billNo: String(billNo), billDate: new Date().toISOString().split('T')[0],
            billTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
            saleType: mode, bookNo: book, billRef,
            customerName: customerName || 'Walk-in', customerPhone, customerAddress, salesMan,
            items: validRows.map(r => ({ code: r.code, name: r.itemName, qty: parseFloat(r.qty), rate: parseFloat(r.rate), amount: parseFloat(r.amount) })),
            subtotal: subTotal, taxAmount, discount: discAmt, transportCharges: transportAmt, grandTotal,
            cashAmount: mode === 'CASH' ? receivedA : 0, upiAmount: mode === 'UPI' ? receivedA : 0, cardAmount: mode === 'CARD' ? receivedA : 0,
            receivedAmount: receivedA, balanceDue, changeReturned,
            remarks,
        };
        try {
            // ⭐ SAVE TO DATABASE via GraphQL mutation
            const savedSale = await new CreateSaleCommand().execute(saleInput);

            // Also save to local pos_reports (for legacy report module)
            const legacyPayload = {
                invoiceId: 'BILL-' + billNo, billNo, date, mode, book, billRef,
                customer: { name: customerName || 'Walk-in', phone: customerPhone, address: customerAddress },
                salesMan, items: validRows.map(r => ({ id: r.code, name: r.itemName, barcode: r.code, price: parseFloat(r.rate), qty: parseFloat(r.qty), total: parseFloat(r.amount), quantityStr: '1 Pc' })),
                saleType: mode === 'CASH' ? 'OFFLINE' : mode === 'CREDIT' ? 'CREDIT' : 'ONLINE',
                subtotal: subTotal, taxAmount, discount: discAmt, transport: transportAmt,
                grandTotal, receivedAmount: receivedA, balance: balanceDue,
                gstAmount: taxAmount, cashAmount: saleInput.cashAmount, upiAmount: saleInput.upiAmount, cardAmount: saleInput.cardAmount,
                dbId: savedSale?.id,
            };
            saveToReport(legacyPayload);

            // For CREDIT sales → create customer ledger entry
            if (mode === 'CREDIT' && customerName) {
                try {
                    await new CreateLedgerCommand().execute({
                        type: 'CUSTOMER',
                        partyName: customerName,
                        invoiceNumber: String(billNo),
                        invoiceDate: new Date().toISOString(),
                        amount: Math.round(grandTotal),
                        creditDays: 30,
                        contactNumber: customerPhone || '',
                        address: customerAddress || '',
                    });
                } catch (err) { console.warn('Ledger entry failed:', err.message); }
            }

            setLastOrder(legacyPayload);
            setShowToast(true); setTimeout(() => setShowToast(false), 5000);
            handleCancel();
            setBillNo(String(parseInt(billNo) + 1));
            setLastBillNo(String((parseInt(lastBillNo) || 0) + 1));
        } catch (err) {
            console.error('Save failed:', err);
            alert('❌ Failed to save bill: ' + err.message);
        }
    };

    const handleCancel = () => {
        setRows([{ sno: 1, code: '', itemName: '', qty: '', rate: '', amount: '', total: '' }]);
        setReceivedAmt(''); setDiscount('0'); setTransportCharges('0');
        setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setBillRef(''); setRemarks('');
        setSelectedProduct(null);
        // Auto-reopen search for next bill
        setTimeout(() => {
            setSearchRowIdx(0); setSearchText(''); setSearchSelIdx(0); setShowSearch(true);
            searchRef.current?.focus();
        }, 100);
    };

    const handlePrint = () => {
        if (!lastOrder) return alert('No bill to print. Save a bill first (F1).');
        const w = window.open('', '_blank', 'width=420,height=700');
        if (!w) return alert('Allow popups to print invoice.');
        const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
        const totalQty = lastOrder.items.reduce((s, i) => s + (parseFloat(i.qty) || 0), 0);
        const itemsHTML = lastOrder.items.map((it, i) => `<tr>
<td style="padding:5px 4px;border-bottom:1px dotted #ccc;text-align:center;font-size:11px;color:#666">${i+1}</td>
<td style="padding:5px 4px;border-bottom:1px dotted #ccc;font-weight:700;font-size:12px">${it.name}</td>
<td style="padding:5px 4px;border-bottom:1px dotted #ccc;text-align:center;font-size:12px">${it.qty}</td>
<td style="padding:5px 4px;border-bottom:1px dotted #ccc;text-align:right;font-size:12px">${parseFloat(it.price).toFixed(2)}</td>
<td style="padding:5px 4px;border-bottom:1px dotted #ccc;text-align:right;font-weight:700;font-size:12px">${parseFloat(it.total).toFixed(2)}</td>
</tr>`).join('');

        const html = `<!DOCTYPE html><html><head><title>Invoice ${lastOrder.billNo}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI','Arial',sans-serif;padding:20px;color:#1e293b;max-width:400px;margin:0 auto;background:#fff}
@media print{body{padding:8px;max-width:100%}}
.center{text-align:center}
.right{text-align:right}
hr{border:none;border-top:2px dashed #94a3b8;margin:10px 0}
table{width:100%;border-collapse:collapse}
</style></head>
<body onload="window.print()">

<div class="center" style="border-bottom:2px dashed #94a3b8;padding-bottom:12px;margin-bottom:10px">
  <h1 style="font-size:24px;font-weight:900;letter-spacing:3px"># HASHTAG</h1>
  <p style="font-size:10px;color:#64748b;letter-spacing:3px;text-transform:uppercase;margin-top:2px">MEDICAL & PHARMACY</p>
  <p style="font-size:11px;color:#475569;margin-top:6px">123, Main Road, Your City - 600001</p>
  <p style="font-size:11px;color:#475569">Ph: +91 98765 43210 | GSTIN: 33XXXXX1234X1ZX</p>
  <p style="font-size:11px;color:#475569">DL No: TN-CHN-20/1234/2026</p>
</div>

<div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
  <div>
    <div style="color:#64748b;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1px">Invoice</div>
    <div style="font-weight:800;color:#0f172a;font-size:14px">${lastOrder.billNo}</div>
  </div>
  <div class="center">
    <div style="color:#64748b;font-size:9px;font-weight:700;text-transform:uppercase">Date</div>
    <div style="font-weight:700">${lastOrder.date}</div>
  </div>
  <div class="right">
    <div style="color:#64748b;font-size:9px;font-weight:700;text-transform:uppercase">Time</div>
    <div style="font-weight:700">${time}</div>
  </div>
</div>

<div style="font-size:11px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid #e2e8f0">
  <div style="display:flex;justify-content:space-between;margin-bottom:2px">
    <div><span style="color:#64748b">Customer:</span> <strong>${lastOrder.customer?.name || 'Walk-in'}</strong></div>
    <div><span style="color:#64748b">Mode:</span> <strong style="color:${lastOrder.saleType==='CREDIT'?'#ea580c':'#059669'}">${lastOrder.saleType}</strong></div>
  </div>
  ${lastOrder.customer?.phone ? `<div style="margin-top:2px"><span style="color:#64748b">Phone:</span> ${lastOrder.customer.phone}</div>` : ''}
  ${lastOrder.customer?.address ? `<div style="margin-top:2px"><span style="color:#64748b">Address:</span> ${lastOrder.customer.address}</div>` : ''}
  ${lastOrder.salesMan ? `<div style="margin-top:2px"><span style="color:#64748b">Sales Man:</span> ${lastOrder.salesMan}</div>` : ''}
</div>

<table style="margin-bottom:10px">
  <thead>
    <tr style="background:#f1f5f9">
      <th style="padding:7px 4px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#475569;border-bottom:2px solid #cbd5e1;width:25px">#</th>
      <th style="padding:7px 4px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#475569;border-bottom:2px solid #cbd5e1">Item Description</th>
      <th style="padding:7px 4px;text-align:center;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#475569;border-bottom:2px solid #cbd5e1;width:35px">Qty</th>
      <th style="padding:7px 4px;text-align:right;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#475569;border-bottom:2px solid #cbd5e1;width:55px">Rate</th>
      <th style="padding:7px 4px;text-align:right;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#475569;border-bottom:2px solid #cbd5e1;width:65px">Amount</th>
    </tr>
  </thead>
  <tbody>${itemsHTML}</tbody>
</table>

<div style="border-top:2px dashed #94a3b8;padding-top:10px;font-size:12px">
  <div style="display:flex;justify-content:space-between;margin-bottom:3px">
    <span style="color:#64748b">Sub Total (${lastOrder.items.length} items, ${totalQty} qty)</span>
    <strong>₹${lastOrder.subtotal.toFixed(2)}</strong>
  </div>
  ${lastOrder.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px">
    <span style="color:#64748b">Discount</span><strong style="color:#ef4444">-₹${lastOrder.discount.toFixed(2)}</strong>
  </div>` : ''}
  <div style="display:flex;justify-content:space-between;margin-bottom:3px">
    <span style="color:#64748b">GST / Tax</span><strong>₹${lastOrder.taxAmount.toFixed(2)}</strong>
  </div>
  ${lastOrder.transport > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:3px">
    <span style="color:#64748b">Transport</span><strong>₹${lastOrder.transport.toFixed(2)}</strong>
  </div>` : ''}
  <div style="display:flex;justify-content:space-between;margin-top:8px;padding-top:8px;border-top:2px solid #0f172a;font-size:18px;font-weight:900">
    <span>GRAND TOTAL</span><span>₹${lastOrder.grandTotal.toFixed(2)}</span>
  </div>
  ${lastOrder.receivedAmount > 0 ? `
  <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:12px">
    <span style="color:#059669;font-weight:700">Paid</span>
    <strong style="color:#059669">₹${lastOrder.receivedAmount.toFixed(2)}</strong>
  </div>
  <div style="display:flex;justify-content:space-between;font-size:12px">
    <span style="color:${lastOrder.balance > 0 ? '#ef4444' : '#64748b'};font-weight:700">${lastOrder.balance > 0 ? 'Balance Due' : 'Change'}</span>
    <strong style="color:${lastOrder.balance > 0 ? '#ef4444' : '#0f172a'}">₹${Math.abs(lastOrder.balance).toFixed(2)}</strong>
  </div>` : ''}
</div>

<div class="center" style="margin-top:20px;padding-top:12px;border-top:2px dashed #94a3b8;font-size:11px;color:#94a3b8">
  <p style="font-weight:700;color:#475569;margin-bottom:4px">🙏 Thank You! Visit Again 🙏</p>
  <p style="margin-top:4px">Items: ${lastOrder.items.length} | Total Qty: ${totalQty}</p>
  <p style="margin-top:6px;font-size:9px;letter-spacing:1px">Powered by HASHTAG Medical POS</p>
</div>

</body></html>`;

        w.document.open();
        w.document.write(html);
        w.document.close();
    };

    const handlePdf = () => handlePrint();

    // ── HOLD / PARKED BILLS ──
    const handleHold = () => {
        const validRows = rows.filter(r => r.itemName && parseFloat(r.qty) > 0);
        if (validRows.length === 0) { alert('Cart is empty. Nothing to hold.'); return; }
        const parked = {
            id: 'PARK-' + Date.now(),
            billNo, date, mode, book, billRef,
            customerName: customerName || 'Walk-in', customerPhone, customerAddress,
            rows: [...rows], discount, transportCharges, receivedAmt,
            total: grandTotal, itemCount: validRows.length,
            parkedAt: new Date().toISOString(),
        };
        setParkedBills(prev => [parked, ...prev]);
        handleCancel();
        setBillNo(String(Math.floor(Math.random() * 900 + 100)));
        alert(`Bill held successfully. Press F8 or click Parked to resume.`);
    };

    const handleResumeParked = (p) => {
        if (rows.some(r => r.itemName)) {
            if (!confirm('Current cart has items. Hold current bill and resume this one?')) return;
            handleHold();
        }
        setRows(p.rows);
        setCustomerName(p.customerName === 'Walk-in' ? '' : p.customerName);
        setCustomerPhone(p.customerPhone); setCustomerAddress(p.customerAddress);
        setBillNo(p.billNo); setDate(p.date); setMode(p.mode); setBook(p.book); setBillRef(p.billRef);
        setDiscount(p.discount); setTransportCharges(p.transportCharges); setReceivedAmt(p.receivedAmt);
        setParkedBills(prev => prev.filter(b => b.id !== p.id));
        setShowParkedModal(false);
    };

    const handleDeleteParked = (id) => {
        if (!confirm('Delete this parked bill permanently?')) return;
        setParkedBills(prev => prev.filter(b => b.id !== id));
    };

    // ── KEYBOARD: Arrows + Enter driven workflow ──
    useEffect(() => {
        const handler = (e) => {
            // F-key shortcuts (work even when inputs are focused)
            if (e.key === 'F1') { e.preventDefault(); handleSave(); return; }
            if (e.key === 'F2') { e.preventDefault(); handlePrint(); return; }
            // Quick search: + or Insert opens search popup (pharmacy cashier style)
            if ((e.key === '+' || e.key === 'Insert') && !showSearch && !showParkedModal) {
                e.preventDefault();
                const lastIdx = rows.findIndex(r => !r.itemName);
                setSearchRowIdx(lastIdx >= 0 ? lastIdx : rows.length);
                setSearchText(''); setSearchSelIdx(0); setShowSearch(true);
                setTimeout(() => searchRef.current?.focus(), 30);
                return;
            }
            if (e.key === 'F3') { e.preventDefault(); document.getElementById('disc-input')?.focus(); return; }
            if (e.key === 'F4') { e.preventDefault(); document.getElementById('disc-input')?.focus(); return; }
            if (e.key === 'F6') { e.preventDefault(); setCustomerEnabled(true); setTimeout(()=>document.getElementById('cust-input')?.focus(),30); return; }
            if (e.key === 'F7') { e.preventDefault(); handleHold(); return; }
            if (e.key === 'F8') { e.preventDefault(); setShowParkedModal(true); setParkedSelIdx(0); return; }
            if (e.key === 'F9') { e.preventDefault(); document.getElementById('recv-input')?.focus(); return; }
            if (e.key === 'F11') { e.preventDefault(); document.getElementById('phone-input')?.focus(); return; }

            // ── Parked Bills modal navigation: Arrows + Enter ──
            if (showParkedModal) {
                if (e.key === 'Escape') { e.preventDefault(); setShowParkedModal(false); return; }
                if (e.key === 'ArrowDown') { e.preventDefault(); setParkedSelIdx(p => Math.min(p+1, parkedBills.length-1)); return; }
                if (e.key === 'ArrowUp') { e.preventDefault(); setParkedSelIdx(p => Math.max(p-1, 0)); return; }
                if (e.key === 'Enter') { e.preventDefault(); if (parkedBills[parkedSelIdx]) handleResumeParked(parkedBills[parkedSelIdx]); return; }
                if (e.key === 'Delete') { e.preventDefault(); if (parkedBills[parkedSelIdx]) handleDeleteParked(parkedBills[parkedSelIdx].id); return; }
                return;
            }

            // ── Product Search popup navigation: Arrows + Enter ──
            if (showSearch) {
                if (e.key === 'Escape') { e.preventDefault(); setShowSearch(false); return; }
                if (e.key === 'ArrowDown') { e.preventDefault(); setSearchSelIdx(p => Math.min(p+1, filteredSearchItems.length-1)); return; }
                if (e.key === 'ArrowUp') { e.preventDefault(); setSearchSelIdx(p => Math.max(p-1, 0)); return; }
                if (e.key === 'Enter') { e.preventDefault(); pickItem(filteredSearchItems[searchSelIdx]); return; }
                return;
            }

            // ── Cart row navigation: Arrows for row, Enter to advance to next ──
            const tag = (e.target.tagName || '').toUpperCase();
            const inInput = tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';
            // Arrow keys only navigate cart when NOT inside an input (except when at end of input or using Ctrl)
            if (!inInput || e.ctrlKey) {
                if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedRow(p => Math.min(p+1, rows.length-1)); return; }
                if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedRow(p => Math.max(p-1, 0)); return; }
                if (e.key === 'Delete' && focusedRow >= 0) { e.preventDefault(); removeRow(focusedRow); return; }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [showSearch, searchSelIdx, filteredSearchItems, rows, showParkedModal, parkedSelIdx, parkedBills, focusedRow]);

    const removeRow = (idx) => {
        setRows(prev => {
            const newRows = prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sno: i + 1 }));
            return newRows.length > 0 ? newRows : [{ sno: 1, code: '', itemName: '', qty: '', rate: '', amount: '', total: '' }];
        });
    };

    const inp = "bg-white border border-[#888] h-[22px] px-1 text-[11px] font-bold text-slate-900 outline-none focus:bg-yellow-50 focus:border-[#1a5276]";
    const lbl = "text-[11px] font-bold text-slate-900";

    return (<div className="flex flex-col h-[85vh] overflow-hidden font-sans text-[11px] select-none" style={{background:'#e8e8e8'}}>

        {/* Title bar */}
        <div className="h-[22px] bg-[#4dbcc4] flex items-center justify-center shrink-0 border-b border-[#3aa8b0]">
            <h1 className="text-white font-black tracking-[4px] text-[14px]">SALES</h1>
        </div>

        {/* Header form */}
        <div className="shrink-0 border-b border-[#888]" style={{background:'#e8e8e8'}}>
            <div className="flex items-center px-1 py-0.5 gap-1 border-b border-[#c0c0c0]">
                <label className="text-red-700 font-bold text-[11px] w-14">Bill No</label>
                <input type="text" value={billNo} onChange={e=>setBillNo(e.target.value)} className={`${inp} w-20`}/>
                <label className={`${lbl} ml-2`}>Date</label>
                <input type="text" value={date} onChange={e=>setDate(e.target.value)} className={`${inp} w-24`}/>
                <label className={`${lbl} ml-2`}>Mode</label>
                <select value={mode} onChange={e=>setMode(e.target.value)} className={`${inp} w-20`}><option>CASH</option><option>CREDIT</option><option>CARD</option><option>UPI</option></select>
                <label className={`${lbl} ml-2`}>Book</label>
                <input type="text" value={book} onChange={e=>setBook(e.target.value)} className={`${inp} w-14`}/>
                <label className={`${lbl} ml-2`}>Bill Ref</label>
                <input type="text" value={billRef} onChange={e=>setBillRef(e.target.value)} className={`${inp} w-10`}/>
                <div className="bg-[#4dbcc4] h-[22px] w-12 border border-[#888]"/>
                <label className="flex items-center gap-1 ml-1 cursor-pointer"><input type="checkbox" checked={customerEnabled} onChange={e=>setCustomerEnabled(e.target.checked)}/><span className={lbl}>Customer</span></label>
                <input id="cust-input" type="text" value={customerName} onChange={e=>setCustomerName(e.target.value)} className={`${inp} flex-1`}/>
                <input id="phone-input" type="text" value={customerPhone} onChange={e=>setCustomerPhone(e.target.value)} placeholder="CellNo" className={`${inp} w-40`}/>
                <div className="bg-[#4dbcc4] h-[22px] w-24 border border-[#888] flex items-center justify-end px-1 text-red-700 font-bold text-[11px]">0.00</div>
            </div>
            <div className="flex items-center px-1 py-0.5 gap-1 border-b border-[#c0c0c0]">
                <label className={`${lbl} w-14`}>Rate Type</label>
                <select value={rateType} onChange={e=>setRateType(e.target.value)} className={`${inp} w-20`}><option>ARate</option><option>BRate</option><option>CRate</option><option>DRate</option></select>
                <label className={`${lbl} ml-2`}>Stock</label>
                <input type="text" value={selectedProduct ? (selectedProduct.maxStock || selectedProduct.maxStkQty || 0) : '0'} readOnly className={`${inp} w-14 font-black text-center ${selectedProduct && (selectedProduct.maxStock || selectedProduct.maxStkQty) > (parseFloat(selectedProduct.minStock) || parseFloat(selectedProduct.minStkQty) || 10) ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`} title="Current Stock"/>
                <input type="text" value={selectedProduct ? parseFloat(selectedProduct.mrpRate || 0).toFixed(2) : '0.00'} readOnly className={`${inp} w-20 text-blue-700 font-black text-right bg-[#f5f5f5]`} title="MRP Rate"/>
                <input type="text" value={selectedProduct ? parseFloat(selectedProduct.salesRate || 0).toFixed(2) : '0.00'} readOnly className={`${inp} w-20 text-emerald-700 font-black text-right bg-[#f5f5f5]`} title="Sales Rate"/>
                <input type="text" value={selectedProduct ? parseFloat(selectedProduct.purchaseRate || selectedProduct.costRate || 0).toFixed(2) : '0.00'} readOnly className={`${inp} w-20 font-black text-right bg-[#f5f5f5]`} title="Purchase Rate"/>
                <label className="flex items-center gap-1 ml-1 cursor-pointer"><input type="checkbox" checked={igst} onChange={e=>setIgst(e.target.checked)}/><span className={`${lbl} text-red-700 font-black`}>IGST</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={nonAcc} onChange={e=>setNonAcc(e.target.checked)}/><span className={lbl}>Non Acc</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={header} onChange={e=>setHeader(e.target.checked)}/><span className={lbl}>Header</span></label>
                <label className={`${lbl} ml-2`}>Address</label>
                <input type="text" value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)} className={`${inp} flex-1`}/>
                <div className="bg-[#4dbcc4] h-[22px] px-2 border border-[#888] flex items-center text-[10px] font-black text-slate-900 uppercase tracking-wider">{selectedProduct ? 'Selected' : '—'}</div>
                <label className={`${lbl} ml-1`}>Sales Man</label>
                <input type="text" value={salesMan} onChange={e=>setSalesMan(e.target.value)} className={`${inp} w-40 bg-[#ffffd0]`}/>
            </div>
            <div className="flex items-center px-1 py-0.5 gap-1">
                <label className={`${lbl} w-14`}>Last BillNo</label>
                <input type="text" value={lastBillNo} readOnly className={`${inp} w-10 text-center bg-[#f5f5f5]`}/>
                <input type="text" value={selectedProduct ? (selectedProduct.itemName || '') : ''} readOnly className={`${inp} w-48 text-slate-900 font-black bg-yellow-50`} title="Selected Product Name" placeholder="Click a product to see stock"/>
                <label className={`${lbl} ml-2`}>Size Stock</label>
                <input type="text" value={selectedProduct ? (selectedProduct.size || selectedProduct.packingUnit || '-') : ''} readOnly className={`${inp} flex-1 max-w-[140px] text-slate-900 font-bold bg-[#f5f5f5]`}/>
                <input type="text" value={selectedProduct ? `Min:${selectedProduct.minStock || selectedProduct.minStkQty || 0}` : '0'} readOnly className={`${inp} w-20 text-center bg-[#f5f5f5] text-slate-900 font-bold text-[10px]`} title="Minimum Stock"/>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="tax" checked={taxType==='WTax'} onChange={()=>setTaxType('WTax')}/><span className={lbl}>W.Tax</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="tax" checked={taxType==='WOTax'} onChange={()=>setTaxType('WOTax')}/><span className={lbl}>WO.Tax</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="tax" checked={taxType==='Exc'} onChange={()=>setTaxType('Exc')}/><span className={lbl}>Exc</span></label>
                <div className="ml-auto flex items-center gap-1">
                    <span className="text-red-700 font-black text-[14px] mr-2">{mode}</span>
                    <label className={lbl}>Customer Ref</label>
                    <input type="text" value={customerRef} onChange={e=>setCustomerRef(e.target.value)} className={`${inp} w-24`}/>
                    <label className={`${lbl} ml-2`}>Quotation</label>
                    <input type="text" value={quotation} onChange={e=>setQuotation(e.target.value)} className={`${inp} w-24 bg-[#ffffd0]`}/>
                    <label className={`${lbl} ml-2`}>BundleNo</label>
                    <input type="text" value={bundleNo} onChange={e=>setBundleNo(e.target.value)} className={`${inp} w-24`}/>
                </div>
            </div>
        </div>

        {/* Items table */}
        <div className="flex-1 overflow-auto bg-white relative">
            <table className="w-full text-[11px] border-collapse">
                <thead className="bg-[#3aa8b0] text-white sticky top-0 z-10">
                    <tr>
                        <th className="border-r border-[#888] w-6 py-0.5"></th>
                        <th className="border-r border-[#888] w-12 py-0.5 font-bold">SNo</th>
                        <th className="border-r border-[#888] w-24 py-0.5 font-bold">Code</th>
                        <th className="border-r border-[#888] py-0.5 font-bold">ItemName</th>
                        <th className="border-r border-[#888] w-24 py-0.5 font-bold text-right pr-2">QTY</th>
                        <th className="border-r border-[#888] w-24 py-0.5 font-bold text-right pr-2">Rate</th>
                        <th className="border-r border-[#888] w-24 py-0.5 font-bold text-right pr-2">Amount</th>
                        <th className="border-r border-[#888] w-24 py-0.5 font-bold text-right pr-2">Total</th>
                        <th className="w-10 py-0.5 font-bold text-center">🗑</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (<tr key={i} onClick={() => r.itemName && selectRowForStock(r)} className="border-b border-[#ddd] cursor-pointer hover:bg-blue-50" style={{background: selectedProduct && selectedProduct.code === r.code ? '#fef9c3' : (i === rows.length - 1 ? '#f0fdf4' : 'white')}}>
                        <td className="w-6 text-center text-blue-700 font-bold text-[10px] border-r border-[#ddd]">{i === rows.length - 1 ? '▶*' : ''}</td>
                        <td className="text-center border-r border-[#ddd] font-bold">{r.sno}</td>
                        <td className="p-0 border-r border-[#ddd]">
                            <input type="text" value={r.code || ''} onFocus={()=>openSearch(i)} onChange={e=>updateRow(i,'code',e.target.value)} className="w-full h-[22px] px-1 text-[11px] font-bold outline-none bg-[#9ae66e] focus:bg-[#bef5a0] text-center cursor-pointer"/>
                        </td>
                        <td className="p-0 border-r border-[#ddd]">
                            <input type="text" value={r.itemName || ''} onChange={e=>updateRow(i,'itemName',e.target.value)} onFocus={()=>openSearch(i)} className="w-full h-[22px] px-2 text-[11px] font-bold outline-none focus:bg-yellow-50"/>
                        </td>
                        <td className="p-0 border-r border-[#ddd]">
                            <input type="number" value={r.qty || ''} onChange={e=>updateRow(i,'qty',e.target.value)} className="w-full h-[22px] pr-2 text-[11px] font-bold outline-none focus:bg-yellow-50 text-right" placeholder="0.000"/>
                        </td>
                        <td className="p-0 border-r border-[#ddd]">
                            <input type="number" value={r.rate || ''} onChange={e=>updateRow(i,'rate',e.target.value)} className="w-full h-[22px] pr-2 text-[11px] font-bold outline-none focus:bg-yellow-50 text-right" placeholder="0.00"/>
                        </td>
                        <td className="border-r border-[#ddd] pr-2 text-right font-bold">{r.amount || '0.00'}</td>
                        <td className="border-r border-[#ddd] pr-2 text-right font-bold">{r.total || '0.00'}</td>
                        <td className="text-center">
                            {r.itemName ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); if (confirm(`Remove ${r.itemName} from cart?`)) removeRow(i); }}
                                    className="w-7 h-[22px] flex items-center justify-center bg-red-500 hover:bg-red-600 text-white font-black text-[13px] rounded transition active:scale-95"
                                    title="Delete this item (or press Del when row focused)"
                                >✕</button>
                            ) : null}
                        </td>
                    </tr>))}
                </tbody>
            </table>

            {showSearch && (
                <div className="absolute left-1/4 top-2 bg-white border-2 border-[#7ba0b5] shadow-2xl z-30 w-[650px]">
                    <div className="bg-[#d4e6f1] border-b-2 border-[#7ba0b5] px-2 py-1 flex items-center gap-2">
                        <label className="text-[12px] font-bold">Search</label>
                        <input ref={searchRef} type="text" value={searchText} onChange={e=>{setSearchText(e.target.value);setSearchSelIdx(0);}} placeholder="Type name or code... (↑↓ navigate, Enter select, Esc close)" className="flex-1 bg-white border border-[#7ba0b5] h-6 px-2 text-[12px] font-bold outline-none focus:border-[#1a5276]"/>
                    </div>
                    <table className="w-full text-[12px] border-collapse">
                        <thead className="bg-[#eef5fb]"><tr>
                            <th className="py-1 px-2 text-left border-r border-[#ccc] font-bold w-20">Code</th>
                            <th className="py-1 px-2 text-left border-r border-[#ccc] font-bold">ItemName</th>
                            <th className="py-1 px-2 text-right border-r border-[#ccc] font-bold w-24">Rate</th>
                            <th className="py-1 px-2 text-right font-bold w-20">MRP</th>
                        </tr></thead>
                        <tbody className="max-h-96">
                            {filteredSearchItems.length === 0 ? (
                                <tr><td colSpan={4} className="py-6 text-center text-slate-700 font-bold">No items. Add in Item Master.</td></tr>
                            ) : filteredSearchItems.slice(0, 15).map((it, i) => (
                                <tr key={it.id || i} onClick={()=>pickItem(it)} className={`cursor-pointer border-b border-[#e0e0e0] ${searchSelIdx === i ? 'bg-[#2980b9] text-white' : 'bg-white hover:bg-blue-50'}`}>
                                    <td className={`py-0.5 px-2 border-r border-[#e0e0e0] font-bold ${searchSelIdx===i?'text-white':''}`}>{it.code}</td>
                                    <td className={`py-0.5 px-2 border-r border-[#e0e0e0] font-bold uppercase ${searchSelIdx===i?'text-white':''}`}>{it.itemName}</td>
                                    <td className={`py-0.5 px-2 border-r border-[#e0e0e0] text-right ${searchSelIdx===i?'text-white':''}`}>{parseFloat(it.salesRate||0).toFixed(2)}</td>
                                    <td className={`py-0.5 px-2 text-right ${searchSelIdx===i?'text-white':''}`}>{parseFloat(it.mrpRate||0).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>

        {/* Bottom: Hotkeys + Total + Summary */}
        <div className="shrink-0 flex border-t border-[#888]" style={{background:'#e8e8e8'}}>
            <div className="w-[400px] border-r border-[#888] p-1">
                <div className="flex items-center gap-1 text-[11px] font-bold mb-0.5">
                    <label>Points :</label><span className="bg-white border border-[#888] px-2 w-8 text-right">0</span>
                    <span>+</span><span className="bg-white border border-[#888] px-2 w-8 text-right">0</span>
                    <span>=</span><span className="bg-white border border-[#888] px-2 w-8 text-right">0</span>
                    <span className="ml-auto bg-white border border-[#888] px-2 w-14 text-right">0.00</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold mb-1">
                    <label className="w-20">Debit Point</label><input type="text" value={debitPoint} onChange={e=>setDebitPoint(e.target.value)} className={`${inp} w-16`}/>
                    <label className="ml-2">Remarks</label><input type="text" value={remarks} onChange={e=>setRemarks(e.target.value)} className={`${inp} flex-1`}/>
                </div>
                <div className="text-[10px] font-bold text-slate-900 space-y-0.5 border-t border-[#c0c0c0] pt-1">
                    <div className="grid grid-cols-3 gap-1">
                        <span>F1 - Save</span>
                        <span>F3 - Discount% Focus</span>
                        <span>F4 - Discount Focus</span>
                        <span>F6 - Customer Focus</span>
                        <span>F7 - Memory Save</span>
                        <span>F11 - CellNo Focus</span>
                        <span>F9 - Received Amount Focus</span>
                        <span className="text-amber-700 font-black">F7 - Hold Bill</span>
                        <span className="text-blue-700 font-black">F8 - Parked Bills</span>
                        <span>↑↓ Navigate Row</span>
                        <span>Enter - Select / Resume</span>
                    </div>
                </div>
                <div className="flex mt-1 border-t border-[#c0c0c0] pt-1">
                    <button onClick={handleSave} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Save (F1)</button>
                    <button onClick={handleHold} className="flex-1 bg-amber-400 hover:bg-amber-500 border border-[#888] text-black font-black py-0.5 text-[12px]">⏸ Hold (F7)</button>
                    <button onClick={()=>setShowParkedModal(true)} className="flex-1 bg-blue-400 hover:bg-blue-500 border border-[#888] text-black font-black py-0.5 text-[12px] relative">
                        🅿 Parked (F8)
                        {parkedBills.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">{parkedBills.length}</span>}
                    </button>
                    <button onClick={handleCancel} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Cancel</button>
                </div>
                <div className="flex mt-0.5">
                    <button className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">First</button>
                    <button className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Prev</button>
                    <button className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Next</button>
                    <button className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Last</button>
                    <button onClick={handlePrint} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Print (F2)</button>
                    <button onClick={handlePdf} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Pdf</button>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-2" style={{background:'#4dbcc4'}}>
                <span className="text-red-700 font-black text-[16px] tracking-wide">Total</span>
                <span className="text-[#1a1a7e] font-black text-[42px] leading-none">{grandTotal.toFixed(2)}</span>
                <span className="text-red-700 font-black text-[16px] tracking-wide mt-1">Balance</span>
                <span className="text-[#1a1a7e] font-black text-[28px] leading-none">{balance > 0 ? balance.toFixed(0) : '0'}</span>
            </div>

            <div className="w-[340px] border-l border-[#888] text-[12px]">
                <table className="w-full border-collapse">
                    <tbody>
                        <tr className="border-b border-[#ccc]">
                            <td className="font-bold px-2 py-0.5 bg-white w-36">Total Items</td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc] w-20 font-black">{rows.filter(r=>r.itemName).length}</td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc] font-black">{totalItems.toFixed(0)}</td>
                        </tr>
                        <tr className="border-b border-[#ccc]">
                            <td className="font-bold px-2 py-0.5 bg-white">Sub Total</td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc]"></td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc] font-bold">{subTotal.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-[#ccc]">
                            <td className="font-bold px-2 py-0.5 bg-white">Tax Amount</td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc]"></td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc] font-bold">{taxAmount.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-[#ccc]">
                            <td className="font-bold px-2 py-0.5 bg-white">Sal.Return Amt</td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc]"></td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc] font-bold">0.00</td>
                        </tr>
                        <tr className="border-b border-[#ccc]">
                            <td className="font-bold px-2 py-0.5 bg-white">Discount</td>
                            <td className="p-0 border-l border-[#ccc]"><input id="disc-input" type="number" value={discount} onChange={e=>setDiscount(e.target.value)} className="w-full h-[22px] px-2 text-right font-bold outline-none focus:bg-yellow-50"/></td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc] font-bold">{discAmt.toFixed(2)}</td>
                        </tr>
                        <tr className="border-b border-[#ccc]">
                            <td className="font-bold px-2 py-0.5 bg-white">Transport Charges</td>
                            <td className="p-0 border-l border-[#ccc]"><input type="number" value={transportCharges} onChange={e=>setTransportCharges(e.target.value)} className="w-full h-[22px] px-2 text-right font-bold outline-none focus:bg-yellow-50"/></td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc] font-bold">{transportAmt.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td className="font-bold px-2 py-0.5 bg-white">Received Amt</td>
                            <td className="p-0 border-l border-[#ccc]"><input id="recv-input" type="number" value={receivedAmt} onChange={e=>setReceivedAmt(e.target.value)} className="w-full h-[22px] px-2 text-right font-bold outline-none focus:bg-yellow-50"/></td>
                            <td className="bg-white text-right px-2 py-0.5 border-l border-[#ccc] font-bold">{receivedA.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        {showToast && (<div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-3 rounded-lg shadow-2xl font-bold text-sm z-50 flex items-center gap-4 border-2 border-emerald-400">
            <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-300 animate-pulse"/>
                <span>✅ Bill <span className="text-yellow-300 font-black">#{lastOrder?.billNo}</span> saved to <span className="text-yellow-300 font-black">Database</span></span>
            </div>
            <span className="text-[10px] opacity-90">Grand Total: ₹{lastOrder?.grandTotal.toFixed(2)} | {lastOrder?.saleType}</span>
            <button onClick={handlePrint} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded text-[11px] font-black uppercase">🖨 Print (F2)</button>
            <button onClick={()=>setShowToast(false)} className="text-white hover:text-yellow-300">✕</button>
        </div>)}

        {/* ═══ PARKED BILLS MODAL ═══ */}
        {showParkedModal && (<div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white max-w-3xl w-full max-h-[80vh] rounded shadow-2xl overflow-hidden flex flex-col border-2 border-[#1a5276]">
                <div className="bg-gradient-to-r from-[#1a5276] to-[#2980b9] px-4 py-2 flex items-center justify-between">
                    <div>
                        <h2 className="text-white font-black text-[14px] uppercase tracking-wider">🅿 Parked Bills ({parkedBills.length})</h2>
                        <p className="text-cyan-200 text-[10px] font-bold mt-0.5">Use ↑↓ arrows | Enter = Resume | Delete key = Remove | Esc = Close</p>
                    </div>
                    <button onClick={()=>setShowParkedModal(false)} className="text-white hover:bg-red-500 px-2 py-1 font-black">✕</button>
                </div>
                <div className="flex-1 overflow-auto bg-[#eaf3f8]">
                    {parkedBills.length === 0 ? (
                        <div className="text-center py-16">
                            <div className="text-6xl mb-3">🅿</div>
                            <p className="text-slate-900 font-bold text-[14px]">No parked bills</p>
                            <p className="text-slate-700 text-[11px] font-bold mt-1">Press F7 or click Hold to park current bill</p>
                        </div>
                    ) : (
                        <table className="w-full text-[12px] border-collapse">
                            <thead className="bg-[#d4e6f1] sticky top-0">
                                <tr>
                                    <th className="py-1.5 px-2 text-left border-b border-[#7a9ca8] font-black text-slate-900 w-12">#</th>
                                    <th className="py-1.5 px-2 text-left border-b border-[#7a9ca8] font-black text-slate-900 w-24">Bill No</th>
                                    <th className="py-1.5 px-2 text-left border-b border-[#7a9ca8] font-black text-slate-900">Customer</th>
                                    <th className="py-1.5 px-2 text-left border-b border-[#7a9ca8] font-black text-slate-900 w-28">Phone</th>
                                    <th className="py-1.5 px-2 text-center border-b border-[#7a9ca8] font-black text-slate-900 w-16">Items</th>
                                    <th className="py-1.5 px-2 text-right border-b border-[#7a9ca8] font-black text-slate-900 w-24">Total</th>
                                    <th className="py-1.5 px-2 text-left border-b border-[#7a9ca8] font-black text-slate-900 w-32">Time</th>
                                    <th className="py-1.5 px-2 text-center border-b border-[#7a9ca8] font-black text-slate-900 w-36">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parkedBills.map((p, i) => (<tr key={p.id} onClick={()=>setParkedSelIdx(i)} className={`cursor-pointer border-b border-[#c0d0d8] h-[30px] ${parkedSelIdx === i ? 'bg-yellow-200' : 'bg-white hover:bg-blue-50'}`}>
                                    <td className="py-1 px-2 font-black text-slate-900">{i + 1}</td>
                                    <td className="py-1 px-2 font-black text-blue-700">{p.billNo}</td>
                                    <td className="py-1 px-2 font-bold text-slate-900">{p.customerName}</td>
                                    <td className="py-1 px-2 font-bold text-slate-900">{p.customerPhone || '-'}</td>
                                    <td className="py-1 px-2 text-center font-black text-slate-900">{p.itemCount}</td>
                                    <td className="py-1 px-2 text-right font-black text-[#1a5276]">₹{p.total.toFixed(2)}</td>
                                    <td className="py-1 px-2 text-slate-900 font-bold">{new Date(p.parkedAt).toLocaleTimeString('en-IN', {hour:'2-digit', minute:'2-digit', hour12:true})}</td>
                                    <td className="py-1 px-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <button onClick={(e)=>{e.stopPropagation(); handleResumeParked(p);}} className="px-3 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase">Resume</button>
                                            <button onClick={(e)=>{e.stopPropagation(); handleDeleteParked(p.id);}} className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white font-black text-[10px]">✕</button>
                                        </div>
                                    </td>
                                </tr>))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="bg-[#d4e6f1] px-4 py-2 border-t border-[#7a9ca8] text-[11px] font-bold text-slate-900 flex items-center justify-between">
                    <span>↑↓ Navigate | Enter = Resume | Del = Delete | Esc = Close</span>
                    {parkedBills.length > 0 && parkedSelIdx < parkedBills.length && (
                        <span className="text-blue-700 font-black">Selected: {parkedBills[parkedSelIdx]?.billNo} — {parkedBills[parkedSelIdx]?.customerName}</span>
                    )}
                </div>
            </div>
        </div>)}
    </div>);
}
