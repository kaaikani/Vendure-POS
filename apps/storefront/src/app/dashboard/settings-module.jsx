"use client";
import React, { useState, useEffect } from 'react';
import { Building2, Edit3, CheckCircle, UserPlus, Database, KeyRound, Settings as SettingsIcon, ScanLine, Printer, X, Save, Download, Minus, Square, Eye, EyeOff, ShieldCheck, User as UserIcon, Trash2, ToggleLeft, ToggleRight, Lock, RefreshCw } from 'lucide-react';
import { PosListUsersQuery, PosCreateUserCommand, PosUpdateUserCommand, PosDeleteUserCommand, ListRolesQuery, GetRoleQuery, UpdateRolePermissionsCommand } from '../../core/queries/auth.query';

const PERMISSION_LIST = [
    'Authenticated', 'SuperAdmin', 'Owner', 'Public',
    'CreateAdministrator', 'ReadAdministrator', 'UpdateAdministrator', 'DeleteAdministrator',
    'CreateCatalog', 'ReadCatalog', 'UpdateCatalog', 'DeleteCatalog',
    'CreateSettings', 'ReadSettings', 'UpdateSettings', 'DeleteSettings',
    'CreateCustomer', 'ReadCustomer', 'UpdateCustomer', 'DeleteCustomer',
    'CreateCustomerGroup', 'ReadCustomerGroup', 'UpdateCustomerGroup', 'DeleteCustomerGroup',
    'CreateFacet', 'ReadFacet', 'UpdateFacet', 'DeleteFacet',
    'CreateOrder', 'ReadOrder', 'UpdateOrder', 'DeleteOrder',
    'CreatePaymentMethod', 'ReadPaymentMethod', 'UpdatePaymentMethod', 'DeletePaymentMethod',
    'CreatePromotion', 'ReadPromotion', 'UpdatePromotion', 'DeletePromotion',
    'CreateShippingMethod', 'ReadShippingMethod', 'UpdateShippingMethod', 'DeleteShippingMethod',
    'CreateTag', 'ReadTag', 'UpdateTag', 'DeleteTag',
    'CreateTaxCategory', 'ReadTaxCategory', 'UpdateTaxCategory', 'DeleteTaxCategory',
    'CreateTaxRate', 'ReadTaxRate', 'UpdateTaxRate', 'DeleteTaxRate',
    'CreateSeller', 'ReadSeller', 'UpdateSeller', 'DeleteSeller',
    'CreateChannel', 'ReadChannel', 'UpdateChannel', 'DeleteChannel',
    'CreateStockLocation', 'ReadStockLocation', 'UpdateStockLocation', 'DeleteStockLocation',
    'CreateSystem', 'ReadSystem', 'UpdateSystem', 'DeleteSystem',
    'CreateZone', 'ReadZone', 'UpdateZone', 'DeleteZone',
    'CreateAsset', 'ReadAsset', 'UpdateAsset', 'DeleteAsset',
    'CreateCollection', 'ReadCollection', 'UpdateCollection', 'DeleteCollection',
    'CreateCountry', 'ReadCountry', 'UpdateCountry', 'DeleteCountry',
    'CreateProduct', 'ReadProduct', 'UpdateProduct', 'DeleteProduct',
];

const COMPANY_KEY = 'pharma_companies';
const ACTIVE_COMPANY_KEY = 'pharma_active_company';
const CONFIG_KEY = 'pharma_config';
const PRINT_SETTINGS_KEY = 'pharma_print_settings';

