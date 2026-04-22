"use client";
import { useState } from 'react';
import Link from 'next/link';
import { CreditCard, Lock, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useCart } from '@/features/cart/CartContext';
import { useAuth } from '@/features/auth/AuthContext';
import { formatMoney } from '@/utils/format';

export default function CheckoutPage() {
    const { items, subtotal, clear } = useCart();
    const { user } = useAuth();
    const [form, setForm] = useState({
        name: user?.name || '', email: user?.email || '', phone: '',
        address: '', city: '', state: '', pincode: '', paymentMethod: 'card',
    });
    const [placed, setPlaced] = useState(false);

    const shipping = subtotal >= 99900 ? 0 : 9900;
    const total = subtotal + shipping;

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.address || !form.city || !form.pincode) {
            alert('Please fill all required fields');
            return;
        }
        setPlaced(true);
        clear();
    };

    if (placed) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="inline-flex p-4 bg-emerald-100 rounded-full mb-4">
                    <Check size={48} className="text-emerald-600"/>
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2">Order Placed!</h1>
                <p className="text-slate-600 mb-8">Thank you for your purchase. A confirmation email has been sent.</p>
                <Link href="/products">
                    <Button variant="primary" size="lg">Continue Shopping</Button>
                </Link>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-black text-slate-900 mb-2">Your cart is empty</h1>
                <Link href="/products" className="text-[#1a5276] font-bold hover:underline">← Shop products</Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8">Checkout</h1>

            <form onSubmit={submit} className="grid lg:grid-cols-[1fr_380px] gap-8">
                <div className="space-y-6">
                    {/* Contact */}
                    <Card className="p-6">
                        <h2 className="font-black text-lg mb-4">Contact Information</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Full Name" value={form.name} onChange={set('name')} required/>
                            <Input label="Email" type="email" value={form.email} onChange={set('email')} required/>
                            <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} className="md:col-span-2"/>
                        </div>
                    </Card>

                    {/* Shipping */}
                    <Card className="p-6">
                        <h2 className="font-black text-lg mb-4">Shipping Address</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <Input label="Address" value={form.address} onChange={set('address')} required className="md:col-span-2"/>
                            <Input label="City" value={form.city} onChange={set('city')} required/>
                            <Input label="State" value={form.state} onChange={set('state')}/>
                            <Input label="Pincode" value={form.pincode} onChange={set('pincode')} required/>
                        </div>
                    </Card>

                    {/* Payment */}
                    <Card className="p-6">
                        <h2 className="font-black text-lg mb-4 flex items-center gap-2">
                            <CreditCard size={20}/> Payment Method
                        </h2>
                        <div className="space-y-2">
                            {[
                                { v: 'card', label: 'Credit / Debit Card' },
                                { v: 'upi', label: 'UPI' },
                                { v: 'cod', label: 'Cash on Delivery' },
                            ].map(({ v, label }) => (
                                <label key={v} className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50 transition">
                                    <input type="radio" name="pm" value={v} checked={form.paymentMethod === v} onChange={set('paymentMethod')}/>
                                    <span className="font-bold text-sm">{label}</span>
                                </label>
                            ))}
                        </div>
                        <p className="flex items-center gap-1.5 mt-4 text-xs text-slate-500">
                            <Lock size={12}/> Your payment info is encrypted and secure
                        </p>
                    </Card>
                </div>

                {/* Summary */}
                <Card className="p-6 h-fit sticky top-20">
                    <h2 className="font-black text-lg mb-4">Order Summary</h2>
                    <div className="space-y-3 pb-4 border-b border-slate-200 max-h-64 overflow-auto">
                        {items.map((i) => (
                            <div key={i.productId} className="flex gap-3 text-sm">
                                <div className="w-12 h-12 bg-slate-100 rounded shrink-0">
                                    <img src={i.product?.image} alt="" className="w-full h-full object-cover rounded"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-900 line-clamp-1">{i.product?.name}</p>
                                    <p className="text-xs text-slate-500">Qty: {i.quantity}</p>
                                </div>
                                <span className="font-bold whitespace-nowrap">{formatMoney((i.product?.price || 0) * i.quantity)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2 py-4 text-sm border-b border-slate-200">
                        <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-bold">{formatMoney(subtotal)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600">Shipping</span><span className="font-bold">{shipping === 0 ? 'FREE' : formatMoney(shipping)}</span></div>
                    </div>
                    <div className="flex justify-between text-lg font-black py-4">
                        <span>Total</span>
                        <span className="text-[#1a5276]">{formatMoney(total)}</span>
                    </div>
                    <Button type="submit" variant="primary" size="lg" className="w-full">
                        <Lock size={16}/> Place Order
                    </Button>
                </Card>
            </form>
        </div>
    );
}
