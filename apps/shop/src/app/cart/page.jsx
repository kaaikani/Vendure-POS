"use client";
import Link from 'next/link';
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useCart } from '@/features/cart/CartContext';
import { formatMoney } from '@/utils/format';

export default function CartPage() {
    const { items, updateQty, removeItem, subtotal, itemCount } = useCart();

    if (itemCount === 0) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <ShoppingBag size={48} className="mx-auto text-slate-300 mb-4"/>
                <h1 className="text-2xl font-black text-slate-900 mb-2">Your cart is empty</h1>
                <p className="text-slate-600 mb-6">Browse our collection and add something you love.</p>
                <Link href="/products">
                    <Button variant="primary" size="lg">
                        Shop Products <ArrowRight size={18}/>
                    </Button>
                </Link>
            </div>
        );
    }

    const shipping = subtotal >= 99900 ? 0 : 9900;
    const total = subtotal + shipping;

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-8">Your Cart ({itemCount})</h1>

            <div className="grid lg:grid-cols-[1fr_380px] gap-8">
                {/* Cart items */}
                <div className="space-y-4">
                    {items.map((i) => (
                        <Card key={i.productId} className="p-4">
                            <div className="flex gap-4">
                                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                    <img src={i.product?.image} alt={i.product?.name} className="w-full h-full object-cover"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <Link href={`/products/${i.productId}`} className="font-bold text-slate-900 hover:text-[#1a5276] transition line-clamp-2">
                                        {i.product?.name}
                                    </Link>
                                    <p className="text-xs text-slate-500 mt-0.5">{i.product?.category}</p>
                                    <div className="flex items-center justify-between mt-3">
                                        <div className="flex items-center border border-slate-300 rounded-lg">
                                            <button onClick={() => updateQty(i.productId, i.quantity - 1)} className="p-1.5 hover:bg-slate-100" aria-label="Decrease">
                                                <Minus size={12}/>
                                            </button>
                                            <span className="w-10 text-center font-bold text-sm">{i.quantity}</span>
                                            <button onClick={() => updateQty(i.productId, i.quantity + 1)} className="p-1.5 hover:bg-slate-100" aria-label="Increase">
                                                <Plus size={12}/>
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-black text-[#1a5276]">{formatMoney((i.product?.price || 0) * i.quantity)}</span>
                                            <button onClick={() => removeItem(i.productId)} className="text-slate-400 hover:text-red-600 transition" aria-label="Remove">
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                {/* Summary */}
                <Card className="p-6 h-fit sticky top-20">
                    <h2 className="font-black text-lg mb-4">Order Summary</h2>
                    <div className="space-y-2 text-sm pb-4 border-b border-slate-200">
                        <div className="flex justify-between"><span className="text-slate-600">Subtotal</span><span className="font-bold">{formatMoney(subtotal)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600">Shipping</span><span className="font-bold">{shipping === 0 ? 'FREE' : formatMoney(shipping)}</span></div>
                        {shipping === 0 && <p className="text-[11px] text-emerald-600 font-bold">🎉 Free shipping unlocked</p>}
                    </div>
                    <div className="flex justify-between text-lg font-black py-4">
                        <span>Total</span>
                        <span className="text-[#1a5276]">{formatMoney(total)}</span>
                    </div>
                    <Link href="/checkout">
                        <Button variant="primary" size="lg" className="w-full">
                            Proceed to Checkout <ArrowRight size={18}/>
                        </Button>
                    </Link>
                </Card>
            </div>
        </div>
    );
}
