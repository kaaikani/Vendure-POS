"use client";

import React from 'react';
import { Row, Col, Progress, Table, Tag } from 'antd';
import { 
  BarChart, LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie
} from 'recharts';
import { 
  TrendingUp, TrendingDown, ShoppingBag, Users, DollarSign, Activity, 
  AlertTriangle, CheckCircle, Package, ArrowUpRight, CreditCard, Wallet, Smartphone
} from 'lucide-react';

const salesData = [
  { name: 'Mon', sales: 4500 },
  { name: 'Tue', sales: 5200 },
  { name: 'Wed', sales: 4800 },
  { name: 'Thu', sales: 6100 },
  { name: 'Fri', sales: 5900 },
  { name: 'Sat', sales: 7200 },
  { name: 'Sun', sales: 6800 },
];

const paymentSummary = [
  { name: 'Cash', value: 45, color: '#10b981', icon: Wallet },
  { name: 'UPI', value: 35, color: '#3b82f6', icon: Smartphone },
  { name: 'Card', value: 20, color: '#ef4444', icon: CreditCard },
];

const recentTransactions = [
  { key: '1', id: 'ORD-5541', amount: '₹1,250', method: 'UPI', status: 'Completed', time: '5 mins ago' },
  { key: '2', id: 'ORD-5542', amount: '₹840', method: 'Cash', status: 'Completed', time: '12 mins ago' },
  { key: '3', id: 'ORD-5543', amount: '₹2,100', method: 'Card', status: 'Pending', time: '25 mins ago' },
  { key: '4', id: 'ORD-5544', amount: '₹450', method: 'UPI', status: 'Completed', time: '40 mins ago' },
  { key: '5', id: 'ORD-5545', amount: '₹1,600', method: 'Cash', status: 'Completed', time: '1 hr ago' },
];

const lowStockAlerts = [
  { name: 'Fortune Sunflower Oil 1L', stock: 12, min: 20 },
  { name: 'Aashirvaad Select Atta 5kg', stock: 5, min: 15 },
  { name: 'Tata Salt 1kg', stock: 40, min: 100 },
];

const topSelling = [
  { name: 'Basmati Rice Premium 25kg', sales: 145, revenue: '₹4,50,000' },
  { name: 'Gold Winner Oil 1L', sales: 120, revenue: '₹2,16,000' },
  { name: 'Farm Fresh Eggs (30pk)', sales: 98, revenue: '₹19,600' },
  { name: 'Organic Jaggery 1kg', sales: 85, revenue: '₹8,500' },
];

// Helper card component to match Inventory UI style
const DashboardCard = ({ children, title, extra }: any) => (
  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-full flex flex-col">
    {title && (
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-extrabold text-slate-800 text-base uppercase tracking-tight">{title}</h3>
        {extra && <div className="text-xs">{extra}</div>}
      </div>
    )}
    <div className="flex-1">{children}</div>
  </div>
);

