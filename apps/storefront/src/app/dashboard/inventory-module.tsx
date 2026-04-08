"use client";

import React, { useState, useEffect } from 'react';
import {
  Package, PlusCircle, RefreshCw, Search, Filter, ArrowUpRight, ArrowDownRight,
  AlertTriangle, Truck, FileText, Download, MoreVertical, Edit, Eye, Trash2,
  Box, CheckCircle, BarChart2, Layers, Repeat, ShieldAlert, Archive
} from 'lucide-react';
import { gql } from '../../core/queries/gql';

async function fetchVendure(query: string, variables: Record<string, any> = {}) {
  return gql(query, { useAdmin: true, variables });
}

const TABS = [
  'Overview', 'Products', 'Stock Levels', 'Purchase Orders', 'Goods Receiving', 
  'Suppliers', 'Adjustments', 'Transfers', 'Returns', 'Batch Tracking', 'Reports'
];

export default function InventoryModule() {
  const [activeTab, setActiveTab] = useState('Overview');

  return (
    <div className="flex flex-col h-[85vh] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Module Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
          <Package className="text-emerald-600" /> Inventory Management
        </h2>
        <div className="flex gap-2">
           <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-bold text-slate-600 hover:bg-slate-50">
             <Download size={16} /> Export
           </button>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-white px-2 scrollbar-hide">
        {TABS.map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 text-sm font-bold whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50' 
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6">
        {activeTab === 'Overview' && <OverviewTab />}
        {activeTab === 'Products' && <ProductsTab />}
        {activeTab === 'Stock Levels' && <StockLevelsTab />}
        {activeTab === 'Purchase Orders' && <POTab />}
        {activeTab === 'Goods Receiving' && <GoodsReceiveTab />}
        {activeTab === 'Suppliers' && <SuppliersTab />}
        {activeTab === 'Adjustments' && <AdjustmentsTab />}
        {activeTab === 'Transfers' && <TransfersTab />}
        {activeTab === 'Returns' && <ReturnsTab />}
        {activeTab === 'Batch Tracking' && <BatchTab />}
        {activeTab === 'Reports' && <ReportsTab />}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// SUB-TAB COMPONENTS
// -----------------------------------------------------------------------------

function OverviewTab() {
  const stats = [
    { title: 'Total Items', val: '1,248', icon: Box, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'In Stock Value', val: '₹4.2L', icon: BarChart2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    { title: 'Low Stock Alerts', val: '24', icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
    { title: 'Out of Stock', val: '8', icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`p-3 rounded-lg ${s.bg}`}>
              <s.icon size={24} className={s.color} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-500">{s.title}</div>
              <div className="text-2xl font-black text-slate-800">{s.val}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            Recent Activity <span className="text-xs text-blue-600 cursor-pointer">View All</span>
          </h3>
          <div className="space-y-4">
            {[1,2,3].map(i => (
              <div key={i} className="flex gap-3 items-start border-b border-slate-50 pb-3">
                <div className="mt-1 p-1.5 bg-emerald-100 rounded text-emerald-700"><ArrowDownRight size={14}/></div>
                <div>
                  <div className="text-sm font-bold text-slate-700">Stock Received: PO-1029</div>
                  <div className="text-xs text-slate-500">+150 units of Organic Atta (5kg) added to Main Warehouse</div>
                </div>
                <div className="ml-auto text-xs font-mono text-slate-400">10m ago</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center justify-between">
            Low Stock Alerts <span className="text-xs text-amber-600 cursor-pointer">Reorder</span>
          </h3>
          <div className="space-y-3">
            {[
              { n: 'Fortune Sunflower Oil 1L', cur: 12, min: 20 },
              { n: 'Aashirvaad Select Atta 5kg', cur: 5, min: 15 },
              { n: 'Tata Salt 1kg', cur: 40, min: 100 },
            ].map((item, i) => (
               <div key={i} className="flex justify-between items-center bg-amber-50/50 p-3 rounded border border-amber-100">
                  <div className="text-sm font-bold text-slate-700">{item.n}</div>
                  <div className="text-xs font-medium">
                     <span className="text-red-600 font-bold">{item.cur}</span> / {item.min} min
                  </div>
               </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsTab() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('0');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const data = await fetchVendure(`
        query {
          products(options: { take: 50, sort: { createdAt: DESC } }) {
            items { id name slug variants { sku price stockOnHand } }
          }
        }
      `);
      setProducts(data.products.items || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => { loadProducts(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const prodData = await fetchVendure(`
        mutation CreateProduct($input: CreateProductInput!) { createProduct(input: $input) { id } }
      `, { input: { translations: [{ languageCode: "en", name, slug, description: "Added via POS" }] } });

      const productId = prodData.createProduct.id;
      await fetchVendure(`
        mutation CreateProductVariants($input: [CreateProductVariantInput!]!) { createProductVariants(input: $input) { id } }
      `, { input: [{ productId, sku, price: Math.round(parseFloat(price) * 100), translations: [{ languageCode: "en", name }] }] });

      setShowAdd(false);
      setName(''); setSku(''); setPrice('');
      loadProducts();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div className="bg-white rounded border border-slate-200 shadow-sm h-full flex flex-col">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center gap-4">
         <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input placeholder="Search by name, SKU, barcode..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
         </div>
         <div className="flex gap-2">
            <button className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg flex items-center gap-2 text-sm font-medium"><Filter size={16}/> Filter</button>
            <button onClick={()=>setShowAdd(!showAdd)} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg flex items-center gap-2 text-sm font-bold shadow-sm"><PlusCircle size={16}/> Add Item</button>
         </div>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="p-4 bg-emerald-50 border-b border-emerald-100 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
           <div><label className="text-xs font-bold text-emerald-800">Item Name</label><input required value={name} onChange={e=>setName(e.target.value)} className="w-full mt-1 p-2 border border-emerald-200 rounded text-sm"/></div>
           <div><label className="text-xs font-bold text-emerald-800">SKU / Code</label><input required value={sku} onChange={e=>setSku(e.target.value)} className="w-full mt-1 p-2 border border-emerald-200 rounded text-sm"/></div>
           <div><label className="text-xs font-bold text-emerald-800">Selling Price (₹)</label><input required type="number" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="w-full mt-1 p-2 border border-emerald-200 rounded text-sm"/></div>
           <div><label className="text-xs font-bold text-emerald-800">Initial Stock</label><input type="number" value={stock} onChange={e=>setStock(e.target.value)} className="w-full mt-1 p-2 border border-emerald-200 rounded text-sm"/></div>
           <button type="submit" className="w-full p-2 bg-emerald-600 text-white rounded font-bold text-sm hover:bg-emerald-700">Save Item</button>
        </form>
      )}

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">
            <tr>
              <th className="p-4">Item Details</th>
              <th className="p-4">SKU / Barcode</th>
              <th className="p-4">Category</th>
              <th className="p-4 text-right">Selling Price</th>
              <th className="p-4 text-center">In Stock</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map(p => {
               const variant = p.variants[0] || {};
               return (
                 <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4">
                       <div className="font-bold text-sm text-slate-800">{p.name}</div>
                       <div className="text-xs text-slate-500">Unit: Pcs</div>
                    </td>
                    <td className="p-4 text-sm font-mono text-slate-600">{variant.sku}</td>
                    <td className="p-4 text-sm text-slate-600">Groceries</td>
                    <td className="p-4 text-sm font-bold text-slate-800 text-right">₹{(variant.price / 100 || 0).toFixed(2)}</td>
                    <td className="p-4 text-center">
                       <span className={`px-2 py-1 rounded-full text-xs font-bold ${variant.stockOnHand > 10 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                         {variant.stockOnHand || 0}
                       </span>
                    </td>
                    <td className="p-4 text-center"><span className="text-emerald-500"><CheckCircle size={16} className="mx-auto" /></span></td>
                    <td className="p-4 text-right">
                       <button className="p-1.5 text-slate-400 hover:text-blue-600"><Edit size={16}/></button>
                    </td>
                 </tr>
               );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StockLevelsTab() {
  const data = [
    { name: 'Basmati Rice Premium 25kg', cur: 140, rsv: 10, dmg: 0, loc: 'Main WH', status: 'Healthy' },
    { name: 'Toor Dal 1kg', cur: 15, rsv: 2, dmg: 1, loc: 'Store Front', status: 'Low' },
  ];
  return <GenericTable title="Real-time Stock Levels" cols={['Item', 'Location', 'Available', 'Reserved', 'Damaged', 'Status']} data={data} 
    renderRow={(row: any, i: number) => (
      <tr key={i} className="border-b">
         <td className="p-3 text-sm font-bold text-slate-700">{row.name}</td>
         <td className="p-3 text-sm text-slate-500">{row.loc}</td>
         <td className="p-3 font-bold">{row.cur}</td>
         <td className="p-3 text-amber-600">{row.rsv}</td>
         <td className="p-3 text-red-500">{row.dmg}</td>
         <td className="p-3"><span className={`px-2 py-1 text-xs rounded-full ${row.status==='Healthy'?'bg-emerald-100 text-emerald-700':'bg-amber-100 text-amber-700'}`}>{row.status}</span></td>
      </tr>
    )}
  />;
}

function POTab() {
  return <Placeholder icon={FileText} title="Purchase Orders" desc="Raise POs, track expected delivery dates, and manage vendor orders." />;
}

function GoodsReceiveTab() {
  return <Placeholder icon={Truck} title="Goods Receiving Note (GRN)" desc="Record incoming stock against POs, capture batch numbers, and expiry dates." />;
}

function SuppliersTab() {
  return <Placeholder icon={Layers} title="Supplier Directory" desc="Manage vendor contacts, GST details, lead times, and payment terms." />;
}

function AdjustmentsTab() {
  return <Placeholder icon={Archive} title="Stock Adjustments" desc="Correct discrepancies, mark damages, or record internal consumption." />;
}

function TransfersTab() {
  return <Placeholder icon={Repeat} title="Warehouse Transfers" desc="Move stock between main warehouse and retail storefronts." />;
}

function ReturnsTab() {
  return <Placeholder icon={ArrowDownRight} title="Returns Management" desc="Process Purchase Returns (RTV) and Sales Returns." />;
}

function BatchTab() {
  return <Placeholder icon={Box} title="Batch & Expiry Tracking" desc="Monitor FIFO/FEFO expiry dates for FMCG items to minimize wastage." />;
}

function ReportsTab() {
  return <Placeholder icon={BarChart2} title="Inventory Reports" desc="Generate valuation reports, slow-moving analytics, and stock ledgers." />;
}


function Placeholder({ icon: Icon, title, desc }: any) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-white rounded border border-slate-200 border-dashed text-center">
       <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100"><Icon size={40} className="text-slate-300" /></div>
       <h3 className="text-xl font-bold text-slate-700 mb-2">{title}</h3>
       <p className="text-slate-500 max-w-md">{desc}</p>
       <button className="mt-6 px-4 py-2 bg-slate-900 text-white font-bold rounded shadow-sm text-sm">Configure Module</button>
    </div>
  )
}

function GenericTable({ title, cols, data, renderRow }: any) {
  return (
     <div className="bg-white rounded border border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-200 font-bold text-slate-800">{title}</div>
        <table className="w-full text-left">
           <thead className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
             <tr>{cols.map((c: string)=><th key={c} className="p-3">{c}</th>)}</tr>
           </thead>
           <tbody>{data.map(renderRow)}</tbody>
        </table>
     </div>
  );
}
