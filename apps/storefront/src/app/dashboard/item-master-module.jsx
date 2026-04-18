"use client";
import React, { useState, useEffect, useRef } from 'react';
import { ListItemsQuery, CreateItemCommand, UpdateItemCommand, DeleteItemCommand } from '../../core/queries/pharma.query';

export default function ItemMasterModule() {
    const [items, setItems] = useState([]);
    const [selectedIdx, setSelectedIdx] = useState(-1);
    const [mode, setMode] = useState('view'); // 'view' | 'new' | 'edit'
    const [search, setSearch] = useState('');
    const [searchField, setSearchField] = useState('ItemName');
    const [loading, setLoading] = useState(false);
    const itemNameRef = useRef(null);

    // Form state
    const [form, setForm] = useState({});

    // ONE API call on mount
    useEffect(() => { loadAll(); }, []);

    const loadAll = async () => {
        setLoading(true);
        try {
            const list = await new ListItemsQuery().execute();
            setItems(list);
            if (list.length > 0) { setForm(list[0]); setSelectedIdx(0); setMode('view'); }
            else { setForm(blankForm(1)); setMode('new'); }
        } catch (e) { console.error(e); }
        setLoading(false);
    };

    const blankForm = (code) => ({
        code: String(code), brand: 'NA', category: 'Na', itemName: '', hsnSac: '',
        taxName: 'GST 5%', mfr: '', unit: 'NA', packingUnit: '0.00',
        mrpRate: '0.00', salesRate: '0.00', incentivePct: '0.0',
        costRate: '0.00', cRate: '0.00', minStkQty: '0.00', maxStkQty: '0.00',
        allowExpiry: false,
        rateA: '0.00', rateB: '0.00', rateC: '0.00', rateD: '0.00',
        sizes: [{ size: 'NA', rate: '0.00' }],
    });

    const handleAdd = () => {
        const nextCode = items.length > 0 ? Math.max(...items.map(i => parseInt(i.code) || 0)) + 1 : 1;
        setForm(blankForm(nextCode));
        setMode('new');
        setSelectedIdx(-1);
        setTimeout(() => itemNameRef.current?.focus(), 50);
    };

    const handleEdit = () => {
        if (selectedIdx < 0) return alert('Select an item first.');
        setMode('edit');
        setTimeout(() => itemNameRef.current?.focus(), 50);
    };

    const handleDelete = async () => {
        if (selectedIdx < 0) return alert('Select an item first.');
        const item = items[selectedIdx];
        if (!item?.id) return;
        if (!confirm('Delete this item?')) return;
        try { await new DeleteItemCommand().execute(item.id); await loadAll(); } catch (err) { alert(err.message); }
    };

    const handleClose = () => {
        if (mode === 'new' || mode === 'edit') {
            setMode('view');
            if (selectedIdx >= 0) setForm(items[selectedIdx]);
            else if (items.length > 0) { setForm(items[0]); setSelectedIdx(0); }
            else setForm(blankForm(1));
        }
    };

    const handleSave = async () => {
        if (!form.itemName?.trim()) return alert('Item Name is required.');
        // Strip fields we don't send to backend
        const { id, createdAt, updatedAt, sizesJson, hsnSac, ...rest } = form;
        const input = {
            ...rest,
            code: String(form.code || ''),
            hsnCode: form.hsnCode || form.hsnSac || '',
            purchaseRate: parseFloat(form.purchaseRate) || 0,
            salesRate: parseFloat(form.salesRate) || 0,
            mrpRate: parseFloat(form.mrpRate) || 0,
            costRate: parseFloat(form.costRate) || 0,
            cRate: parseFloat(form.cRate) || 0,
            rateA: parseFloat(form.rateA) || 0,
            rateB: parseFloat(form.rateB) || 0,
            rateC: parseFloat(form.rateC) || 0,
            rateD: parseFloat(form.rateD) || 0,
            gstPercent: parseFloat(form.gstPercent) || 5,
            discount: parseFloat(form.discount) || 0,
            profitMargin: parseFloat(form.profitMargin) || 0,
            incentivePct: parseFloat(form.incentivePct) || 0,
            minStock: parseFloat(form.minStock) || 0,
            maxStock: parseFloat(form.maxStock) || 0,
            minStkQty: parseFloat(form.minStkQty) || 0,
            maxStkQty: parseFloat(form.maxStkQty) || 0,
            allowExpiry: !!form.allowExpiry,
            isExpiryEnabled: form.isExpiryEnabled !== false,
            isWeightBased: !!form.isWeightBased,
            sizes: (form.sizes || []).map(s => ({ size: String(s.size || ''), rate: parseFloat(s.rate) || 0 })),
        };
        try {
            if (mode === 'new') await new CreateItemCommand().execute(input);
            else if (mode === 'edit') await new UpdateItemCommand().execute(id, input);
            await loadAll();
            setMode('view');
        } catch (err) { alert(err.message); }
    };

    const nav = (direction) => {
        if (items.length === 0) return;
        let idx = selectedIdx;
        if (direction === 'first') idx = 0;
        else if (direction === 'last') idx = items.length - 1;
        else if (direction === 'prev') idx = Math.max(0, selectedIdx - 1);
        else if (direction === 'next') idx = Math.min(items.length - 1, selectedIdx + 1);
        setSelectedIdx(idx); setForm(items[idx]); setMode('view');
    };

    const selectItem = (i) => { setSelectedIdx(i); setForm(items[i]); setMode('view'); };

    const updateForm = (field, val) => setForm(f => ({ ...f, [field]: val }));
    const updateSize = (idx, field, val) => setForm(f => ({ ...f, sizes: f.sizes.map((s, i) => i === idx ? { ...s, [field]: val } : s) }));
    const addSizeRow = () => setForm(f => ({ ...f, sizes: [...(f.sizes || []), { size: '', rate: '0.00' }] }));

    const filteredItems = items.filter(it => {
        if (!search) return true;
        const s = search.toLowerCase();
        if (searchField === 'Code') return String(it.code).includes(search);
        return (it.itemName || '').toLowerCase().includes(s);
    });

    const isEditing = mode === 'new' || mode === 'edit';
    const inp = (readOnly = !isEditing) => `bg-white border border-[#7ba0b5] h-6 px-2 text-[12px] font-bold text-slate-900 outline-none ${readOnly ? 'bg-[#e8f0f3] cursor-not-allowed' : 'focus:border-[#1a5276] focus:bg-yellow-50'}`;
    const labelStyle = "text-[12px] text-slate-800 font-semibold";

    return (<div className="flex flex-col h-[85vh] rounded-md overflow-hidden font-sans shadow-xl" style={{ background: '#b8dce2' }}>
        {/* Title bar */}
        <div className="h-6 flex items-center px-2 shrink-0 bg-gradient-to-r from-[#1a5276] to-[#2980b9]">
            <span className="text-white text-[11px] font-bold">Item Definition - HASHTAG PRIVATE LIMITED 2026-2027</span>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* ── LEFT: Form ── */}
            <div className="flex-1 p-3 overflow-auto" style={{ background: '#b8dce2' }}>
                <div className="mb-2">
                    <h2 className="text-xl font-black text-[#16a085] tracking-wider">{mode === 'new' ? 'NEW PRODUCT' : mode === 'edit' ? 'EDIT PRODUCT' : 'PRODUCT DETAIL'}</h2>
                </div>

                {/* Top grid: 2 columns */}
                <div className="space-y-1.5">
                    {/* Code */}
                    <div className="flex items-center gap-2">
                        <label className={`${labelStyle} w-24`}>Code</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.code || ''} onChange={e=>updateForm('code',e.target.value)} readOnly={!isEditing} className={`${inp()} w-32 ml-1`}/>
                    </div>
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        <label className={`${labelStyle} w-24`}>Brand</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.brand || ''} onChange={e=>updateForm('brand',e.target.value)} readOnly={!isEditing} className={`${inp()} flex-1 max-w-md ml-1`}/>
                    </div>
                    {/* Category */}
                    <div className="flex items-center gap-2">
                        <label className={`${labelStyle} w-24`}>Category</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.category || ''} onChange={e=>updateForm('category',e.target.value)} readOnly={!isEditing} className={`${inp()} flex-1 max-w-md ml-1`}/>
                    </div>
                    {/* Item Name + HSN/SAC */}
                    <div className="flex items-center gap-2">
                        <label className={`${labelStyle} w-24`}>Item Name</label><span className="text-slate-900 font-bold">:</span>
                        <input ref={itemNameRef} type="text" value={form.itemName || ''} onChange={e=>updateForm('itemName',e.target.value)} readOnly={!isEditing} className={`${inp()} flex-1 max-w-md ml-1`}/>
                        <label className={`${labelStyle} ml-6 text-right leading-tight`}>HSN /<br/>SAC</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.hsnSac || ''} onChange={e=>updateForm('hsnSac',e.target.value)} readOnly={!isEditing} className={`${inp()} w-36 ml-1`}/>
                    </div>
                    {/* Tax Name + MFR */}
                    <div className="flex items-center gap-2">
                        <label className={`${labelStyle} w-24`}>Tax Name</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.taxName || ''} onChange={e=>updateForm('taxName',e.target.value)} readOnly={!isEditing} className={`${inp()} w-56 ml-1`}/>
                        <label className={`${labelStyle} ml-6`}>MFR</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.mfr || ''} onChange={e=>updateForm('mfr',e.target.value)} readOnly={!isEditing} className={`${inp()} flex-1 max-w-xs ml-1`}/>
                    </div>
                    {/* Unit + Packing Unit */}
                    <div className="flex items-center gap-2">
                        <label className={`${labelStyle} w-24`}>Unit</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.unit || ''} onChange={e=>updateForm('unit',e.target.value)} readOnly={!isEditing} className={`${inp()} w-32 ml-1`}/>
                        <label className={`${labelStyle} ml-6 leading-tight`}>Packing<br/>Unit</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.packingUnit || ''} onChange={e=>updateForm('packingUnit',e.target.value)} readOnly={!isEditing} className={`${inp()} w-32 ml-1 text-right`}/>
                    </div>
                    {/* MRP Rate + Sales Rate + Incentive% */}
                    <div className="flex items-center gap-2">
                        <label className={`${labelStyle} w-24`}>MRP Rate</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.mrpRate || ''} onChange={e=>updateForm('mrpRate',e.target.value)} readOnly={!isEditing} className={`${inp()} w-32 ml-1 text-right`}/>
                        <label className={`${labelStyle} ml-6`}>Sales Rate</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.salesRate || ''} onChange={e=>updateForm('salesRate',e.target.value)} readOnly={!isEditing} className={`${inp()} w-32 ml-1 text-right`}/>
                        <label className={`${labelStyle} ml-6`}>Incentive%</label>
                        <input type="text" value={form.incentivePct || ''} onChange={e=>updateForm('incentivePct',e.target.value)} readOnly={!isEditing} className={`${inp()} w-20 ml-1 text-right`}/>
                    </div>
                    {/* Cost Rate + CRate */}
                    <div className="flex items-center gap-2">
                        <label className={`${labelStyle} w-24`}>Cost Rate</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.costRate || ''} onChange={e=>updateForm('costRate',e.target.value)} readOnly={!isEditing} className={`${inp()} w-32 ml-1 text-right`}/>
                        <label className={`${labelStyle} ml-6`}>CRate</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.cRate || ''} onChange={e=>updateForm('cRate',e.target.value)} readOnly={!isEditing} className={`${inp()} w-32 ml-1 text-right`}/>
                    </div>
                    {/* MinStkQty + MaxStkQty + Allow Expiry */}
                    <div className="flex items-center gap-2">
                        <label className={`${labelStyle} w-24`}>MinStkQty</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.minStkQty || ''} onChange={e=>updateForm('minStkQty',e.target.value)} readOnly={!isEditing} className={`${inp()} w-32 ml-1 text-right`}/>
                        <label className={`${labelStyle} ml-6`}>MaxStkQty</label><span className="text-slate-900 font-bold">:</span>
                        <input type="text" value={form.maxStkQty || ''} onChange={e=>updateForm('maxStkQty',e.target.value)} readOnly={!isEditing} className={`${inp()} w-32 ml-1 text-right`}/>
                        <label className="flex items-center gap-1.5 ml-6 cursor-pointer">
                            <input type="checkbox" checked={form.allowExpiry || false} onChange={e=>updateForm('allowExpiry',e.target.checked)} disabled={!isEditing} className="w-3.5 h-3.5 border-slate-400"/>
                            <span className={labelStyle}>Allow Expiry</span>
                        </label>
                    </div>
                </div>

                {/* Bottom: Rate Details + Size Details */}
                <div className="flex gap-6 mt-5">
                    {/* Rate Details */}
                    <div>
                        <h3 className="text-[14px] font-black text-[#16a085] mb-2 border-b border-[#7ba0b5] pb-0.5 inline-block">Rate Details</h3>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-2">
                            <div className="text-center">
                                <label className="text-[#16a085] text-[11px] font-bold">Rate A</label>
                                <input type="text" value={form.rateA || ''} onChange={e=>updateForm('rateA',e.target.value)} readOnly={!isEditing} className={`${inp()} w-28 mt-1 text-right block`}/>
                            </div>
                            <div className="text-center">
                                <label className="text-[#16a085] text-[11px] font-bold">Rate B</label>
                                <input type="text" value={form.rateB || ''} onChange={e=>updateForm('rateB',e.target.value)} readOnly={!isEditing} className={`${inp()} w-28 mt-1 text-right block`}/>
                            </div>
                            <div className="text-center mt-3">
                                <label className="text-[#16a085] text-[11px] font-bold">Rate C</label>
                                <input type="text" value={form.rateC || ''} onChange={e=>updateForm('rateC',e.target.value)} readOnly={!isEditing} className={`${inp()} w-28 mt-1 text-right block`}/>
                            </div>
                            <div className="text-center mt-3">
                                <label className="text-[#16a085] text-[11px] font-bold">Rate D</label>
                                <input type="text" value={form.rateD || ''} onChange={e=>updateForm('rateD',e.target.value)} readOnly={!isEditing} className={`${inp()} w-28 mt-1 text-right block`}/>
                            </div>
                        </div>
                    </div>
                    {/* Size Details */}
                    <div className="flex-1 max-w-sm">
                        <h3 className="text-[14px] font-black text-[#16a085] mb-2 border-b border-[#7ba0b5] pb-0.5 inline-block">Size Details</h3>
                        <div className="bg-[#faf8dc] border border-[#7ba0b5]">
                            <table className="w-full text-[12px] border-collapse">
                                <thead>
                                    <tr className="bg-[#7ba0b5] text-white">
                                        <th className="py-0.5 px-2 border-r border-white text-left w-1/2">Size</th>
                                        <th className="py-0.5 px-2 text-right">Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(form.sizes || []).map((s, i) => (
                                        <tr key={i} className="border-b border-[#c0c8d0]">
                                            <td className="p-0 border-r border-[#c0c8d0]">
                                                <input type="text" value={s.size} onChange={e=>updateSize(i,'size',e.target.value)} readOnly={!isEditing} className="w-full h-6 px-2 outline-none bg-transparent font-bold"/>
                                            </td>
                                            <td className="p-0">
                                                <input type="text" value={s.rate} onChange={e=>updateSize(i,'rate',e.target.value)} readOnly={!isEditing} className="w-full h-6 px-2 outline-none bg-transparent font-bold text-right"/>
                                            </td>
                                        </tr>
                                    ))}
                                    {isEditing && (
                                        <tr className="border-b border-[#c0c8d0] bg-[#e8ecf0] cursor-pointer hover:bg-[#d4dce4]" onClick={addSizeRow}>
                                            <td className="px-2 text-blue-600 text-xs font-bold">* Click to add new size</td>
                                            <td></td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── RIGHT: Search ── */}
            <div className="w-[380px] bg-white border-l border-[#7ba0b5] flex flex-col shrink-0">
                <div className="p-2 bg-[#d4e6f1] border-b border-[#7ba0b5] flex items-center gap-2">
                    <label className="text-[12px] font-bold text-slate-800">Search</label>
                    <select value={searchField} onChange={e=>setSearchField(e.target.value)} className="border border-[#7ba0b5] h-6 text-[11px] font-bold outline-none bg-white">
                        <option>ItemName</option><option>Code</option>
                    </select>
                    <input type="text" value={search} onChange={e=>setSearch(e.target.value)} className="flex-1 border border-[#7ba0b5] h-6 px-2 text-[12px] font-bold outline-none focus:border-[#1a5276]"/>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-[12px] border-collapse">
                        <thead className="sticky top-0 bg-[#d4e6f1]">
                            <tr>
                                <th className="py-1 px-2 text-left border-b border-r border-[#7ba0b5] font-bold w-16">Code</th>
                                <th className="py-1 px-2 text-left border-b border-[#7ba0b5] font-bold">ItemName</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((it) => {
                                const origIdx = items.indexOf(it);
                                const isSelected = origIdx === selectedIdx;
                                return (<tr key={it.id || origIdx} onClick={()=>selectItem(origIdx)} className={`cursor-pointer ${isSelected ? 'bg-[#2980b9] text-white' : 'hover:bg-blue-50'}`}>
                                    <td className={`py-0.5 px-2 border-b border-r border-[#c0c8d0] font-bold ${isSelected ? 'text-white' : ''}`}>{it.code}</td>
                                    <td className={`py-0.5 px-2 border-b border-[#c0c8d0] font-bold uppercase ${isSelected ? 'text-white' : ''}`}>{it.itemName}</td>
                                </tr>);
                            })}
                            {filteredItems.length === 0 && (<tr><td colSpan={2} className="py-10 text-center text-slate-700 font-bold">No items</td></tr>)}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* Bottom action buttons */}
        <div className="flex items-center gap-2 px-3 py-2 shrink-0 border-t border-[#7ba0b5]" style={{background: '#b8dce2'}}>
            {isEditing ? (<>
                <button onClick={handleSave} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]">Save</button>
                <button onClick={handleClose} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]">Cancel</button>
            </>) : (<>
                <button onClick={handleAdd} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]"><span className="underline">A</span>dd</button>
                <button onClick={handleEdit} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]"><span className="underline">E</span>dit</button>
                <button onClick={handleDelete} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]"><span className="underline">D</span>elete</button>
                <button onClick={handleClose} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]"><span className="underline">C</span>lose</button>
                <div className="w-4"/>
                <button onClick={()=>nav('first')} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]">First</button>
                <button onClick={()=>nav('prev')} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]">Prev</button>
                <button onClick={()=>nav('next')} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]">Next</button>
                <button onClick={()=>nav('last')} className="bg-[#e74c3c] hover:bg-[#ec7063] text-white font-black px-5 py-1.5 text-sm border border-[#922b21] shadow-sm active:translate-y-[1px]">Last</button>
            </>)}
        </div>
    </div>);
}
