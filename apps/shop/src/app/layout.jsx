import '@/styles/globals.css';
import Navbar from '@/common/Navbar';
import Footer from '@/common/Footer';
import { CartProvider } from '@/features/cart/CartContext';
import { AuthProvider } from '@/features/auth/AuthContext';

export const metadata = {
    title: { default: 'AVS ECOM — Modern Commerce', template: '%s | AVS ECOM' },
    description: 'Shop quality products, fast delivery. Powered by Vendure.',
};

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#1a5276',
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
                <AuthProvider>
                    <CartProvider>
                        <Navbar />
                        <main className="flex-1">{children}</main>
                        <Footer />
                    </CartProvider>
                </AuthProvider>
            </body>
        </html>
    );
}
