'use client';

import { BookingProvider, useBooking } from '@/context/BookingContext';
import { StepIndicator } from '@/components/ui/StepIndicator';
import { StepCategory } from '@/components/booking/StepCategory';
import { StepScope } from '@/components/booking/StepScope';
import { StepTier } from '@/components/booking/StepTier';
import { StepSchedule } from '@/components/booking/StepSchedule';
import { StepCheckout } from '@/components/booking/StepCheckout';
import { AuthGate } from '@/components/booking/AuthGate';
import { Sparkles } from 'lucide-react';
import Link from 'next/link';

function BookingFunnel() {
  const { step } = useBooking();

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-slate-900 text-sm">Urban Clap AU</span>
          </Link>
          <span className="text-xs text-slate-400 font-medium">
            Step {step} of 5
          </span>
        </div>
      </header>

      {/* Step indicator */}
      {step > 1 && (
        <div className="bg-white border-b border-slate-100 px-4 py-3">
          <div className="max-w-lg mx-auto">
            <StepIndicator currentStep={step} />
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 flex items-start justify-center px-4 py-4 sm:py-6">
        <div className="w-full max-w-lg">
          {step === 1 && <StepCategory />}
          {step === 2 && <StepScope />}
          {step === 3 && <StepTier />}
          {step === 4 && <StepSchedule />}
          {step === 5 && <AuthGate><StepCheckout /></AuthGate>}
        </div>
      </main>
    </div>
  );
}

export default function BookPage() {
  return (
    <BookingProvider>
      <BookingFunnel />
    </BookingProvider>
  );
}
