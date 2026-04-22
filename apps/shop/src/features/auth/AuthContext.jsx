"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { setToken } from '@/services/api';

const AuthContext = createContext(null);
const KEY = 'avs_shop_user';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        try {
            const raw = localStorage.getItem(KEY);
            if (raw) setUser(JSON.parse(raw));
        } catch {}
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        if (user) localStorage.setItem(KEY, JSON.stringify(user));
        else localStorage.removeItem(KEY);
    }, [user, hydrated]);

    // UI-only login/register (no backend call yet — matches spec: "Login/Register UI only")
    const login = async ({ email, password }) => {
        if (!email || !password) throw new Error('Email and password are required');
        // Mock user for UI. Replace with gql() call to loginCustomer on Vendure shop-api.
        const u = { id: `user-${Date.now()}`, name: email.split('@')[0], email };
        setUser(u);
        return u;
    };

    const register = async ({ name, email, password }) => {
        if (!name || !email || !password) throw new Error('All fields are required');
        const u = { id: `user-${Date.now()}`, name, email };
        setUser(u);
        return u;
    };

    const logout = () => {
        setUser(null);
        setToken(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
    return ctx;
}