export default function DashboardModule() {
  return (
    <div className="space-y-6 pb-10">
      {/* 1. TOP SUMMARY CARDS */}
      <Row gutter={[20, 20]}>
        {[
          { title: "Today's Sales", val: '₹12,450', grow: '+12%', icon: DollarSign, color: 'emerald' },
          { title: "Total Orders", val: '48', grow: '+5.2%', icon: ShoppingBag, color: 'blue' },
          { title: "Total Revenue", val: '₹8.42L', grow: '+15%', icon: Activity, color: 'indigo' },
          { title: "Avg. Basket Value", val: '₹450', grow: '-2%', icon: Users, color: 'amber' },
        ].map((s, i) => (
          <Col key={i} xs={24} sm={12} lg={6}>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className={`p-4 rounded-xl bg-${s.color}-50 text-${s.color}-600`}>
                <s.icon size={28} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <div className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.title}</div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-black text-slate-800 tracking-tight">{s.val}</div>
                  <div className={`flex items-center text-[10px] font-black px-1.5 py-0.5 rounded-full ${s.grow.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {s.grow.startsWith('+') ? <TrendingUp size={12} className="mr-0.5" /> : <TrendingDown size={12} className="mr-0.5" />}
                    {s.grow}
                  </div>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* 2. SALES CHART & PAYMENT SUMMARY */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <DashboardCard title="Sales Overview" extra={<Tag color="processing">LAST 7 DAYS</Tag>}>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <defs>
                    <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} 
                  />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', padding: '12px'}}
                  />
                  <Bar dataKey="sales" radius={[4, 4, 0, 0]} fill="url(#gradientBar)" barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </DashboardCard>
        </Col>
        <Col xs={24} lg={8}>
          <DashboardCard title="Payment Summary">
            <div className="space-y-6 mt-2">
              {paymentSummary.map((p, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <div className="flex items-center gap-2 font-bold text-slate-600">
                      <div className="p-1.5 rounded-md bg-slate-50 text-slate-500"><p.icon size={16} /></div>
                      {p.name}
                    </div>
                    <span className="font-extrabold text-slate-800">{p.value}%</span>
                  </div>
                  <Progress 
                    percent={p.value} 
                    showInfo={false} 
                    strokeColor={p.color} 
                    trailColor="#f1f5f9" 
                    strokeWidth={10} 
                    strokeLinecap="round"
                  />
                </div>
              ))}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-1">Transaction Health</div>
                <div className="flex justify-around items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                   <div className="text-center">
                      <div className="text-emerald-600 font-extrabold text-lg">99.8%</div>
                      <div className="text-[8px] text-slate-500 uppercase font-black">Success</div>
                   </div>
                   <div className="w-px h-8 bg-slate-200"></div>
                   <div className="text-center">
                      <div className="text-rose-500 font-extrabold text-lg">0.2%</div>
                      <div className="text-[8px] text-slate-500 uppercase font-black">Failed</div>
                   </div>
                </div>
              </div>
            </div>
          </DashboardCard>
        </Col>
      </Row>

      {/* 3. RECENT ACTIVITY & ALERTS */}
      <Row gutter={[20, 20]}>
        <Col xs={24} lg={14}>
          <DashboardCard title="Recent Transactions" extra={<button className="text-[10px] font-black text-emerald-600 uppercase hover:underline">Download Report</button>}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <tr>
                    <th className="px-4 py-3 border-b text-slate-800 border-slate-100">Order ID</th>
                    <th className="px-4 py-3 border-b border-slate-100">Method</th>
                    <th className="px-4 py-3 border-b border-slate-100">Status</th>
                    <th className="px-4 py-3 border-b border-slate-100 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="text-sm font-bold text-slate-700">{tx.id}</div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase">{tx.time}</div>
                      </td>
                      <td className="px-4 py-3 text-xs font-bold text-slate-500">{tx.method}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tight ${tx.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-black text-slate-800 text-right">{tx.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DashboardCard>
        </Col>
        
        <Col xs={24} lg={10}>
          <div className="space-y-[20px] h-full flex flex-col">
            <DashboardCard title="Low Stock Alerts" extra={<AlertTriangle size={16} className="text-amber-500" />}>
              <div className="space-y-3">
                {lowStockAlerts.map((item, i) => (
                  <div key={i} className="flex justify-between items-center bg-[#fff8eb] p-3 rounded-xl border border-amber-100/50 group hover:shadow-sm transition-all cursor-pointer">
                    <div>
                      <div className="text-xs font-black text-slate-700 uppercase tracking-tight group-hover:text-amber-700">{item.name}</div>
                      <div className="text-[9px] text-slate-400 font-bold mt-0.5">Threshold: {item.min} units</div>
                    </div>
                    <div className="text-right">
                      <div className="text-rose-600 font-extrabold text-sm">{item.stock}</div>
                      <div className="text-[8px] text-slate-400 uppercase font-black">Stock</div>
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>

            <DashboardCard title="Top Selling Products">
              <div className="space-y-4">
                {topSelling.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-[10px] font-black text-emerald-700">#{i+1}</div>
                    <div className="flex-1">
                      <div className="text-[11px] font-extrabold text-slate-700 leading-tight">{item.name}</div>
                      <div className="text-[9px] font-bold text-slate-400">{item.sales} units sold</div>
                    </div>
                    <div className="text-xs font-black text-emerald-600">{item.revenue}</div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </Col>
      </Row>
    </div>
  );
}
