'use client';

import { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { saveContractorOnboarding } from '@/app/actions/contractor';
import { CONTRACTOR_CATEGORIES } from '@/lib/contractor-categories';
import { cn } from '@/lib/utils';

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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider pt-2">{children}</p>
  );
}

export function OnboardForm({
  defaultName,
  defaultPhone,
}: {
  defaultName: string;
  defaultPhone: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [form, setForm] = useState({
    abn: '',
    insuranceExpiry: '',
    postcodes: '',
    experienceYears: '',
    referenceName: '',
    referencePhone: '',
    bankBsb: '',
    bankAccountNumber: '',
    licenseNumber: '',
    equipmentOwned: false,
  });

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const needsInsurance = CONTRACTOR_CATEGORIES.some(
    (c) => selectedCategories.includes(c.id) && c.requiresInsurance,
  );
  const needsLicense = CONTRACTOR_CATEGORIES.some(
    (c) => selectedCategories.includes(c.id) && c.requiresLicense,
  );
  const needsEquipment = CONTRACTOR_CATEGORIES.some(
    (c) => selectedCategories.includes(c.id) && c.requiresEquipment,
  );

  const handleStep1Continue = () => {
    if (selectedCategories.length === 0) {
      setError('Please select at least one service category');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const abn = form.abn.replace(/\s/g, '');
    if (!/^\d{11}$/.test(abn)) {
      setError('ABN must be 11 digits (e.g. 51 824 753 556)');
      return;
    }
    if (needsInsurance && !form.insuranceExpiry) {
      setError('Insurance expiry date is required for your selected services');
      return;
    }
    if (needsLicense && !form.licenseNumber.trim()) {
      setError('License or certificate number is required for your selected services');
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

    setLoading(true);
    try {
      await saveContractorOnboarding({
        fullName: defaultName,
        phone: defaultPhone,
        abn,
        insuranceExpiry: form.insuranceExpiry,
        servicePostcodes,
        categories: selectedCategories,
        experienceYears: parseInt(form.experienceYears, 10) || 0,
        referenceName: form.referenceName.trim(),
        referencePhone: form.referencePhone.trim(),
        bankBsb: form.bankBsb.trim(),
        bankAccountNumber: form.bankAccountNumber.trim(),
        licenseNumber: form.licenseNumber.trim(),
        equipmentOwned: form.equipmentOwned,
      });
      window.location.href = '/contractor';
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong — please try again');
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-sm text-slate-600">Select all the services you offer:</p>

        <div className="grid grid-cols-2 gap-3">
          {CONTRACTOR_CATEGORIES.map((cat) => {
            const isSelected = selectedCategories.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={cn(
                  'relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition text-center',
                  isSelected
                    ? 'border-teal-500 bg-teal-50 text-teal-800'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300',
                )}
              >
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-teal-600 absolute top-2 right-2" />
                )}
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-xs font-semibold leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleStep1Continue}
          className="w-full bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition"
        >
          Continue →
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <SectionHeading>Professional Details</SectionHeading>

      <Field label="ABN (11 digits)" hint="Spaces OK">
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

      <Field label="Years of Experience">
        <input
          type="number"
          min={0}
          max={40}
          value={form.experienceYears}
          onChange={set('experienceYears')}
          className={inputCls}
          placeholder="e.g. 3"
        />
      </Field>

      <Field label="Reference Name" hint="Full name of a professional reference">
        <input
          type="text"
          value={form.referenceName}
          onChange={set('referenceName')}
          className={inputCls}
          placeholder="John Brown"
        />
      </Field>

      <Field label="Reference Phone">
        <input
          type="tel"
          value={form.referencePhone}
          onChange={set('referencePhone')}
          className={inputCls}
          placeholder="04xx xxx xxx"
        />
      </Field>

      <Field label="Postcodes you service" hint="Comma-separated, e.g. 2000, 2010">
        <input
          type="text"
          required
          value={form.postcodes}
          onChange={set('postcodes')}
          className={inputCls}
          placeholder="2000, 2010, 2060"
        />
      </Field>

      <SectionHeading>Bank Details for Salary</SectionHeading>

      <Field label="BSB" hint="Format: XXX-XXX">
        <input
          type="text"
          value={form.bankBsb}
          onChange={set('bankBsb')}
          className={inputCls}
          placeholder="062-000"
          maxLength={7}
        />
      </Field>

      <Field label="Account Number">
        <input
          type="text"
          value={form.bankAccountNumber}
          onChange={set('bankAccountNumber')}
          className={inputCls}
          placeholder="12345678"
        />
      </Field>

      {needsInsurance && (
        <>
          <SectionHeading>Insurance</SectionHeading>
          <Field label="Public Liability Insurance Expiry">
            <input
              type="date"
              required
              value={form.insuranceExpiry}
              onChange={set('insuranceExpiry')}
              className={inputCls}
              min={new Date().toISOString().split('T')[0]}
            />
          </Field>
        </>
      )}

      {needsLicense && (
        <>
          <SectionHeading>License / Certification</SectionHeading>
          <Field label="License or Certificate Number">
            <input
              type="text"
              required
              value={form.licenseNumber}
              onChange={set('licenseNumber')}
              className={inputCls}
              placeholder="e.g. LIC-123456"
            />
          </Field>
        </>
      )}

      {needsEquipment && (
        <>
          <SectionHeading>Equipment</SectionHeading>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.equipmentOwned}
              onChange={(e) => setForm((prev) => ({ ...prev, equipmentOwned: e.target.checked }))}
              className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-slate-700 font-medium">
              I own my own equipment (mower, tools, etc.)
            </span>
          </label>
        </>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => setStep(1)}
          disabled={loading}
          className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-teal-600 text-white font-semibold py-3 rounded-xl hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting…' : 'Submit Application'}
        </button>
      </div>

      <p className="text-xs text-slate-400 text-center">
        By submitting you confirm your details are correct. We will verify your ABN before approving your account.
      </p>
    </form>
  );
}
