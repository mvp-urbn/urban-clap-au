'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Wrench } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'signup' | 'login';

export default function ContractorSignupPage() {
  const [mode, setMode] = useState<Mode>('signup');
  const [step, setStep] = useState<1 | 2>(1);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setStep(1);
    setForm({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  };

  const handleSignup = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, phone_number: form.phone },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/contractor/onboard`,
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setSubmittedEmail(form.email);
    setStep(2);
    setLoading(false);
  };

  const handleLogin = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    window.location.href = '/contractor';
  };

  // Email confirmation screen after signup
  if (mode === 'signup' && step === 2) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mx-auto">
            <Mail className="w-8 h-8 text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Check your email!</h1>
            <p className="text-slate-500 text-sm mt-2 leading-relaxed">
              We sent a confirmation link to{' '}
              <span className="font-semibold text-slate-700">{submittedEmail}</span>.
              Click it to verify your account, then complete your contractor profile.
            </p>
          </div>
          <button
            onClick={() => switchMode('login')}
            className="inline-block bg-teal-600 text-white font-semibold py-3 px-6 rounded-xl hover:bg-teal-700 transition"
          >
            Back to Sign In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 flex items-center justify-center mx-auto">
            <Wrench className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">Contractor Portal</h1>
            <p className="text-slate-500 text-sm mt-1">Urban Clap AU</p>
          </div>
        </div>

        {/* Toggle tabs */}
        <div className="flex bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'signup'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Create Account
          </button>
          <button
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${
              mode === 'login'
                ? 'bg-white text-teal-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {mode === 'signup' ? (
            <form onSubmit={handleSignup} className="space-y-4">
              <Field label="Full Name">
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={set('fullName')}
                  className={inputCls}
                  placeholder="Jane Smith"
                  autoComplete="name"
                />
              </Field>

              <Field label="Email">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  className={inputCls}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>

              <Field label="Phone">
                <input
                  type="tel"
                  required
                  value={form.phone}
                  onChange={set('phone')}
                  className={inputCls}
                  placeholder="04xx xxx xxx"
                  autoComplete="tel"
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  required
                  minLength={8}
                  value={form.password}
                  onChange={set('password')}
                  className={inputCls}
                  placeholder="Min 8 characters"
                  autoComplete="new-password"
                />
              </Field>

              <Field label="Confirm Password">
                <input
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  className={inputCls}
                  placeholder="Re-enter password"
                  autoComplete="new-password"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account…' : 'Create Account & Continue'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <Field label="Email">
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  className={inputCls}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </Field>

              <Field label="Password">
                <input
                  type="password"
                  required
                  value={form.password}
                  onChange={set('password')}
                  className={inputCls}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Looking to book a service?{' '}
          <Link href="/" className="text-emerald-600 font-semibold hover:text-emerald-700">
            Customer site →
          </Link>
        </p>
      </div>
    </main>
  );
}

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white placeholder:text-slate-300';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">{label}</label>
      {children}
    </div>
  );
}
