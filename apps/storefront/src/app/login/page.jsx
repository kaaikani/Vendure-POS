"use client";
import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { PosLoginCommand } from '../../core/queries/auth.query';

export default function LoginPage() {
    const [loginRole, setLoginRole] = useState(null); // null = choose, 'admin' | 'user'
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // If already logged in, redirect
    useEffect(() => {
        const session = localStorage.getItem('pos_session');
        if (session) {
            try {
                const s = JSON.parse(session);
                if (s.token && s.role) {
                    window.location.href = '/dashboard';
                }
            } catch {}
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setError('Please enter both username and password.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            const result = await new PosLoginCommand().execute(username.trim(), password, loginRole);
            // Save session
            localStorage.setItem('pos_session', JSON.stringify({
                token: result.token,
                userId: result.userId,
                username: result.username,
                role: result.role,
                displayName: result.displayName,
            }));
            window.location.href = '/dashboard';
        } catch (err) {
            setError(err.message || 'Login failed.');
        } finally {
            setLoading(false);
        }
    };

    // ── Role Selection Screen ──
    if (!loginRole) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
                <div className="w-full max-w-lg">
                    {/* Logo */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-3 mb-3">
                            <span className="text-yellow-500 text-5xl font-black">#</span>
                            <span className="text-4xl font-black text-white tracking-widest">HASHTAG</span>
                        </div>
                        <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Billing Solutions</p>
                    </div>

                    {/* Choose Role */}
                    <h2 className="text-center text-white text-lg font-black uppercase tracking-widest mb-6">Select Login Type</h2>
                    <div className="grid grid-cols-2 gap-5">
                        {/* Admin Card */}
                        <button onClick={() => setLoginRole('admin')} className="bg-gradient-to-br from-slate-800 to-slate-700 border-2 border-slate-600 hover:border-teal-500 rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:shadow-teal-500/10 group active:scale-95">
                            <div className="inline-flex p-4 rounded-full bg-teal-500/10 group-hover:bg-teal-500/20 mb-4 transition">
                                <ShieldCheck size={40} className="text-teal-400"/>
                            </div>
                            <h3 className="text-white font-black text-lg uppercase tracking-widest mb-1">Admin</h3>
                            <p className="text-slate-500 text-xs font-bold">Full access to all modules</p>
                        </button>

                        {/* User Card */}
                        <button onClick={() => setLoginRole('user')} className="bg-gradient-to-br from-slate-800 to-slate-700 border-2 border-slate-600 hover:border-emerald-500 rounded-2xl p-8 text-center transition-all hover:shadow-xl hover:shadow-emerald-500/10 group active:scale-95">
                            <div className="inline-flex p-4 rounded-full bg-emerald-500/10 group-hover:bg-emerald-500/20 mb-4 transition">
                                <User size={40} className="text-emerald-400"/>
                            </div>
                            <h3 className="text-white font-black text-lg uppercase tracking-widest mb-1">User</h3>
                            <p className="text-slate-500 text-xs font-bold">Retail POS billing access</p>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Login Form ──
    const isAdmin = loginRole === 'admin';
    const accentColor = isAdmin ? 'teal' : 'emerald';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-2">
                        <span className="text-yellow-500 text-4xl font-black">#</span>
                        <span className="text-3xl font-black text-white tracking-widest">HASHTAG</span>
                    </div>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Billing Solutions</p>
                </div>

                {/* Login Card */}
                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className={`px-8 py-6 text-center ${isAdmin ? 'bg-gradient-to-r from-teal-600/20 to-teal-500/10 border-b border-teal-500/20' : 'bg-gradient-to-r from-emerald-600/20 to-emerald-500/10 border-b border-emerald-500/20'}`}>
                        <div className={`inline-flex p-3 rounded-full mb-3 ${isAdmin ? 'bg-teal-500/20' : 'bg-emerald-500/20'}`}>
                            {isAdmin ? <ShieldCheck size={28} className="text-teal-400"/> : <User size={28} className="text-emerald-400"/>}
                        </div>
                        <h2 className={`text-lg font-black uppercase tracking-widest ${isAdmin ? 'text-teal-400' : 'text-emerald-400'}`}>
                            {isAdmin ? 'Admin Login' : 'User Login'}
                        </h2>
                        <p className="text-slate-500 text-xs font-bold mt-1">
                            {isAdmin ? 'Access all modules & settings' : 'Access Retail POS Terminal'}
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="p-8 space-y-5">
                        {error && (
                            <div className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold">
                                <AlertCircle size={18}/> {error}
                            </div>
                        )}

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Username</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder={isAdmin ? 'admin' : 'Enter username'} autoFocus autoComplete="username" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3.5 text-white text-sm font-bold placeholder:text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"/>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Password</label>
                            <div className="relative">
                                <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" autoComplete="current-password" className="w-full bg-slate-900/50 border border-slate-600 rounded-xl p-3.5 text-white text-sm font-bold placeholder:text-slate-600 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 pr-12 transition"/>
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-sm text-white transition shadow-lg active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 ${isAdmin ? 'bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 shadow-teal-500/30' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 shadow-emerald-500/30'}`}>
                            {loading ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"/> : <><LogIn size={18}/> Sign In</>}
                        </button>
                    </form>

                    {/* Back button */}
                    <div className="px-8 pb-6 text-center">
                        <button onClick={() => { setLoginRole(null); setError(''); setUsername(''); setPassword(''); }} className="text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest transition">
                            ← Back to role selection
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
