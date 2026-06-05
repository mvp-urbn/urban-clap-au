'use client';

import { useState } from 'react';
import { CalendarDays, Clock, MapPin, ChevronRight } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const TIME_SLOTS = [
  '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM',
  '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM',
  '3:00 PM', '4:00 PM',
];

function getMinDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export function StepSchedule() {
  const { formState, updateForm, nextStep, prevStep } = useBooking();
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formState.date) errs.date = 'Please select a date';
    if (!formState.timeSlot) errs.timeSlot = 'Please select a time';
    if (!formState.address.trim()) errs.address = 'Street address is required';
    if (!formState.suburb.trim()) errs.suburb = 'Suburb is required';
    if (!/^\d{4}$/.test(formState.postcode))
      errs.postcode = 'Enter a valid 4-digit Australian postcode';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validate()) nextStep();
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">When & where?</h2>
        <p className="text-slate-500 text-sm mt-1">
          Book your preferred date, time, and service address.
        </p>
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          <CalendarDays className="inline w-4 h-4 mr-1.5 text-emerald-600" />
          Select Date
        </label>
        <input
          type="date"
          min={getMinDate()}
          value={formState.date}
          onChange={(e) => {
            updateForm({ date: e.target.value });
            setErrors((prev) => ({ ...prev, date: undefined }));
          }}
          className={cn(
            'w-full rounded-xl border px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition',
            errors.date ? 'border-red-400' : 'border-slate-200'
          )}
        />
        {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
      </div>

      {/* Time slot */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          <Clock className="inline w-4 h-4 mr-1.5 text-emerald-600" />
          Preferred Start Time
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              type="button"
              onClick={() => {
                updateForm({ timeSlot: slot });
                setErrors((prev) => ({ ...prev, timeSlot: undefined }));
              }}
              className={cn(
                'py-2 px-1 text-xs font-semibold rounded-xl border-2 transition-all',
                formState.timeSlot === slot
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 text-slate-600 hover:border-emerald-300'
              )}
            >
              {slot}
            </button>
          ))}
        </div>
        {errors.timeSlot && <p className="text-xs text-red-500 mt-1">{errors.timeSlot}</p>}
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          <MapPin className="inline w-4 h-4 mr-1.5 text-emerald-600" />
          Service Address
        </label>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            placeholder="Street address"
            value={formState.address}
            onChange={(e) => {
              updateForm({ address: e.target.value });
              setErrors((prev) => ({ ...prev, address: undefined }));
            }}
            className={cn(
              'w-full rounded-xl border px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition placeholder:text-slate-300',
              errors.address ? 'border-red-400' : 'border-slate-200'
            )}
          />
          {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <input
                type="text"
                placeholder="Suburb"
                value={formState.suburb}
                onChange={(e) => {
                  updateForm({ suburb: e.target.value });
                  setErrors((prev) => ({ ...prev, suburb: undefined }));
                }}
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition placeholder:text-slate-300',
                  errors.suburb ? 'border-red-400' : 'border-slate-200'
                )}
              />
              {errors.suburb && <p className="text-xs text-red-500 mt-1">{errors.suburb}</p>}
            </div>
            <div>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Postcode"
                maxLength={4}
                value={formState.postcode}
                onChange={(e) => {
                  updateForm({ postcode: e.target.value });
                  setErrors((prev) => ({ ...prev, postcode: undefined }));
                }}
                className={cn(
                  'w-full rounded-xl border px-4 py-3 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition placeholder:text-slate-300',
                  errors.postcode ? 'border-red-400' : 'border-slate-200'
                )}
              />
              {errors.postcode && <p className="text-xs text-red-500 mt-1">{errors.postcode}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" onClick={prevStep} className="flex-1">
          Back
        </Button>
        <Button onClick={handleNext} className="flex-1">
          Review & Pay
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
