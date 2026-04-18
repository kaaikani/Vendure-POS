"use client";
import React, { useState, useEffect, useRef } from 'react';
import { GetPosProductsQuery, GetPosCustomersQuery, CreateSaleTransactionCommand, LookupBarcodeQuery } from '../../core/queries/PosQueries';
import { CreateLedgerCommand } from '../../core/queries/ledger.query';
import { ListItemsQuery } from '../../core/queries/pharma.query';

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
    const searchRef = useRef(null);

    const [lastOrder, setLastOrder] = useState(null);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        setBillNo(String(Math.floor(Math.random() * 900 + 100)));
        setDate(new Date().toLocaleDateString('en-GB'));
        const reports = JSON.parse(localStorage.getItem('pos_reports') || '[]');
        setLastBillNo(String(reports.length || 3));
        // Load items via API (cached — only one hit)
        new ListItemsQuery().execute().then(setPharmaItems).catch(e => console.error(e));
    }, []);

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
        let idx = searchRowIdx;
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
            return nr;
        });
        setShowSearch(false);
        setTimeout(() => { if (idx === rows.length - 1) addRow(); }, 50);
    };

    const filteredSearchItems = pharmaItems.filter(it => {
        if (!searchText) return true;
        const s = searchText.toLowerCase();
        return (it.itemName || '').toLowerCase().includes(s) || String(it.code).includes(s);
    });

    const handleSave = async () => {
        const validRows = rows.filter(r => r.itemName && parseFloat(r.qty) > 0);
        if (validRows.length === 0) return alert('Add at least one item.');
        const payload = {
            invoiceId: 'BILL-' + billNo, billNo, date, mode, book, billRef,
            customer: { name: customerName || 'CASH', phone: customerPhone, address: customerAddress },
            salesMan, items: validRows.map(r => ({ id: r.code, name: r.itemName, barcode: r.code, price: parseFloat(r.rate), qty: parseFloat(r.qty), total: parseFloat(r.amount), quantityStr: '1 Pc' })),
            saleType: mode === 'CASH' ? 'OFFLINE' : mode === 'CREDIT' ? 'CREDIT' : 'ONLINE',
            subtotal: subTotal, taxAmount, discount: discAmt, transport: transportAmt,
            grandTotal, receivedAmount: receivedA, balance: Math.max(0, receivedA - grandTotal),
            gstAmount: taxAmount, cashAmount: mode === 'CASH' ? receivedA : 0, upiAmount: 0, cardAmount: 0,
        };
        try {
            await new CreateSaleTransactionCommand().execute(payload);
            saveToReport(payload);
            if (mode === 'CREDIT' && customerName) {
                try { await new CreateLedgerCommand().execute({ type: 'CUSTOMER', partyName: customerName, invoiceNumber: billNo, invoiceDate: new Date().toISOString(), amount: Math.round(grandTotal), creditDays: 30 }); } catch {}
            }
            setLastOrder(payload);
            setShowToast(true); setTimeout(() => setShowToast(false), 4000);
            handleCancel();
            setBillNo(String(parseInt(billNo) + 1));
            setLastBillNo(String((parseInt(lastBillNo) || 0) + 1));
        } catch (err) { alert(err.message); }
    };

    const handleCancel = () => {
        setRows([{ sno: 1, code: '', itemName: '', qty: '', rate: '', amount: '', total: '' }]);
        setReceivedAmt(''); setDiscount('0'); setTransportCharges('0');
        setCustomerName(''); setCustomerPhone(''); setCustomerAddress(''); setBillRef(''); setRemarks('');
    };

    const handlePrint = () => {
        if (!lastOrder) return alert('No bill to print.');
        const w = window.open('', '', 'width=400,height=600');
        if (w) {
            const items = lastOrder.items.map((it, i) => `<tr><td>${i+1}</td><td>${it.name}</td><td align=center>${it.qty}</td><td align=right>${it.price.toFixed(2)}</td><td align=right>${it.total.toFixed(2)}</td></tr>`).join('');
            w.document.write(`<html><body style="font-family:Arial;padding:15px;max-width:350px"><h2 style="text-align:center;letter-spacing:2px"># HASHTAG</h2><p style="text-align:center;font-size:10px">SALES</p><hr><p><b>Bill:</b> ${lastOrder.billNo} | ${lastOrder.date}</p><p><b>Mode:</b> ${lastOrder.saleType}</p><hr><table style="width:100%;font-size:11px;border-collapse:collapse"><thead><tr style="border-bottom:1px solid #000"><th>#</th><th>Item</th><th>Qty</th><th>Rate</th><th>Amt</th></tr></thead><tbody>${items}</tbody></table><hr><div style="text-align:right"><p>Sub Total: ₹${lastOrder.subtotal.toFixed(2)}</p><p>Tax: ₹${lastOrder.taxAmount.toFixed(2)}</p><p>Discount: ₹${lastOrder.discount.toFixed(2)}</p><p><b>Total: ₹${lastOrder.grandTotal.toFixed(2)}</b></p><p>Received: ₹${lastOrder.receivedAmount.toFixed(2)}</p></div><hr><p style="text-align:center;font-size:10px">Thank You!</p></body></html>`);
            w.document.close(); w.print();
        }
    };

    const handlePdf = () => handlePrint();

    useEffect(() => {
        const handler = (e) => {
            if (e.key === 'F1') { e.preventDefault(); handleSave(); return; }
            if (e.key === 'F3') { e.preventDefault(); document.getElementById('disc-input')?.focus(); return; }
            if (e.key === 'F4') { e.preventDefault(); document.getElementById('disc-input')?.focus(); return; }
            if (e.key === 'F6') { e.preventDefault(); setCustomerEnabled(true); setTimeout(()=>document.getElementById('cust-input')?.focus(),30); return; }
            if (e.key === 'F9') { e.preventDefault(); document.getElementById('recv-input')?.focus(); return; }
            if (e.key === 'F11') { e.preventDefault(); document.getElementById('phone-input')?.focus(); return; }
            if (showSearch) {
                if (e.key === 'Escape') { e.preventDefault(); setShowSearch(false); return; }
                if (e.key === 'ArrowDown') { e.preventDefault(); setSearchSelIdx(p => Math.min(p+1, filteredSearchItems.length-1)); return; }
                if (e.key === 'ArrowUp') { e.preventDefault(); setSearchSelIdx(p => Math.max(p-1, 0)); return; }
                if (e.key === 'Enter') { e.preventDefault(); pickItem(filteredSearchItems[searchSelIdx]); return; }
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [showSearch, searchSelIdx, filteredSearchItems, rows]);

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
                <input type="text" value="0" readOnly className={`${inp} w-10 text-red-700 text-center`}/>
                <input type="text" value="0.00" readOnly className={`${inp} w-20 text-red-700 text-right bg-[#f5f5f5]`}/>
                <input type="text" value="0.00" readOnly className={`${inp} w-20 text-right bg-[#f5f5f5]`}/>
                <input type="text" value="0.00" readOnly className={`${inp} w-20 text-right bg-[#f5f5f5]`}/>
                <label className="flex items-center gap-1 ml-1 cursor-pointer"><input type="checkbox" checked={igst} onChange={e=>setIgst(e.target.checked)}/><span className={`${lbl} text-red-700 font-black`}>IGST</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={nonAcc} onChange={e=>setNonAcc(e.target.checked)}/><span className={lbl}>Non Acc</span></label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={header} onChange={e=>setHeader(e.target.checked)}/><span className={lbl}>Header</span></label>
                <label className={`${lbl} ml-2`}>Address</label>
                <input type="text" value={customerAddress} onChange={e=>setCustomerAddress(e.target.value)} className={`${inp} flex-1`}/>
                <div className="bg-[#4dbcc4] h-[22px] w-32 border border-[#888]"/>
                <label className={`${lbl} ml-1`}>Sales Man</label>
                <input type="text" value={salesMan} onChange={e=>setSalesMan(e.target.value)} className={`${inp} w-40 bg-[#ffffd0]`}/>
            </div>
            <div className="flex items-center px-1 py-0.5 gap-1">
                <label className={`${lbl} w-14`}>Last BillNo</label>
                <input type="text" value={lastBillNo} readOnly className={`${inp} w-10 text-center bg-[#f5f5f5]`}/>
                <input type="text" value="" readOnly className={`${inp} w-32 bg-[#f5f5f5]`}/>
                <label className={`${lbl} ml-2`}>Size Stock</label>
                <input type="text" value="" readOnly className={`${inp} flex-1 max-w-[140px] bg-[#f5f5f5]`}/>
                <input type="text" value="0" readOnly className={`${inp} w-16 text-center bg-[#f5f5f5]`}/>
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
                        <th className="w-24 py-0.5 font-bold text-right pr-2">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (<tr key={i} className="border-b border-[#ddd]" style={{background: i === rows.length - 1 ? '#f0fdf4' : 'white'}}>
                        <td className="w-6 text-center text-blue-700 font-bold text-[10px] border-r border-[#ddd]">{i === rows.length - 1 ? '▶*' : ''}</td>
                        <td className="text-center border-r border-[#ddd] font-bold">{r.sno}</td>
                        <td className="p-0 border-r border-[#ddd]">
                            <input type="text" value={r.code} onFocus={()=>openSearch(i)} onChange={e=>updateRow(i,'code',e.target.value)} className="w-full h-[22px] px-1 text-[11px] font-bold outline-none bg-[#9ae66e] focus:bg-[#bef5a0] text-center cursor-pointer"/>
                        </td>
                        <td className="p-0 border-r border-[#ddd]">
                            <input type="text" value={r.itemName} onChange={e=>updateRow(i,'itemName',e.target.value)} onFocus={()=>openSearch(i)} className="w-full h-[22px] px-2 text-[11px] font-bold outline-none focus:bg-yellow-50"/>
                        </td>
                        <td className="p-0 border-r border-[#ddd]">
                            <input type="number" value={r.qty} onChange={e=>updateRow(i,'qty',e.target.value)} className="w-full h-[22px] pr-2 text-[11px] font-bold outline-none focus:bg-yellow-50 text-right" placeholder="0.000"/>
                        </td>
                        <td className="p-0 border-r border-[#ddd]">
                            <input type="number" value={r.rate} onChange={e=>updateRow(i,'rate',e.target.value)} className="w-full h-[22px] pr-2 text-[11px] font-bold outline-none focus:bg-yellow-50 text-right" placeholder="0.00"/>
                        </td>
                        <td className="border-r border-[#ddd] pr-2 text-right font-bold">{r.amount || '0.00'}</td>
                        <td className="pr-2 text-right font-bold">{r.total || '0.00'}</td>
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
                        <span>Alt+V - Bill View</span>
                        <span>Alt+R - Bill Print</span>
                    </div>
                </div>
                <div className="flex mt-1 border-t border-[#c0c0c0] pt-1">
                    <button onClick={handleSave} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Save</button>
                    <button onClick={()=>alert('Delete bill — select from View')} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Delete</button>
                    <button onClick={()=>alert('View saved bills')} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">View</button>
                    <button onClick={handleCancel} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Cancel</button>
                    <button onClick={handleCancel} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Close</button>
                </div>
                <div className="flex mt-0.5">
                    <button className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">First</button>
                    <button className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Prev</button>
                    <button className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Next</button>
                    <button className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Last</button>
                    <button onClick={handlePrint} className="flex-1 bg-[#4dbcc4] hover:bg-[#3aa8b0] border border-[#888] text-black font-bold py-0.5 text-[12px]">Print</button>
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

        {showToast && (<div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-6 py-2 rounded-lg shadow-2xl font-bold text-sm z-50">
            Bill Saved Successfully — {lastOrder?.billNo}
        </div>)}
    </div>);
}
