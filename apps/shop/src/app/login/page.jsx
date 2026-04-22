"use client";
import { useState } from 'react';
import Link from 'next/link';
import { LogIn, Mail, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useAuth } from '@/features/auth/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await login(form);
            window.location.href = '/';
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto px-4 py-16">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-slate-900">Welcome Back</h1>
                <p className="text-slate-600 mt-2">Sign in to your AVS ECOM account</p>
            </div>

            <Card className="p-8">
                <form onSubmit={submit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-bold">
                            {error}
                        </div>
                    )}
                    <Input
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        placeholder="you@example.com"
                        required
                    />
                    <Input
                        label="Password"
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        placeholder="••••••••"
                        required
                    />
                    <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
                        {loading ? 'Signing in…' : <><LogIn size={16}/> Sign In</>}
                    </Button>
                </form>
                <p className="text-center text-sm text-slate-600 mt-6">
                    Don&apos;t have an account? <Link href="/register" className="font-bold text-[#1a5276] hover:underline">Sign up</Link>
                </p>
            </Card>
        </div>
    );
}
