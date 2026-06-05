'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { BookingFormState, ServiceTier } from '@/types';

const initialState: BookingFormState = {
  bedrooms: 2,
  bathrooms: 1,
  tier: null,
  serviceId: null,
  date: '',
  timeSlot: '',
  address: '',
  suburb: '',
  postcode: '',
  totalPriceCents: 0,
};

interface BookingContextValue {
  step: number;
  formState: BookingFormState;
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateForm: (updates: Partial<BookingFormState>) => void;
  resetBooking: () => void;
}

const BookingContext = createContext<BookingContextValue | null>(null);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [step, setStep] = useState(1);
  const [formState, setFormState] = useState<BookingFormState>(initialState);

  const nextStep = useCallback(() => setStep((s) => Math.min(s + 1, 5)), []);
  const prevStep = useCallback(() => setStep((s) => Math.max(s - 1, 1)), []);

  const updateForm = useCallback((updates: Partial<BookingFormState>) => {
    setFormState((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetBooking = useCallback(() => {
    setStep(1);
    setFormState(initialState);
  }, []);

  return (
    <BookingContext.Provider
      value={{ step, formState, setStep, nextStep, prevStep, updateForm, resetBooking }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used within BookingProvider');
  return ctx;
}
