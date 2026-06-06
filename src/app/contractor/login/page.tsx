'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { Wrench } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ContractorLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    window.location.href = '/contractor';
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Contractor Portal</h1>
            <p className="text-slate-500 text-sm mt-1">Sign in to your contractor account</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white placeholder:text-slate-300"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white placeholder:text-slate-300"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center space-y-2 text-sm">
          <p className="text-slate-500">
            New contractor?{' '}
            <Link href="/contractor/signup" className="text-teal-600 font-semibold hover:text-teal-700">
              Create account →
            </Link>
          </p>
          <p className="text-slate-400">
            Are you a customer?{' '}
            <Link href="/auth/login" className="text-slate-500 font-semibold hover:text-slate-700">
              Sign in here →
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
