"use client";
import { useEffect, useMemo, useState } from 'react';
import Input from '@/components/ui/Input';
import ProductGrid from '@/features/products/ProductGrid';
import { fetchProducts } from '@/services/products.service';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState('All');

    useEffect(() => {
        fetchProducts().then((p) => {
            setProducts(p);
            setLoading(false);
        });
    }, []);

    const categories = useMemo(() => {
        return ['All', ...Array.from(new Set(products.map((p) => p.category)))];
    }, [products]);

    const filtered = useMemo(() => {
        return products.filter((p) => {
            const q = query.toLowerCase();
            const matchQ = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
            const matchC = category === 'All' || p.category === category;
            return matchQ && matchC;
        });
    }, [products, query, category]);

    return (
        <div className="max-w-7xl mx-auto px-4 py-10">
            <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2">All Products</h1>
                <p className="text-slate-600">{filtered.length} items</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Input
                    placeholder="Search products…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1"
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a5276]/20 focus:border-[#1a5276]"
                >
                    {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="aspect-square bg-slate-200 animate-pulse rounded-xl"/>
                    ))}
                </div>
            ) : (
                <ProductGrid products={filtered} emptyText="No products match your filters."/>
            )}
        </div>
    );
}