function loadCompanies() { try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || '[]'); } catch { return []; } }
function saveCompanies(list) { localStorage.setItem(COMPANY_KEY, JSON.stringify(list)); }
function loadActiveCompany() { return localStorage.getItem(ACTIVE_COMPANY_KEY) || ''; }
function loadConfig() { try { return JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}'); } catch { return {}; } }
function savePrintSettings(cfg) { localStorage.setItem(PRINT_SETTINGS_KEY, JSON.stringify(cfg)); }
function loadPrintSettings() { try { return JSON.parse(localStorage.getItem(PRINT_SETTINGS_KEY) || '{}'); } catch { return {}; } }

export default function SettingsModule({ section = 'company-creation', onChangeSection }) {
    const [companies, setCompanies] = useState([]);
    const [activeCompanyId, setActiveCompanyId] = useState('');

    // Company form
    const [form, setForm] = useState({ name: '', gst: '', phone: '', email: '', address: '', state: '', pincode: '', financialYear: '2026-2027' });
    const [editingId, setEditingId] = useState(null);

    // Change password
    const [oldPass, setOldPass] = useState('');
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');

    // Config
    const [config, setConfig] = useState({
        defaultGstPct: '5', currency: 'INR', dateFormat: 'DD-MM-YYYY', decimalPlaces: '2',
        lowStockAlert: '10', expiryAlertDays: '90', enableBarcode: true, enableSMS: false,
    });

    // Print settings
    const [printCfg, setPrintCfg] = useState({
        billFormat: 'Thermal 50mm', showGSTBreakup: true, showCompanyLogo: true,
        footerMessage: 'Thank You! Visit Again', printerName: 'Default', copies: '1',
    });

    // Barcode design
    const [barcodeCfg, setBarcodeCfg] = useState({
        format: 'CODE128', width: '2', height: '60', showText: true, fontSize: '12',
    });

    // User Creation state
    const [users, setUsers] = useState([]);
    const [userForm, setUserForm] = useState({ username: '', password: '', displayName: '', role: 'user' });
    const [showUserPass, setShowUserPass] = useState(false);
    const [userLoading, setUserLoading] = useState(false);

    // Role & Permissions state
    const [roles, setRoles] = useState([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [rolesError, setRolesError] = useState('');
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [selectedRolePerms, setSelectedRolePerms] = useState([]);
    const [selectedRoleCode, setSelectedRoleCode] = useState('');
    const [selectedRoleDesc, setSelectedRoleDesc] = useState('');
    const [roleSaving, setRoleSaving] = useState(false);

    // Load users when user-creation section is active
    useEffect(() => {
        if (section === 'user-creation') fetchUsers();
        if (section === 'role-permissions') fetchRoles();
    }, [section]);

    // ── Role & Permissions ──
    const fetchRoles = async () => {
        setRolesLoading(true); setRolesError('');
        try {
            const list = await new ListRolesQuery().execute();
            setRoles(Array.isArray(list) ? list : []);
            if (list.length === 0) setRolesError('No roles found. Create one in Vendure dashboard.');
        } catch (e) { setRolesError(e.message || 'Failed to load roles.'); setRoles([]); }
        setRolesLoading(false);
    };

    const selectRole = async (r) => {
        setSelectedRoleId(r.id); setSelectedRoleCode(r.code);
        setSelectedRoleDesc(r.description || ''); setSelectedRolePerms(r.permissions || []);
    };

    const togglePerm = (perm) => {
        setSelectedRolePerms(prev => prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]);
    };

    const handleSaveRolePerms = async () => {
        if (!selectedRoleId) return;
        setRoleSaving(true);
        try {
            await new UpdateRolePermissionsCommand().execute(selectedRoleId, selectedRolePerms, selectedRoleDesc);
            await fetchRoles();
            alert(`Permissions for role "${selectedRoleCode}" updated.`);
        } catch (e) { alert(e.message); }
        setRoleSaving(false);
    };

    const fetchUsers = async () => {
        setUserLoading(true);
        try { const list = await new PosListUsersQuery().execute(); setUsers(list); } catch (e) { console.error(e); }
        setUserLoading(false);
    };

    const handleCreateUser = async () => {
        if (!userForm.username.trim() || !userForm.password.trim()) return alert('Username and password are required.');
        if (userForm.password.length < 4) return alert('Password must be at least 4 characters.');
        try {
            await new PosCreateUserCommand().execute({
                username: userForm.username.trim(),
                password: userForm.password,
                role: userForm.role,
                displayName: userForm.displayName.trim() || userForm.username.trim(),
            });
            setUserForm({ username: '', password: '', displayName: '', role: 'user' });
            await fetchUsers();
            alert(`User "${userForm.username}" created successfully.`);
        } catch (err) { alert(err.message); }
    };

    const handleToggleUserActive = async (u) => {
        if (u.role === 'admin') return alert('Cannot disable admin account.');
        try { await new PosUpdateUserCommand().execute(u.id, { active: !u.active }); await fetchUsers(); }
        catch (err) { alert(err.message); }
    };

    const handleDeleteUser = async (u) => {
        if (u.role === 'admin') return alert('Cannot delete admin account.');
        if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
        try { await new PosDeleteUserCommand().execute(u.id); await fetchUsers(); }
        catch (err) { alert(err.message); }
    };

    useEffect(() => {
        setCompanies(loadCompanies());
        setActiveCompanyId(loadActiveCompany());
        setConfig(prev => ({ ...prev, ...loadConfig() }));
        setPrintCfg(prev => ({ ...prev, ...loadPrintSettings() }));
    }, []);

    // ── Company Creation ──
    const handleCompanyCreate = () => {
        if (!form.name.trim()) return alert('Company name is required.');
        const newCompany = { ...form, id: 'COM-' + Date.now(), createdAt: new Date().toISOString() };
        const updated = [...companies, newCompany];
        setCompanies(updated); saveCompanies(updated);
        setForm({ name: '', gst: '', phone: '', email: '', address: '', state: '', pincode: '', financialYear: '2026-2027' });
        alert(`Company "${newCompany.name}" created.`);
    };

    // ── Company Updation ──
    const handleCompanyUpdate = () => {
        if (!editingId) return alert('Select a company to update.');
        const updated = companies.map(c => c.id === editingId ? { ...c, ...form } : c);
        setCompanies(updated); saveCompanies(updated);
        alert(`Company updated successfully.`);
    };

    const loadCompanyToForm = (c) => { setEditingId(c.id); setForm({ ...c }); };

    // ── Company Selection ──
    const handleSelectCompany = (id) => {
        setActiveCompanyId(id);
        localStorage.setItem(ACTIVE_COMPANY_KEY, id);
        const c = companies.find(c => c.id === id);
        alert(`Active company: ${c?.name}`);
    };

    // ── Change Password ──
    const handleChangePassword = () => {
        if (!oldPass || !newPass || !confirmPass) return alert('All fields required.');
        if (newPass !== confirmPass) return alert('Passwords do not match.');
        if (newPass.length < 4) return alert('Password must be at least 4 characters.');
        alert(`Password changed successfully. (In production, this calls the posUpdateUser mutation with new password)`);
        setOldPass(''); setNewPass(''); setConfirmPass('');
    };

    // ── Database Backup ──
    const handleBackup = () => {
        const data = {};
        ['pharma_companies', 'pharma_items', 'pharma_purchases', 'pharma_payments', 'pharma_receipts', 'pharma_tokens', 'pos_reports', 'supplier_registry', 'pharma_config', 'pharma_print_settings'].forEach(key => {
            try { data[key] = JSON.parse(localStorage.getItem(key) || 'null'); } catch { data[key] = null; }
        });
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `pharma-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        alert('Backup file downloaded.');
    };

    const handleRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!confirm('Restore will OVERWRITE current data. Continue?')) return;
        const text = await file.text();
        try {
            const data = JSON.parse(text);
            Object.entries(data).forEach(([k, v]) => { if (v !== null) localStorage.setItem(k, JSON.stringify(v)); });
            alert('Restored successfully. Refresh the app.');
        } catch { alert('Invalid backup file.'); }
    };

    // ── Config Settings ──
    const handleSaveConfig = () => {
        localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
        alert('Configuration saved.');
    };

    // ── Print Settings ──
    const handleSavePrintSettings = () => {
        savePrintSettings(printCfg);
        alert('Print settings saved.');
    };

    // ── Barcode Design ──
    const handleSaveBarcodeCfg = () => {
        localStorage.setItem('pharma_barcode_cfg', JSON.stringify(barcodeCfg));
        alert('Barcode design saved.');
    };

    const inp = "bg-white border border-[#7a9ca8] h-7 px-2 text-[12px] font-bold text-slate-900 outline-none focus:border-[#1a5276] focus:bg-yellow-50";
    const lbl = "text-[12px] font-bold text-slate-900";

    const sections = [
        { id: 'company', label: 'Company', icon: Building2 },
        { id: 'user-creation', label: 'User Creation', icon: UserPlus },
        { id: 'barcode-design', label: 'Barcode Design', icon: ScanLine },
    ];

    // ── Delete a company ──
    const handleCompanyDelete = (id) => {
        const c = companies.find(x => x.id === id);
        if (!c) return;
        if (!confirm(`Delete company "${c.name}"? This cannot be undone.`)) return;
        const updated = companies.filter(x => x.id !== id);
        setCompanies(updated); saveCompanies(updated);
        if (activeCompanyId === id) {
            setActiveCompanyId('');
            localStorage.removeItem(ACTIVE_COMPANY_KEY);
        }
        if (editingId === id) {
            setEditingId(null);
            setForm({ name: '', gst: '', phone: '', email: '', address: '', state: '', pincode: '', financialYear: '2026-2027' });
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setForm({ name: '', gst: '', phone: '', email: '', address: '', state: '', pincode: '', financialYear: '2026-2027' });
    };

    return (<div className="flex flex-col h-[85vh] rounded-md overflow-hidden font-sans shadow-xl border border-slate-400" style={{background:'#eaf2f8'}}>
        {/* Title bar */}
        <div className="h-[24px] flex items-center justify-between px-2 shrink-0 bg-gradient-to-r from-[#1a5276] to-[#2980b9]">
            <span className="text-white text-[12px] font-bold">Settings - AVS ECOM PRIVATE LIMITED 2026-2027</span>
            <div className="flex items-center gap-0">
                <button className="w-5 h-[20px] text-white hover:bg-slate-600 flex items-center justify-center"><Minus size={11}/></button>
                <button className="w-5 h-[20px] text-white hover:bg-slate-600 flex items-center justify-center"><Square size={9}/></button>
                <button className="w-5 h-[20px] text-white hover:bg-red-500 flex items-center justify-center"><X size={12}/></button>
            </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
            {/* Left sidebar menu */}
            <div className="w-[220px] bg-white border-r border-[#7a9ca8] overflow-y-auto shrink-0">
                <div className="bg-[#1a5276] text-white py-2 px-3 text-[11px] font-black uppercase tracking-wider">Settings Menu</div>
                {sections.map(s => {
                    const Icon = s.icon;
                    const active = section === s.id;
                    return (<button key={s.id} onClick={() => onChangeSection?.(s.id)} className={`w-full flex items-center gap-2 px-3 py-2 text-left border-b border-[#e0e6ec] transition text-[12px] font-bold ${active ? 'bg-[#2980b9] text-white' : 'text-slate-900 hover:bg-[#eaf3f8]'}`}>
                        <Icon size={14} className={active ? 'text-white' : 'text-[#2980b9]'}/>
                        {s.label}
                    </button>);
                })}
            </div>

            {/* Content area */}
            <div className="flex-1 p-6 overflow-auto bg-[#eaf2f8]">

                {/* ═══ COMPANY MANAGEMENT ═══ */}
                {section === 'company' && (<div>
                    <h2 className="text-lg font-black text-[#1a5276] mb-4 flex items-center gap-2"><Building2 size={18}/> Company Management</h2>
                    <div className="grid grid-cols-[420px_1fr] gap-4">

                        {/* Form */}
                        <div className="bg-white border border-[#7a9ca8] p-5 space-y-3 self-start">
                            <h3 className="text-[13px] font-black text-slate-900 mb-2 flex items-center gap-1 border-b border-[#c0d0d8] pb-2">
                                {editingId ? <><Edit3 size={14} className="text-orange-600"/> Update Company</> : <><Building2 size={14} className="text-[#2980b9]"/> New Company</>}
                            </h3>

                            <div>
                                <label className={`${lbl} block mb-1`}>Company Name *</label>
                                <input type="text" value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="e.g., Karthi Supermarket" className={`${inp} w-full`}/>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={`${lbl} block mb-1`}>GST Number</label>
                                    <input type="text" value={form.gst} onChange={e=>setForm({...form, gst: e.target.value.toUpperCase()})} placeholder="33XXXXX1234X1Z1" maxLength={15} className={`${inp} w-full`}/>
                                </div>
                                <div>
                                    <label className={`${lbl} block mb-1`}>Phone</label>
                                    <input type="tel" value={form.phone} onChange={e=>setForm({...form, phone: e.target.value})} placeholder="9876543210" className={`${inp} w-full`}/>
                                </div>
                            </div>
                            <div>
                                <label className={`${lbl} block mb-1`}>Email</label>
                                <input type="email" value={form.email} onChange={e=>setForm({...form, email: e.target.value})} placeholder="info@company.com" className={`${inp} w-full`}/>
                            </div>
                            <div>
                                <label className={`${lbl} block mb-1`}>Address</label>
                                <textarea value={form.address} onChange={e=>setForm({...form, address: e.target.value})} placeholder="Street, City" rows={2} className={`${inp} w-full resize-none py-1`}/>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className={`${lbl} block mb-1`}>State</label>
                                    <input type="text" value={form.state} onChange={e=>setForm({...form, state: e.target.value})} placeholder="Tamil Nadu" className={`${inp} w-full`}/>
                                </div>
                                <div>
                                    <label className={`${lbl} block mb-1`}>Pincode</label>
                                    <input type="text" value={form.pincode} onChange={e=>setForm({...form, pincode: e.target.value})} placeholder="600001" className={`${inp} w-full`}/>
                                </div>
                            </div>
                            <div>
                                <label className={`${lbl} block mb-1`}>Financial Year</label>
                                <input type="text" value={form.financialYear} onChange={e=>setForm({...form, financialYear: e.target.value})} placeholder="2026-2027" className={`${inp} w-full`}/>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-[#c0d0d8]">
                                {editingId ? (
                                    <>
                                        <button onClick={handleCompanyUpdate} className="flex-1 px-3 py-2 bg-orange-600 hover:bg-orange-500 text-white font-black text-[12px] uppercase tracking-wider flex items-center justify-center gap-1"><Save size={13}/> Update</button>
                                        <button onClick={resetForm} className="px-3 py-2 bg-slate-300 hover:bg-slate-400 text-slate-900 font-black text-[12px] uppercase">Cancel</button>
                                    </>
                                ) : (
                                    <button onClick={handleCompanyCreate} className="flex-1 px-3 py-2 bg-[#2980b9] hover:bg-[#1a5276] text-white font-black text-[12px] uppercase tracking-wider flex items-center justify-center gap-1"><Save size={13}/> Save Company</button>
                                )}
                            </div>
                        </div>

                        {/* List */}
                        <div className="bg-white border border-[#7a9ca8] overflow-hidden self-start">
                            <div className="bg-[#1a5276] text-white py-2 px-3 text-[11px] font-black uppercase tracking-wider flex items-center justify-between">
                                <span>Saved Companies ({companies.length})</span>
                                <span className="text-[10px] text-cyan-200">⭐ = Active (shown in header)</span>
                            </div>
                            {companies.length === 0 ? (
                                <div className="p-10 text-center text-slate-700 font-bold text-sm">No companies yet. Create one on the left.</div>
                            ) : (
                                <table className="w-full text-[11px]">
                                    <thead className="bg-[#d4e6f1]">
                                        <tr>
                                            <th className="py-1.5 px-2 text-left font-black text-slate-900 w-8"></th>
                                            <th className="py-1.5 px-2 text-left font-black text-slate-900">Name</th>
                                            <th className="py-1.5 px-2 text-left font-black text-slate-900">GST</th>
                                            <th className="py-1.5 px-2 text-left font-black text-slate-900">Phone</th>
                                            <th className="py-1.5 px-2 text-center font-black text-slate-900 w-32">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {companies.map(c => (
                                            <tr key={c.id} className={`border-b border-slate-200 ${activeCompanyId === c.id ? 'bg-yellow-50' : 'hover:bg-blue-50'}`}>
                                                <td className="py-1.5 px-2 text-center">
                                                    {activeCompanyId === c.id ? <span className="text-orange-500 text-lg">⭐</span> : <span className="text-slate-300">☆</span>}
                                                </td>
                                                <td className="py-1.5 px-2 font-black text-slate-900">{c.name}</td>
                                                <td className="py-1.5 px-2 font-bold text-slate-700">{c.gst || '—'}</td>
                                                <td className="py-1.5 px-2 font-bold text-slate-700">{c.phone || '—'}</td>
                                                <td className="py-1.5 px-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {activeCompanyId !== c.id && (
                                                            <button onClick={() => handleSelectCompany(c.id)} title="Set as active" className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px]">Set Active</button>
                                                        )}
                                                        <button onClick={() => loadCompanyToForm(c)} title="Edit" className="p-1 bg-slate-200 hover:bg-orange-200 text-slate-800"><Edit3 size={12}/></button>
                                                        <button onClick={() => handleCompanyDelete(c.id)} title="Delete" className="p-1 bg-slate-200 hover:bg-red-300 text-slate-800"><Trash2 size={12}/></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>)}

                {/* USER CREATION */}
                {section === 'user-creation' && (<div>
                    <h2 className="text-lg font-black text-[#1a5276] mb-4 flex items-center gap-2"><UserPlus size={18}/> User Creation</h2>

                    <div className="grid grid-cols-[420px_1fr] gap-4">

                        {/* Create User Form */}
                        <div className="bg-white border border-[#7a9ca8] p-5 space-y-3 self-start">
                            <h3 className="text-[13px] font-black text-slate-900 mb-2 flex items-center gap-1 border-b border-[#c0d0d8] pb-2"><UserPlus size={14} className="text-[#2980b9]"/> New User</h3>

                            <div>
                                <label className={`${lbl} block mb-1`}>Display Name</label>
                                <input type="text" value={userForm.displayName} onChange={e=>setUserForm({...userForm, displayName: e.target.value})} placeholder="e.g., Ravi Kumar" className={`${inp} w-full`}/>
                            </div>
                            <div>
                                <label className={`${lbl} block mb-1`}>Username <span className="text-red-500">*</span></label>
                                <input type="text" value={userForm.username} onChange={e=>setUserForm({...userForm, username: e.target.value})} placeholder="e.g., ravi" className={`${inp} w-full`}/>
                            </div>
                            <div>
                                <label className={`${lbl} block mb-1`}>Password <span className="text-red-500">*</span></label>
                                <div className="relative">
                                    <input type={showUserPass ? 'text' : 'password'} value={userForm.password} onChange={e=>setUserForm({...userForm, password: e.target.value})} placeholder="Min 4 characters" className={`${inp} w-full pr-8`}/>
                                    <button type="button" onClick={()=>setShowUserPass(!showUserPass)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-900">
                                        {showUserPass ? <EyeOff size={14}/> : <Eye size={14}/>}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className={`${lbl} block mb-1`}>Role</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button type="button" onClick={()=>setUserForm({...userForm, role: 'user'})} className={`p-2 border-2 text-[12px] font-black uppercase flex items-center justify-center gap-2 transition ${userForm.role === 'user' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-white text-slate-700'}`}>
                                        <UserIcon size={14}/> User
                                    </button>
                                    <button type="button" onClick={()=>setUserForm({...userForm, role: 'admin'})} className={`p-2 border-2 text-[12px] font-black uppercase flex items-center justify-center gap-2 transition ${userForm.role === 'admin' ? 'border-[#2980b9] bg-[#eaf3f8] text-[#1a5276]' : 'border-slate-300 bg-white text-slate-700'}`}>
                                        <ShieldCheck size={14}/> Admin
                                    </button>
                                </div>
                                <p className="text-[10px] text-slate-700 font-bold mt-1">
                                    {userForm.role === 'admin' ? '👑 Admin: Full access to all modules' : '👤 User: Retail POS / Billing only'}
                                </p>
                            </div>
                            <div className="pt-3 border-t border-[#c0d0d8]">
                                <button onClick={handleCreateUser} className="w-full bg-[#2980b9] hover:bg-[#1a5276] text-white font-black py-2 text-[13px] border border-[#1a5276] flex items-center justify-center gap-2"><Save size={14}/> Create User</button>
                            </div>
                        </div>

                        {/* Existing Users List */}
                        <div className="bg-white border border-[#7a9ca8] overflow-hidden">
                            <div className="bg-[#1a5276] text-white px-3 py-2 text-[11px] font-black uppercase tracking-wider flex items-center justify-between">
                                <span>Existing Users ({users.length})</span>
                                <button onClick={fetchUsers} className="text-[10px] bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded">Refresh</button>
                            </div>
                            {userLoading ? (
                                <div className="p-6 text-center text-slate-700 font-bold text-[12px]">Loading...</div>
                            ) : users.length === 0 ? (
                                <div className="p-6 text-center text-slate-700 font-bold text-[12px]">No users yet.</div>
                            ) : (
                                <table className="w-full text-[12px] border-collapse">
                                    <thead className="bg-[#eaf3f8]">
                                        <tr>
                                            <th className="py-1.5 px-2 text-left border-b border-[#aec6d6] font-black text-slate-900">User</th>
                                            <th className="py-1.5 px-2 text-left border-b border-[#aec6d6] font-black text-slate-900 w-20">Role</th>
                                            <th className="py-1.5 px-2 text-left border-b border-[#aec6d6] font-black text-slate-900 w-20">Status</th>
                                            <th className="py-1.5 px-2 text-center border-b border-[#aec6d6] font-black text-slate-900 w-24">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map(u => (<tr key={u.id} className="border-b border-[#e0e6ec] hover:bg-[#eaf3f8]">
                                            <td className="py-1.5 px-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-7 h-7 rounded flex items-center justify-center font-black text-white text-[10px] ${u.role === 'admin' ? 'bg-[#2980b9]' : 'bg-emerald-600'}`}>
                                                        {u.role === 'admin' ? <ShieldCheck size={12}/> : <UserIcon size={12}/>}
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-slate-900">{u.displayName || u.username}</div>
                                                        <div className="text-[10px] text-slate-700 font-bold">@{u.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${u.role === 'admin' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-emerald-50 text-emerald-700 border-emerald-300'}`}>{u.role}</span>
                                            </td>
                                            <td className="py-1.5 px-2">
                                                {u.active ? <span className="text-emerald-700 font-black text-[11px]">● Active</span> : <span className="text-red-700 font-black text-[11px]">● Disabled</span>}
                                            </td>
                                            <td className="py-1.5 px-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    {u.role !== 'admin' && (<>
                                                        <button onClick={()=>handleToggleUserActive(u)} className="p-1 bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-700 rounded" title={u.active ? 'Disable' : 'Enable'}>
                                                            {u.active ? <ToggleRight size={14}/> : <ToggleLeft size={14}/>}
                                                        </button>
                                                        <button onClick={()=>handleDeleteUser(u)} className="p-1 bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 rounded" title="Delete">
                                                            <Trash2 size={14}/>
                                                        </button>
                                                    </>)}
                                                    {u.role === 'admin' && <span className="text-[10px] text-slate-700 font-bold italic">protected</span>}
                                                </div>
                                            </td>
                                        </tr>))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    <div className="mt-3 p-2 bg-blue-50 border border-blue-200 text-[11px] font-bold text-blue-900 max-w-4xl">
                        💡 GraphQL API: <code className="bg-white px-1">createPosUser</code> · <code className="bg-white px-1">posUpdateUser</code> · <code className="bg-white px-1">posDeleteUser</code> · <code className="bg-white px-1">posUsers</code>
                    </div>
                </div>)}

                {/* BARCODE DESIGN */}
                {section === 'barcode-design' && (<div>
                    <h2 className="text-lg font-black text-[#1a5276] mb-4 flex items-center gap-2"><ScanLine size={18}/> Barcode Design</h2>
                    <div className="bg-white border border-[#7a9ca8] p-5 max-w-2xl space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div><label className={`${lbl} block mb-1`}>Barcode Format</label><select value={barcodeCfg.format} onChange={e=>setBarcodeCfg({...barcodeCfg,format:e.target.value})} className={`${inp} w-full`}><option>CODE128</option><option>CODE39</option><option>EAN13</option><option>EAN8</option><option>UPC</option></select></div>
                            <div><label className={`${lbl} block mb-1`}>Width (px)</label><input type="number" value={barcodeCfg.width} onChange={e=>setBarcodeCfg({...barcodeCfg,width:e.target.value})} className={`${inp} w-full`}/></div>
                            <div><label className={`${lbl} block mb-1`}>Height (px)</label><input type="number" value={barcodeCfg.height} onChange={e=>setBarcodeCfg({...barcodeCfg,height:e.target.value})} className={`${inp} w-full`}/></div>
                            <div><label className={`${lbl} block mb-1`}>Font Size (px)</label><input type="number" value={barcodeCfg.fontSize} onChange={e=>setBarcodeCfg({...barcodeCfg,fontSize:e.target.value})} className={`${inp} w-full`}/></div>
                        </div>
                        <label className="flex items-center gap-2 text-[12px] font-bold text-slate-900 cursor-pointer"><input type="checkbox" checked={barcodeCfg.showText} onChange={e=>setBarcodeCfg({...barcodeCfg,showText:e.target.checked})}/>Show text below barcode</label>
                        <div className="p-4 bg-slate-50 border border-slate-200 text-center">
                            <div className="font-mono text-[14px] tracking-[3px] inline-block" style={{padding: '10px', border: '1px solid black', background: 'white'}}>
                                ||||||||||||||||||||||||||||||||
                            </div>
                            {barcodeCfg.showText && <div className="font-mono text-[10px] mt-1">123456789012</div>}
                            <p className="text-[10px] text-slate-900 mt-2 font-bold">Preview</p>
                        </div>
                        <button onClick={handleSaveBarcodeCfg} className="bg-[#2980b9] hover:bg-[#1a5276] text-white font-black px-6 py-1.5 text-[13px] border border-[#1a5276] flex items-center gap-2"><Save size={14}/> Save Barcode Design</button>
                    </div>
                </div>)}


            </div>
        </div>
    </div>);
}

export { SettingsModule };
