"use client";
import Link from 'next/link';
import { ShoppingCart, User, Search } from 'lucide-react';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';

export default function Navbar() {
    const { itemCount } = useCart();
    const { user, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <Link href="/" className="text-2xl font-black tracking-widest text-[#1a5276]">
                    AVS ECOM
                </Link>

                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/" className="text-sm font-bold text-slate-700 hover:text-[#1a5276] transition">Home</Link>
                    <Link href="/products" className="text-sm font-bold text-slate-700 hover:text-[#1a5276] transition">Products</Link>
                    <Link href="/cart" className="text-sm font-bold text-slate-700 hover:text-[#1a5276] transition">Cart</Link>
                </nav>

                <div className="flex items-center gap-3">
                    <button className="p-2 hover:bg-slate-100 rounded-lg transition" aria-label="Search">
                        <Search size={18} className="text-slate-700"/>
                    </button>

                    <Link href="/cart" className="relative p-2 hover:bg-slate-100 rounded-lg transition" aria-label="Cart">
                        <ShoppingCart size={18} className="text-slate-700"/>
                        {itemCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 bg-[#1a5276] text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                                {itemCount}
                            </span>
                        )}
                    </Link>

                    {user ? (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 hidden sm:inline">{user.name}</span>
                            <button onClick={logout} className="text-xs font-bold text-slate-500 hover:text-red-600 transition">
                                Logout
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="flex items-center gap-1.5 px-4 py-2 bg-[#1a5276] hover:bg-[#154360] text-white text-sm font-bold rounded-lg transition">
                            <User size={16}/>
                            <span className="hidden sm:inline">Login</span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
