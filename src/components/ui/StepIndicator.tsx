'use client';

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = ['Service', 'Rooms', 'Package', 'Schedule', 'Checkout'];

export function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex items-center justify-between w-full px-2">
      {STEPS.map((label, index) => {
        const stepNum = index + 1;
        const isCompleted = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  isCompleted && 'bg-emerald-600 text-white',
                  isActive && 'bg-emerald-600 text-white ring-4 ring-emerald-100',
                  !isCompleted && !isActive && 'bg-slate-100 text-slate-400'
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <span>{stepNum}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-[10px] font-medium hidden sm:block',
                  isActive ? 'text-emerald-700' : 'text-slate-400'
                )}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 flex-1 mx-1 transition-all duration-300',
                  stepNum < currentStep ? 'bg-emerald-500' : 'bg-slate-200'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
