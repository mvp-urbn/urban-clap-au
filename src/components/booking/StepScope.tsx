'use client';

import { BedDouble, Bath, ChevronRight } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { CounterInput } from '@/components/ui/CounterInput';
import { Button } from '@/components/ui/Button';
import { usePricingCalculator } from '@/hooks/usePricingCalculator';

export function StepScope() {
  const { formState, updateForm, nextStep, prevStep } = useBooking();
  const { bedrooms, bathrooms } = formState;

  const pricing = usePricingCalculator(bedrooms, bathrooms, null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Tell us about your home</h2>
        <p className="text-slate-500 text-sm mt-1">
          We'll calculate an exact fixed price — no hidden surprises.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <CounterInput
          label="Bedrooms"
          sublabel="Including study or office rooms"
          value={bedrooms}
          onChange={(v) => updateForm({ bedrooms: v })}
          min={0}
          max={8}
        />
        <CounterInput
          label="Bathrooms"
          sublabel="Including ensuites & powder rooms"
          value={bathrooms}
          onChange={(v) => updateForm({ bathrooms: v })}
          min={1}
          max={6}
        />
      </div>

      {/* Live price preview */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
        <p className="text-xs text-slate-500 font-medium mb-1">Estimated price from</p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-extrabold text-slate-900">
            {pricing.formattedTotal}
          </span>
          <span className="text-slate-400 text-sm mb-1">AUD incl. GST</span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Final price depends on your chosen package
        </p>
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={prevStep} className="flex-1">
          Back
        </Button>
        <Button onClick={nextStep} className="flex-1 flex items-center gap-2">
          Choose Package
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
