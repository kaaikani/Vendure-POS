"use client";
import React, { useState, useEffect, Suspense } from 'react';
import { BarChart, BookOpen, Grid, Box, ShoppingBag, ScanLine, FileText, LogOut, Users, ShieldCheck, User, Plus, XCircle, Trash2, ToggleLeft, ToggleRight, Eye, EyeOff, KeyRound } from 'lucide-react';
import InventoryModule from './inventory-module';
import LedgerModule from './ledger-module';
import ProductsModule from './category-module';
import PosModule from './pos-module';
import BarcodeModule from './barcode-module';
import DashboardModule from './dashboard-module';
import ReportModule from './report-module';
import { PosListUsersQuery, PosCreateUserCommand, PosUpdateUserCommand, PosDeleteUserCommand } from '../../core/queries/auth.query';

// ── User Management Module ──
function UserManagementModule() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addOpen, setAddOpen] = useState(false);
    const [form, setForm] = useState({ username: '', password: '', displayName: '', role: 'user' });
    const [showPass, setShowPass] = useState(false);
    const [resetPassOpen, setResetPassOpen] = useState(null); // user id
    const [newPass, setNewPass] = useState('');

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const list = await new PosListUsersQuery().execute();
            setUsers(list);
        } catch (err) { console.error(err); }
        setLoading(false);
    };

    const handleCreate = async () => {
        if (!form.username.trim() || !form.password.trim()) return alert('Username and password required.');
        try {
            await new PosCreateUserCommand().execute({
                username: form.username.trim(),
                password: form.password,
                role: form.role,
                displayName: form.displayName.trim() || form.username.trim(),
            });
            setAddOpen(false);
            setForm({ username: '', password: '', displayName: '', role: 'user' });
            fetchUsers();
        } catch (err) { alert(err.message); }
    };

    const handleToggleActive = async (u) => {
        if (u.role === 'admin') return;
        try {
            await new PosUpdateUserCommand().execute(u.id, { active: !u.active });
            fetchUsers();
        } catch (err) { alert(err.message); }
    };

    const handleDelete = async (u) => {
        if (u.role === 'admin') return;
        if (!confirm(`Delete user "${u.username}"?`)) return;
        try {
            await new PosDeleteUserCommand().execute(u.id);
            fetchUsers();
        } catch (err) { alert(err.message); }
    };

    const handleResetPassword = async () => {
        if (!newPass.trim()) return alert('Enter new password.');
        try {
            await new PosUpdateUserCommand().execute(resetPassOpen, { password: newPass });
            setResetPassOpen(null);
            setNewPass('');
            alert('Password reset successfully.');
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="flex flex-col h-[85vh] text-slate-800 bg-slate-50 w-full rounded-2xl overflow-hidden font-sans border border-slate-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-5 shrink-0 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-white tracking-wide flex items-center gap-2"><Users size={22}/> User Management</h1>
                    <p className="text-slate-400 text-xs font-bold mt-1">Create and manage POS users</p>
                </div>
                <button onClick={() => { setForm({ username: '', password: '', displayName: '', role: 'user' }); setAddOpen(true); }} className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl font-black text-sm uppercase tracking-widest transition shadow-lg shadow-teal-500/30 active:scale-95">
                    <Plus size={18}/> Create User
                </button>
            </div>

            {/* Users Table */}
            <div className="flex-1 overflow-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#f8fafc] border-b border-slate-200">
                                <tr>
                                    <th className="p-4 px-6 text-xs uppercase font-black tracking-widest text-slate-400">User</th>
                                    <th className="p-4 text-xs uppercase font-black tracking-widest text-slate-400">Role</th>
                                    <th className="p-4 text-xs uppercase font-black tracking-widest text-slate-400">Status</th>
                                    <th className="p-4 text-xs uppercase font-black tracking-widest text-slate-400">Created</th>
                                    <th className="p-4 text-center text-xs uppercase font-black tracking-widest text-slate-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-slate-50 transition">
                                        <td className="p-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm ${u.role === 'admin' ? 'bg-gradient-to-br from-teal-500 to-teal-600' : 'bg-gradient-to-br from-emerald-500 to-emerald-600'}`}>
                                                    {u.role === 'admin' ? <ShieldCheck size={18}/> : <User size={18}/>}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800">{u.displayName}</p>
                                                    <p className="text-[10px] font-bold text-slate-400">@{u.username}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${u.role === 'admin' ? 'bg-teal-50 text-teal-700 border-teal-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {u.active ? (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase border border-emerald-200">Active</span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-black uppercase border border-red-200">Disabled</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-slate-500 font-bold">
                                            {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="p-4">
                                            {u.role !== 'admin' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => { setResetPassOpen(u.id); setNewPass(''); }} className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition" title="Reset Password"><KeyRound size={16}/></button>
                                                    <button onClick={() => handleToggleActive(u)} className="p-2 rounded-lg bg-slate-100 hover:bg-amber-50 text-slate-500 hover:text-amber-600 transition" title={u.active ? 'Disable' : 'Enable'}>
                                                        {u.active ? <ToggleRight size={16}/> : <ToggleLeft size={16}/>}
                                                    </button>
                                                    <button onClick={() => handleDelete(u)} className="p-2 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition" title="Delete"><Trash2 size={16}/></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center">
                                                    <button onClick={() => { setResetPassOpen(u.id); setNewPass(''); }} className="p-2 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition" title="Reset Password"><KeyRound size={16}/></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create User Modal */}
            {addOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white max-w-md w-full rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-center text-white relative">
                            <button onClick={() => setAddOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><XCircle size={22}/></button>
                            <div className="inline-flex p-3 rounded-full bg-teal-500/20 mb-3"><Users size={24} className="text-teal-400"/></div>
                            <h2 className="text-lg font-black uppercase tracking-widest text-teal-400">Create User</h2>
                        </div>
                        <div className="p-6 bg-slate-50 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Display Name</label>
                                <input type="text" value={form.displayName} onChange={e => setForm({...form, displayName: e.target.value})} placeholder="e.g., Ravi Kumar" className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Username *</label>
                                <input type="text" value={form.username} onChange={e => setForm({...form, username: e.target.value})} placeholder="e.g., ravi" className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"/>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Password *</label>
                                <div className="relative">
                                    <input type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 4 characters" className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white pr-10"/>
                                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPass ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">Role</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={() => setForm({...form, role: 'user'})} className={`p-3 rounded-xl border-2 text-sm font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${form.role === 'user' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                                        <User size={16}/> User
                                    </button>
                                    <button type="button" onClick={() => setForm({...form, role: 'admin'})} className={`p-3 rounded-xl border-2 text-sm font-black uppercase tracking-wider transition flex items-center justify-center gap-2 ${form.role === 'admin' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-400'}`}>
                                        <ShieldCheck size={16}/> Admin
                                    </button>
                                </div>
                            </div>
                            <button onClick={handleCreate} className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-xl font-black uppercase tracking-widest text-sm transition shadow-lg shadow-teal-500/30 active:scale-[0.98]">
                                Create User
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {resetPassOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white max-w-sm w-full rounded-2xl shadow-2xl overflow-hidden">
                        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-center text-white relative">
                            <button onClick={() => setResetPassOpen(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white transition"><XCircle size={22}/></button>
                            <KeyRound size={24} className="text-teal-400 mx-auto mb-2"/>
                            <h2 className="text-lg font-black uppercase tracking-widest text-teal-400">Reset Password</h2>
                        </div>
                        <div className="p-6 bg-slate-50 space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">New Password</label>
                                <input type="text" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="Enter new password" className="w-full border border-slate-300 rounded-xl p-3 text-sm font-bold outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 bg-white"/>
                            </div>
                            <button onClick={handleResetPassword} className="w-full py-3 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-xl font-black uppercase tracking-widest text-sm transition active:scale-[0.98]">
                                Reset Password
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ── MAIN DASHBOARD ──
export default function VendureDashboard() {
    const [session, setSession] = useState(null);
    const [checking, setChecking] = useState(true);
    const [activeTab, setActiveTab] = useState(null);

    // Auth guard: check session on mount
    useEffect(() => {
        const raw = localStorage.getItem('pos_session');
        if (!raw) {
            window.location.href = '/login';
            return;
        }
        try {
            const s = JSON.parse(raw);
            if (!s.token || !s.role) {
                window.location.href = '/login';
                return;
            }
            setSession(s);
            // Set default tab based on role
            setActiveTab(s.role === 'admin' ? 'pos' : 'pos');
            setChecking(false);
        } catch {
            window.location.href = '/login';
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('pos_session');
        window.location.href = '/login';
    };

    if (checking || !session) {
        return <div className="flex items-center justify-center h-screen bg-slate-100 text-slate-400 font-bold">Loading...</div>;
    }

    const isAdmin = session.role === 'admin';

    // Menu items based on role
    const adminMenuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart },
        { id: 'ledger', label: 'Ledger', icon: BookOpen },
        { id: 'category', label: 'Products', icon: Grid },
        { id: 'inventory', label: 'Inventory', icon: Box },
        { id: 'pos', label: 'Retail POS Terminal', icon: ShoppingBag },
        { id: 'barcode', label: 'Barcode', icon: ScanLine },
        { id: 'report', label: 'Report', icon: FileText },
        { id: 'users', label: 'User Management', icon: Users },
    ];

    const menuItems = isAdmin ? adminMenuItems : [];

    const renderContent = () => {
        const content = (() => {
            switch (activeTab) {
                case 'inventory': return isAdmin ? <InventoryModule /> : null;
                case 'pos': return <PosModule />;
                case 'dashboard': return isAdmin ? <DashboardModule /> : null;
                case 'ledger': return isAdmin ? <LedgerModule /> : null;
                case 'category': return isAdmin ? <ProductsModule /> : null;
                case 'barcode': return isAdmin ? <BarcodeModule /> : null;
                case 'report': return isAdmin ? <ReportModule /> : null;
                case 'users': return isAdmin ? <UserManagementModule /> : null;
                default: return null;
            }
        })();
        return <Suspense fallback={<div className="flex items-center justify-center h-[80vh] text-slate-400">Loading...</div>}>{content}</Suspense>;
    };

    // ── USER ROLE: POS Only (no sidebar) ──
    if (!isAdmin) {
        return (
            <div className="flex flex-col h-screen bg-slate-100 font-sans">
                {/* Minimal top bar */}
                <div className="h-14 bg-slate-900 flex items-center justify-between px-6 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-yellow-500 text-2xl font-black">#</span>
                        <span className="text-lg font-black text-white tracking-widest">HASHTAG</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest ml-2">POS Terminal</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                                <User size={16} className="text-white"/>
                            </div>
                            <span className="text-white text-sm font-bold">{session.displayName}</span>
                        </div>
                        <button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-lg text-xs font-bold uppercase tracking-widest transition">
                            <LogOut size={14}/> Logout
                        </button>
                    </div>
                </div>
                {/* POS Module Full Screen */}
                <main className="flex-1 overflow-hidden p-4">
                    <PosModule />
                </main>
            </div>
        );
    }

    // ── ADMIN ROLE: Full sidebar ──
    return (<div className="flex h-screen bg-slate-100 font-sans">
      <aside className="w-64 bg-slate-900 flex flex-col text-slate-300 shadow-xl z-20 flex-shrink-0">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 font-black text-xl text-white tracking-widest">
              <span className="text-yellow-500 text-3xl">#</span> HASHTAG
            </div>
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Billing Solutions</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {menuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center py-3 px-4 rounded-xl text-sm font-bold transition-all ${isActive
                    ? 'bg-emerald-600 text-white shadow-md transform scale-[1.02]'
                    : 'hover:bg-slate-800 hover:text-white text-slate-400'}`}>
                <Icon className={`mr-4 h-5 w-5 ${isActive ? 'text-white' : 'text-slate-500'}`}/>
                {item.label}
              </button>);
          })}
        </nav>

        {/* User info + logout at bottom */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <ShieldCheck size={18} className="text-white"/>
            </div>
            <div>
              <p className="text-white text-sm font-bold">{session.displayName}</p>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{session.role}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white rounded-xl text-xs font-bold uppercase tracking-widest transition">
            <LogOut size={14}/> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden relative w-full bg-slate-100">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative">
          {renderContent()}
        </main>
      </div>
    </div>);
}
