"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Truck, Shield, RotateCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import ProductGrid from '@/features/products/ProductGrid';
import { fetchProducts } from '@/services/products.service';

export default function HomePage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts().then((p) => {
            setProducts(p);
            setLoading(false);
        });
    }, []);

    const featured = products.slice(0, 4);

    return (
        <div>
            {/* HERO */}
            <section className="bg-gradient-to-br from-[#1a5276] via-[#2980b9] to-[#154360] text-white">
                <div className="max-w-7xl mx-auto px-4 py-20 md:py-28 grid md:grid-cols-2 gap-12 items-center">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[4px] text-yellow-300 mb-4">
                            New Season • 2026
                        </p>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-5">
                            Discover. Shop. <br/>Deliver Happiness.
                        </h1>
                        <p className="text-slate-200 text-lg mb-8 max-w-lg">
                            Curated products, unbeatable prices, fast shipping — everything you love in one place.
                        </p>
                        <div className="flex gap-3">
                            <Link href="/products">
                                <Button variant="primary" size="lg" className="!bg-yellow-400 hover:!bg-yellow-300 !text-slate-900">
                                    Shop Now <ArrowRight size={18}/>
                                </Button>
                            </Link>
                            <Link href="/register">
                                <Button variant="outline" size="lg" className="!border-white !text-white hover:!bg-white hover:!text-[#1a5276]">
                                    Join Free
                                </Button>
                            </Link>
                        </div>
                    </div>
                    <div className="hidden md:block">
                        <div className="aspect-square bg-white/10 backdrop-blur rounded-3xl p-8 flex items-center justify-center">
                            <img
                                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800"
                                alt="Hero"
                                className="rounded-2xl shadow-2xl"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* TRUST BADGES */}
            <section className="border-y border-slate-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { Icon: Truck, t: 'Free Shipping', d: 'On all orders over ₹999' },
                        { Icon: Shield, t: 'Secure Checkout', d: '100% protected transactions' },
                        { Icon: RotateCw, t: 'Easy Returns', d: '7-day hassle-free returns' },
                    ].map(({ Icon, t, d }) => (
                        <div key={t} className="flex items-center gap-4">
                            <div className="p-3 bg-[#1a5276]/10 rounded-xl">
                                <Icon size={22} className="text-[#1a5276]"/>
                            </div>
                            <div>
                                <div className="font-black text-slate-900">{t}</div>
                                <div className="text-xs text-slate-600">{d}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURED PRODUCTS */}
            <section className="max-w-7xl mx-auto px-4 py-16">
                <div className="flex items-end justify-between mb-8">
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-[3px] text-[#1a5276] mb-1">Featured</p>
                        <h2 className="text-3xl md:text-4xl font-black text-slate-900">Top Picks This Week</h2>
                    </div>
                    <Link href="/products" className="hidden sm:flex items-center gap-1 text-sm font-bold text-[#1a5276] hover:underline">
                        View all <ArrowRight size={16}/>
                    </Link>
                </div>
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="aspect-square bg-slate-200 animate-pulse rounded-xl"/>
                        ))}
                    </div>
                ) : (
                    <ProductGrid products={featured}/>
                )}
            </section>
        </div>
    );
}
