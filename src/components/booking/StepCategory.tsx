'use client';

import { Sparkles, Leaf, Dog, Wrench, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { Button } from '@/components/ui/Button';

interface CategoryTile {
  icon: React.ReactNode;
  label: string;
  description: string;
  active: boolean;
  badge?: string;
}

const categories: CategoryTile[] = [
  {
    icon: <Sparkles className="w-7 h-7" />,
    label: 'Home Cleaning',
    description: 'Professional clean, any size home',
    active: true,
    badge: 'Available Now',
  },
  {
    icon: <Leaf className="w-7 h-7" />,
    label: 'Lawn Mowing',
    description: 'Regular & one-off lawn care',
    active: false,
    badge: 'Coming Soon',
  },
  {
    icon: <Dog className="w-7 h-7" />,
    label: 'Dog Wash',
    description: 'Mobile grooming at your door',
    active: false,
    badge: 'Coming Soon',
  },
  {
    icon: <Wrench className="w-7 h-7" />,
    label: 'Handyman',
    description: 'Repairs, assembly & installations',
    active: false,
    badge: 'Coming Soon',
  },
];

export function StepCategory() {
  const { nextStep } = useBooking();

  return (
    <div className="flex flex-col gap-6">
      {/* Hero */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-3">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Fixed Prices · Vetted Pros · Instant Booking
        </div>
        <h1 className="text-2xl font-bold text-slate-900 leading-tight">
          What can we help<br />you with today?
        </h1>
        <p className="text-slate-500 text-sm mt-2">
          Professional home services across Australia
        </p>
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.label}
            type="button"
            onClick={cat.active ? nextStep : undefined}
            disabled={!cat.active}
            className={`relative flex flex-col items-start gap-2 p-4 rounded-2xl border-2 text-left transition-all duration-200 ${
              cat.active
                ? 'border-emerald-500 bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] cursor-pointer'
                : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
            }`}
          >
            {/* Badge */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                cat.active
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-300 text-slate-600'
              }`}
            >
              {cat.badge}
            </span>

            <div
              className={`p-2 rounded-xl ${
                cat.active ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}
            >
              {cat.icon}
            </div>

            <div>
              <p className={`font-bold text-sm ${cat.active ? 'text-slate-900' : 'text-slate-500'}`}>
                {cat.label}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 leading-tight">
                {cat.description}
              </p>
            </div>

            {cat.active && (
              <ChevronRight className="absolute top-4 right-4 w-4 h-4 text-emerald-500" />
            )}
          </button>
        ))}
      </div>

      {/* Trust bar */}
      <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-slate-100">
        {[
          { value: '10,000+', label: 'Bookings Done' },
          { value: '4.9★', label: 'Avg Rating' },
          { value: '100%', label: 'Satisfaction' },
        ].map((stat) => (
          <div key={stat.label}>
            <p className="font-bold text-slate-800 text-base">{stat.value}</p>
            <p className="text-slate-400 text-xs">{stat.label}</p>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={nextStep} className="w-full">
        Book Home Cleaning
        <ChevronRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
