"use client";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const KEY = 'avs_shop_cart';

export function CartProvider({ children }) {
    const [items, setItems] = useState([]);
    const [hydrated, setHydrated] = useState(false);

    // Load from localStorage after mount (no SSR mismatch)
    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) setItems(JSON.parse(raw));
        } catch {}
        setHydrated(true);
    }, []);

    // Persist
    useEffect(() => {
        if (hydrated) localStorage.setItem(KEY, JSON.stringify(items));
    }, [items, hydrated]);

    const addItem = (product, qty = 1) => {
        setItems((prev) => {
            const found = prev.find((i) => i.productId === product.id);
            if (found) {
                return prev.map((i) =>
                    i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
                );
            }
            return [...prev, { productId: product.id, quantity: qty, product }];
        });
    };

    const updateQty = (productId, quantity) => {
        if (quantity <= 0) return removeItem(productId);
        setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, quantity } : i)));
    };

    const removeItem = (productId) => {
        setItems((prev) => prev.filter((i) => i.productId !== productId));
    };

    const clear = () => setItems([]);

    const itemCount = useMemo(
        () => items.reduce((sum, i) => sum + i.quantity, 0),
        [items]
    );
    const subtotal = useMemo(
        () => items.reduce((sum, i) => sum + (i.product?.price || 0) * i.quantity, 0),
        [items]
    );

    return (
        <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, itemCount, subtotal }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used inside CartProvider');
    return ctx;
}
