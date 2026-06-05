'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveContractorOnboarding } from '@/app/actions/contractor';

export function OnboardForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    fullName: defaultName,
    phone: '',
    abn: '',
    insuranceExpiry: '',
    postcodes: '',
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const abn = form.abn.replace(/\s/g, '');
    if (!/^\d{11}$/.test(abn)) {
      setError('ABN must be 11 digits (e.g. 51 824 753 556)');
      return;
    }
    if (!form.phone.trim()) {
      setError('Phone number is required');
      return;
    }
    if (!form.insuranceExpiry) {
      setError('Insurance expiry date is required');
      return;
    }

    const servicePostcodes = form.postcodes
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (servicePostcodes.length === 0) {
      setError('Enter at least one service postcode');
      return;
    }

    startTransition(async () => {
      try {
        await saveContractorOnboarding({
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          abn,
          insuranceExpiry: form.insuranceExpiry,
          servicePostcodes,
        });
        router.push('/contractor');
        router.refresh();
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Field label="Full name">
        <input
          type="text"
          required
          value={form.fullName}
          onChange={set('fullName')}
          className={inputCls}
          placeholder="Jane Smith"
        />
      </Field>

      <Field label="Mobile phone">
        <input
          type="tel"
          required
          value={form.phone}
          onChange={set('phone')}
          className={inputCls}
          placeholder="04xx xxx xxx"
        />
      </Field>

      <Field label="ABN (11 digits)" hint="Australian Business Number — spaces OK">
        <input
          type="text"
          required
          value={form.abn}
          onChange={set('abn')}
          className={inputCls}
          placeholder="51 824 753 556"
          maxLength={14}
        />
      </Field>

      <Field label="Public liability insurance expiry">
        <input
          type="date"
          required
          value={form.insuranceExpiry}
          onChange={set('insuranceExpiry')}
          className={inputCls}
          min={new Date().toISOString().split('T')[0]}
        />
      </Field>

      <Field
        label="Postcodes you service"
        hint="Comma-separated, e.g. 2000, 2010, 2011"
      >
        <input
          type="text"
          required
          value={form.postcodes}
          onChange={set('postcodes')}
          className={inputCls}
          placeholder="2000, 2010, 2060"
        />
      </Field>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? 'Submitting…' : 'Submit Application'}
      </button>

      <p className="text-xs text-slate-400 text-center">
        By submitting you confirm your details are correct. We will verify your ABN and insurance before approving your account.
      </p>
    </form>
  );
}

const inputCls =
  'w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-white placeholder:text-slate-300';

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700">
        {label}
        {hint && <span className="ml-1.5 font-normal text-slate-400 text-xs">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
