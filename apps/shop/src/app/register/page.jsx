"use client";
import { useState } from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { useAuth } from '@/features/auth/AuthContext';

export default function RegisterPage() {
    const { register } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) {
            setError("Passwords don't match.");
            return;
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setLoading(true);
        try {
            await register({ name: form.name, email: form.email, password: form.password });
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
                <h1 className="text-3xl font-black text-slate-900">Create Account</h1>
                <p className="text-slate-600 mt-2">Join AVS ECOM to start shopping</p>
            </div>

            <Card className="p-8">
                <form onSubmit={submit} className="space-y-5">
                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 font-bold">
                            {error}
                        </div>
                    )}
                    <Input
                        label="Full Name"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="John Doe"
                        required
                    />
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
                        placeholder="Min 6 characters"
                        required
                    />
                    <Input
                        label="Confirm Password"
                        type="password"
                        value={form.confirm}
                        onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                        required
                    />
                    <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full">
                        {loading ? 'Creating account…' : <><UserPlus size={16}/> Create Account</>}
                    </Button>
                </form>
                <p className="text-center text-sm text-slate-600 mt-6">
                    Already have an account? <Link href="/login" className="font-bold text-[#1a5276] hover:underline">Sign in</Link>
                </p>
            </Card>
        </div>
    );
}
