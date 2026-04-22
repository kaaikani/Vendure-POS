"use client";
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useCart } from '@/features/cart/CartContext';
import { formatMoney, truncate } from '@/utils/format';

export default function ProductCard({ product }) {
    const { addItem } = useCart();

    const handleAdd = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addItem(product, 1);
    };

    return (
        <Card hover className="group flex flex-col">
            <Link href={`/products/${product.id}`} className="block">
                <div className="aspect-square bg-slate-100 overflow-hidden">
                    <img
                        src={product.image}
                        alt={product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                </div>
                <div className="p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                        {product.category}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1 line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-slate-600 mb-3">{truncate(product.description, 60)}</p>
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-black text-[#1a5276]">{formatMoney(product.price)}</span>
                        {product.stock > 0 ? (
                            <span className="text-[10px] font-bold text-emerald-600 uppercase">In Stock</span>
                        ) : (
                            <span className="text-[10px] font-bold text-red-600 uppercase">Sold Out</span>
                        )}
                    </div>
                </div>
            </Link>
            <div className="px-4 pb-4">
                <Button
                    onClick={handleAdd}
                    variant="primary"
                    size="sm"
                    disabled={product.stock <= 0}
                    className="w-full"
                >
                    <ShoppingBag size={14}/> Add to Cart
                </Button>
            </div>
        </Card>
    );
}
