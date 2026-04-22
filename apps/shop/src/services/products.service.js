import { gql } from './api';

const SAMPLE = [
    { id: 'p-1', name: 'Classic Leather Wallet', price: 149900, description: 'Handcrafted genuine leather wallet with 8 card slots.', image: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600', category: 'Accessories', stock: 18 },
    { id: 'p-2', name: 'Wireless Earbuds Pro', price: 399900, description: 'Noise-cancelling, 30-hour battery life, crystal-clear audio.', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600', category: 'Electronics', stock: 42 },
    { id: 'p-3', name: 'Organic Cotton T-Shirt', price: 89900, description: 'Soft, breathable, sustainably sourced. Available in 5 colors.', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600', category: 'Apparel', stock: 120 },
    { id: 'p-4', name: 'Smart Fitness Band', price: 249900, description: '24/7 heart rate, sleep tracking, 14-day battery.', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600', category: 'Electronics', stock: 25 },
    { id: 'p-5', name: 'Ceramic Coffee Mug Set', price: 119900, description: 'Set of 4 premium ceramic mugs, microwave and dishwasher safe.', image: 'https://images.unsplash.com/photo-1577968897966-3d4325b36b61?w=600', category: 'Home', stock: 60 },
    { id: 'p-6', name: 'Yoga Mat Eco', price: 159900, description: 'Natural rubber, non-slip, 6mm thickness for joint support.', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=600', category: 'Fitness', stock: 34 },
    { id: 'p-7', name: 'Minimalist Desk Lamp', price: 189900, description: 'Adjustable brightness, USB-C charging port, touch control.', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600', category: 'Home', stock: 15 },
    { id: 'p-8', name: 'Stainless Water Bottle', price: 79900, description: 'Keeps drinks cold for 24h or hot for 12h. 750ml.', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600', category: 'Fitness', stock: 88 },
];

export async function fetchProducts() {
    try {
        const data = await gql(`
            query Products {
                products(options: { take: 30 }) {
                    items {
                        id
                        name
                        description
                        featuredAsset { preview }
                        variants {
                            id
                            priceWithTax
                            stockLevel
                        }
                        facetValues { facet { code } name }
                    }
                }
            }
        `);
        const items = data.products?.items || [];
        if (items.length === 0) return SAMPLE;
        return items.map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: p.variants?.[0]?.priceWithTax || 0,
            image: p.featuredAsset?.preview || 'https://via.placeholder.com/600x600?text=No+Image',
            category: p.facetValues?.[0]?.name || 'General',
            stock: Number(p.variants?.[0]?.stockLevel || 0),
        }));
    } catch {
        return SAMPLE;
    }
}

export async function fetchProduct(id) {
    try {
        const data = await gql(
            `query Product($id: ID!) {
                product(id: $id) {
                    id name description
                    featuredAsset { preview }
                    variants { id priceWithTax stockLevel }
                    facetValues { name }
                }
            }`,
            { id }
        );
        if (data.product) {
            const p = data.product;
            return {
                id: p.id,
                name: p.name,
                description: p.description || '',
                price: p.variants?.[0]?.priceWithTax || 0,
                image: p.featuredAsset?.preview || 'https://via.placeholder.com/600x600?text=No+Image',
                category: p.facetValues?.[0]?.name || 'General',
                stock: Number(p.variants?.[0]?.stockLevel || 0),
            };
        }
    } catch {}
    return SAMPLE.find((p) => p.id === id) || null;
}
