'use client';

import { Check, Star, ChevronRight, Shield, Zap } from 'lucide-react';
import { useBooking } from '@/context/BookingContext';
import { Button } from '@/components/ui/Button';
import { usePricingCalculator } from '@/hooks/usePricingCalculator';
import { ServiceTier } from '@/types';
import { cn } from '@/lib/utils';

interface TierConfig {
  tier: ServiceTier;
  icon: React.ReactNode;
  tagline: string;
  gradient: string;
  borderColor: string;
  bgColor: string;
  textColor: string;
  badgeColor: string;
  features: string[];
  popular?: boolean;
}

const TIERS: TierConfig[] = [
  {
    tier: 'Silver',
    icon: <Shield className="w-5 h-5" />,
    tagline: 'Great value everyday clean',
    gradient: 'from-slate-500 to-slate-700',
    borderColor: 'border-slate-300',
    bgColor: 'bg-slate-50',
    textColor: 'text-slate-700',
    badgeColor: 'bg-slate-600',
    features: [
      'Vacuuming all rooms',
      'Mopping hard floors',
      'Bathroom & toilet clean',
      'Kitchen wipe-down',
      'Rubbish removal',
    ],
  },
  {
    tier: 'Gold',
    icon: <Star className="w-5 h-5" />,
    tagline: 'Deep clean, sparkling results',
    gradient: 'from-amber-400 to-amber-600',
    borderColor: 'border-amber-300',
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    badgeColor: 'bg-amber-500',
    features: [
      'Everything in Silver',
      'Window wiping (interior)',
      'Deep kitchen scrub',
      'Cabinet door wipe-down',
      'Skirting board clean',
    ],
    popular: true,
  },
  {
    tier: 'Pro',
    icon: <Zap className="w-5 h-5" />,
    tagline: 'Elite clean, top-rated pros only',
    gradient: 'from-violet-500 to-violet-700',
    borderColor: 'border-violet-300',
    bgColor: 'bg-violet-50',
    textColor: 'text-violet-700',
    badgeColor: 'bg-violet-600',
    features: [
      'Everything in Gold',
      'Inside oven clean',
      'Inside fridge clean',
      'Laundry wipe-down',
      'Top-rated contractors only',
    ],
  },
];

export function StepTier() {
  const { formState, updateForm, nextStep, prevStep } = useBooking();
  const { bedrooms, bathrooms, tier: selectedTier } = formState;

  const silverPricing = usePricingCalculator(bedrooms, bathrooms, 'Silver');
  const goldPricing = usePricingCalculator(bedrooms, bathrooms, 'Gold');
  const proPricing = usePricingCalculator(bedrooms, bathrooms, 'Pro');

  const pricingMap: Record<ServiceTier, ReturnType<typeof usePricingCalculator>> = {
    Silver: silverPricing,
    Gold: goldPricing,
    Pro: proPricing,
  };

  const handleSelect = (tier: ServiceTier) => {
    updateForm({ tier, totalPriceCents: pricingMap[tier].totalCents });
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Choose your package</h2>
        <p className="text-slate-500 text-sm mt-1">All prices include GST. No hidden fees.</p>
      </div>

      <div className="flex flex-col gap-3">
        {TIERS.map((config) => {
          const pricing = pricingMap[config.tier];
          const isSelected = selectedTier === config.tier;

          return (
            <button
              key={config.tier}
              type="button"
              onClick={() => handleSelect(config.tier)}
              className={cn(
                'relative w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 active:scale-[0.99]',
                isSelected
                  ? `${config.borderColor} ${config.bgColor} ring-2 ring-offset-1 ring-current`
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
              style={isSelected ? { '--tw-ring-color': config.badgeColor } as React.CSSProperties : {}}
            >
              {config.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-sm">
                    MOST POPULAR
                  </span>
                </div>
              )}

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Tier badge */}
                  <div className={`p-2 rounded-xl text-white bg-gradient-to-br ${config.gradient}`}>
                    {config.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{config.tier}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${config.badgeColor}`}>
                        {config.tier.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{config.tagline}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="text-right shrink-0">
                  <p className="text-xl font-extrabold text-slate-900">
                    {pricing.formattedTotal}
                  </p>
                  <p className="text-[10px] text-slate-400">AUD incl. GST</p>
                </div>
              </div>

              {/* Features */}
              <ul className="mt-3 space-y-1.5">
                {config.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                    <Check className={cn('w-3.5 h-3.5 shrink-0', config.textColor)} />
                    {f}
                  </li>
                ))}
              </ul>

              {isSelected && (
                <div className={cn('mt-3 pt-3 border-t flex items-center gap-1.5 text-xs font-semibold', config.borderColor, config.textColor)}>
                  <Check className="w-3.5 h-3.5" />
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-1">
        <Button variant="secondary" onClick={prevStep} className="flex-1">
          Back
        </Button>
        <Button
          onClick={nextStep}
          disabled={!selectedTier}
          className="flex-1"
        >
          Schedule
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
