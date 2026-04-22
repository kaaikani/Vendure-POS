export default function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="bg-slate-900 text-slate-300 mt-20">
            <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
                <div>
                    <h3 className="text-xl font-black text-white tracking-widest mb-3">AVS ECOM</h3>
                    <p className="text-sm text-slate-400">Modern commerce, delivered fast.</p>
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-3">Shop</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="/products" className="hover:text-white transition">All Products</a></li>
                        <li><a href="/cart" className="hover:text-white transition">Cart</a></li>
                        <li><a href="/checkout" className="hover:text-white transition">Checkout</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-3">Account</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="/login" className="hover:text-white transition">Sign In</a></li>
                        <li><a href="/register" className="hover:text-white transition">Register</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-white mb-3">Support</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="hover:text-white transition">Contact</a></li>
                        <li><a href="#" className="hover:text-white transition">Returns</a></li>
                        <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-500">
                    © {year} AVS ECOM. Powered by Vendure.
                </div>
            </div>
        </footer>
    );
}
