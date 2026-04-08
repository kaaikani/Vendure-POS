"use client";

import React, { useState, useEffect } from 'react';
import {
  Search, ArrowLeft, Loader2, AlertTriangle, PlusCircle, LayoutGrid, CheckCircle, ChevronDown
} from 'lucide-react';
import {
  PosCategory, PosProduct,
  GetPosCategoriesQuery, GetPosProductsQuery
} from '../../core/queries/PosQueries';

interface GroupedProduct {
  name: string;
  variants: PosProduct[];
  selectedIdx: number;
}

export default function CategoryModule() {
  const [categories, setCategories] = useState<PosCategory[]>([]);
  const [products, setProducts] = useState<PosProduct[]>([]);

  const [viewState, setViewState] = useState<'loading' | 'root' | 'detail' | 'error'>('loading');
  const [selectedCategory, setSelectedCategory] = useState<PosCategory | null>(null);

  // Search inputs
  const [catSearch, setCatSearch] = useState('');
  const [prodSearch, setProdSearch] = useState('');

  // UI States
  const [addedToast, setAddedToast] = useState<string | null>(null);

  // Track selected variant per product group
  const [selectedVariants, setSelectedVariants] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const cats = await new GetPosCategoriesQuery().execute();
      setCategories(cats);
      setViewState('root');
    } catch (e) {
      setViewState('error');
    }
  };

  const loadCategoryDetails = async (cat: PosCategory) => {
    try {
      setViewState('loading');
      setSelectedCategory(cat);
      setProdSearch('');
      const prods = await new GetPosProductsQuery().execute(cat.id);
      setProducts(prods);
      setViewState('detail');
    } catch (e) {
      setViewState('error');
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setViewState('root');
  };

  // --- CROSS-TAB POS CART INTEGRATION ---
  const handleAddToPosCart = (product: PosProduct) => {
    try {
      const raw = localStorage.getItem('pos_cart');
      let cart = raw ? JSON.parse(raw) : [];
      
      const idx = cart.findIndex((c: any) => c.productId === product.id || c.id === product.id);
      if (idx > -1) {
        cart[idx].qty += 1;
        cart[idx].total = cart[idx].qty * cart[idx].rate; // handling rate/price mapping
      } else {
        cart.push({ 
          id: product.id, 
          productId: product.id, 
          code: product.id, 
          name: product.name, 
          qty: 1, 
          rate: product.price, 
          total: product.price 
        });
      }
      
      localStorage.setItem('pos_cart', JSON.stringify(cart));
      
      // Toast notification
      setAddedToast(`${product.name} sent to POS Billing Server`);
      setTimeout(() => setAddedToast(null), 2500);

    } catch(e) {
      console.error(e);
      alert("Error adding item to POS cart");
    }
  };

  // --- Rendering Helpers ---
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase()));
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(prodSearch.toLowerCase()) || p.id.toLowerCase().includes(prodSearch.toLowerCase()));

  // Strip size/quantity suffix from product name to get base name for grouping
  // Matches patterns like: "100g", "1kg", "500ml", "1L", "6 pack", "12pk", "(Premium)"
  const stripSizeSuffix = (name: string): { base: string; size: string } => {
    const sizeRegex = /\s*\b(\d+(?:\.\d+)?)\s*(g|gm|gms|kg|ml|l|ltr|pc|pcs|pk|pack)\b\s*$/i;
    const match = name.match(sizeRegex);
    if (match) {
      return { base: name.slice(0, match.index).trim(), size: match[0].trim() };
    }
    return { base: name, size: '' };
  };

  // Group variants by base product name (strip size suffix)
  const groupedProducts: GroupedProduct[] = [];
  const groupMap: Record<string, PosProduct[]> = {};
  filteredProducts.forEach(p => {
    const { base, size } = stripSizeSuffix(p.name);
    // Override quantityStr with extracted size if present
    const productCopy = { ...p, quantityStr: size || p.quantityStr };
    if (!groupMap[base]) groupMap[base] = [];
    groupMap[base].push(productCopy);
  });
  Object.entries(groupMap).forEach(([name, variants]) => {
    const idx = selectedVariants[name] || 0;
    // Sort variants by price ascending
    const sorted = [...variants].sort((a, b) => a.price - b.price);
    groupedProducts.push({ name, variants: sorted, selectedIdx: Math.min(idx, sorted.length - 1) });
  });

  // 1. Loading State
  if (viewState === 'loading') {
    return (
      <div className="flex items-center justify-center h-[85vh] bg-slate-50 rounded-xl border border-slate-200 shadow-sm">
        <Loader2 className="animate-spin text-emerald-500 mb-4" size={48} />
      </div>
    );
  }

  // 2. Error State
  if (viewState === 'error') {
    return (
      <div className="flex flex-col items-center justify-center h-[85vh] bg-slate-50 rounded-xl border border-slate-200 text-slate-500">
        <AlertTriangle size={64} className="mb-4 text-red-400" />
        <h2 className="text-xl font-bold">Failed to load Category Core Data.</h2>
        <button onClick={fetchInitialData} className="mt-4 px-6 py-2 bg-slate-900 text-white rounded-lg">Retry Fetching</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[85vh] bg-slate-50 rounded-xl overflow-hidden font-sans border border-slate-200 shadow-sm relative">
      
      {addedToast && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 text-white px-6 py-3 rounded-xl font-bold shadow-xl animate-in slide-in-from-top-4 flex items-center gap-2 border border-slate-700">
          <CheckCircle size={18} className="text-emerald-400"/> {addedToast}
        </div>
      )}

      {/* --- ROOT VIEW: SHOW 10 CATEGORIES --- */}
      {viewState === 'root' && (
        <div className="flex flex-col h-full relative">
          <div className="bg-white p-6 border-b border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
             <div>
               <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2"><LayoutGrid className="text-emerald-600"/> Category Master Data</h1>
               <p className="text-slate-500 text-sm font-bold mt-1">Select a core category branch to manage structured products catalog.</p>
             </div>
             <div className="relative w-full max-w-sm">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
               <input 
                 type="text" value={catSearch} onChange={e=>setCatSearch(e.target.value)} 
                 placeholder="Search Category Directory..." 
                 className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-inner transition-all text-slate-800 placeholder:text-slate-400"
               />
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50 content-start">
             <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-5 gap-6">
                {filteredCategories.map((c, i) => (
                   <button 
                     key={c.id} onClick={() => loadCategoryDetails(c)}
                     className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all flex flex-col items-center justify-center gap-3 group group-hover:bg-gradient-to-br group-hover:from-white group-hover:to-emerald-50"
                   >
                      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-black shadow-inner group-hover:scale-110 transition-transform tracking-tighter">
                         {i + 1}
                      </div>
                      <div className="text-center mt-2">
                         <h3 className="text-lg font-black text-slate-800 tracking-tight">{c.name}</h3>
                         <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black tracking-widest uppercase mt-2 inline-block shadow-sm">30 Items</span>
                      </div>
                   </button>
                ))}
                {filteredCategories.length === 0 && (
                  <div className="col-span-full py-20 text-center text-slate-400 font-bold border-2 border-dashed border-slate-300 rounded-2xl bg-white">No categories found matching "{catSearch}"</div>
                )}
             </div>
          </div>
        </div>
      )}

      {/* --- DETAIL VIEW: EXCEL PRODUCT VIEWER --- */}
      {viewState === 'detail' && (
        <div className="flex flex-col h-full relative">
          <div className="bg-white p-4 border-b border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 z-10">
             <div className="flex items-center gap-4">
               <button onClick={handleBack} className="p-2.5 border border-slate-300 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all shadow-sm"><ArrowLeft size={20}/></button>
               <div>
                  <h1 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                    <span className="text-emerald-600">DIR:</span> {selectedCategory?.name} Database
                  </h1>
                  <p className="text-[11px] font-black text-slate-400 tracking-wider font-mono uppercase mt-0.5">{groupedProducts.length} products | {filteredProducts.length} variants</p>
               </div>
             </div>
             
             <div className="relative w-full max-w-sm">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
               <input 
                 type="text" value={prodSearch} onChange={e=>setProdSearch(e.target.value)} 
                 placeholder={`Search by Name or ID in ${selectedCategory?.name}...`} 
                 className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm shadow-inner transition-all text-slate-800 placeholder:text-slate-400"
               />
             </div>
          </div>

          <div className="flex-1 overflow-hidden relative bg-white">
            <div className="h-full overflow-auto">
              {filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-slate-400 font-bold text-center">
                  <Search size={48} className="mb-4 opacity-30" />
                  <p>No products match your search query inside this category.</p>
                </div>
              ) : (
                <table className="w-full text-left whitespace-nowrap text-sm border-collapse">
                  <thead className="bg-slate-100 sticky top-0 z-10 text-[11px] uppercase tracking-widest text-slate-500 font-black shadow-sm">
                    <tr>
                      <th className="p-4 border-b border-slate-200">Product Name</th>
                      <th className="p-4 border-b border-slate-200 w-52">Variant</th>
                      <th className="p-4 border-b border-slate-200 w-32 text-right">Rate (₹)</th>
                      <th className="p-4 border-b border-slate-200 w-32 text-center">POS Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {groupedProducts.map(g => {
                      const selected = g.variants[g.selectedIdx];
                      return (
                        <tr key={g.name} className="hover:bg-emerald-50/40 transition-colors group">
                          <td className="p-4">
                            <span className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors text-base">{g.name}</span>
                            <span className="text-[10px] text-slate-400 font-bold ml-2">({g.variants.length} {g.variants.length > 1 ? 'variants' : 'variant'})</span>
                          </td>
                          <td className="p-4">
                            {g.variants.length > 1 ? (
                              <div className="relative">
                                <select
                                  value={g.selectedIdx}
                                  onChange={(e) => { e.stopPropagation(); setSelectedVariants(prev => ({ ...prev, [g.name]: parseInt(e.target.value) })); }}
                                  className="w-full border-2 border-emerald-200 rounded-lg px-3 py-2 text-sm font-black text-slate-700 bg-white outline-none focus:border-emerald-500 appearance-none cursor-pointer hover:border-emerald-400 transition pr-8"
                                >
                                  {g.variants.map((v, i) => (
                                    <option key={v.id} value={i}>{v.quantityStr} — ₹{v.price.toFixed(0)}</option>
                                  ))}
                                </select>
                                <ChevronDown size={16} className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-500 pointer-events-none" />
                              </div>
                            ) : (
                              <span className="font-bold text-slate-600 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 inline-block">{selected.quantityStr}</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-black text-slate-800 group-hover:text-emerald-700 text-lg">₹{selected.price.toFixed(2)}</td>
                          <td className="p-4 text-center">
                            <button
                              onClick={() => handleAddToPosCart(selected)}
                              className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 mx-auto transition-all shadow-sm hover:bg-emerald-500 active:scale-95"
                            >
                              <PlusCircle size={14}/> Send to POS
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
