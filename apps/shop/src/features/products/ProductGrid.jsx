import ProductCard from './ProductCard';

export default function ProductGrid({ products, emptyText = 'No products found.' }) {
    if (!products || products.length === 0) {
        return <p className="text-center text-slate-500 py-16">{emptyText}</p>;
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((p) => (
                <ProductCard key={p.id} product={p} />
            ))}
        </div>
    );
}
