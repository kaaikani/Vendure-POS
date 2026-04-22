"use client";
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Minus, Plus, Check } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useCart } from '@/features/cart/CartContext';
import { fetchProduct } from '@/services/products.service';
import { formatMoney } from '@/utils/format';

export default function ProductDetailsPage({ params }) {
    const { id } = use(params);
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [qty, setQty] = useState(1);
    const [added, setAdded] = useState(false);
    const { addItem } = useCart();

    useEffect(() => {
        fetchProduct(id).then((p) => {
            setProduct(p);
            setLoading(false);
        });
    }, [id]);

    const handleAdd = () => {
        if (!product) return;
        addItem(product, qty);
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-10">
                <div className="grid md:grid-cols-2 gap-10 animate-pulse">
                    <div className="aspect-square bg-slate-200 rounded-xl"/>
                    <div className="space-y-4">
                        <div className="h-8 bg-slate-200 rounded w-2/3"/>
                        <div className="h-4 bg-slate-200 rounded w-full"/>
                        <div className="h-4 bg-slate-200 rounded w-5/6"/>
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-20 text-center">
                <h1 className="text-2xl font-black text-slate-900 mb-2">Product Not Found</h1>
                <Link href="/products" className="text-[#1a5276] font-bold hover:underline">← Back to products</Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-10">
            <Link href="/products" className="inline-flex items-center gap-1 text-sm font-bold text-slate-600 hover:text-[#1a5276] mb-6 transition">
                <ArrowLeft size={16}/> Back to products
            </Link>

            <div className="grid md:grid-cols-2 gap-10">
                <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden">
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover"/>
                </div>

                <div>
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                        {product.category}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-3">{product.name}</h1>
                    <div className="text-3xl font-black text-[#1a5276] mb-6">{formatMoney(product.price)}</div>
                    <p className="text-slate-700 leading-relaxed mb-6">{product.description}</p>

                    <div className="border-t border-slate-200 pt-6 mb-6">
                        <div className="flex items-center gap-2 text-sm">
                            {product.stock > 0 ? (
                                <>
                                    <span className="w-2 h-2 bg-emerald-500 rounded-full"/>
                                    <span className="font-bold text-emerald-700">In Stock</span>
                                    <span className="text-slate-500">• {product.stock} available</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 bg-red-500 rounded-full"/>
                                    <span className="font-bold text-red-700">Out of Stock</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 mb-6">
                        <span className="text-sm font-bold text-slate-700">Quantity:</span>
                        <div className="flex items-center border border-slate-300 rounded-lg">
                            <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="p-2 hover:bg-slate-100 transition" aria-label="Decrease">
                                <Minus size={14}/>
                            </button>
                            <span className="w-12 text-center font-bold">{qty}</span>
                            <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} className="p-2 hover:bg-slate-100 transition" aria-label="Increase">
                                <Plus size={14}/>
                            </button>
                        </div>
                    </div>

                    <Button onClick={handleAdd} disabled={product.stock <= 0} size="lg" className="w-full">
                        {added ? <><Check size={18}/> Added to Cart!</> : <><ShoppingBag size={18}/> Add to Cart</>}
                    </Button>
                </div>
            </div>
        </div>
    );
}
