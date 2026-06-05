'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CounterInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  label: string;
  sublabel?: string;
}

export function CounterInput({
  value,
  onChange,
  min = 0,
  max = 10,
  label,
  sublabel,
}: CounterInputProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div>
        <p className="font-semibold text-slate-800">{label}</p>
        {sublabel && <p className="text-sm text-slate-400 mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all',
            value <= min
              ? 'border-slate-200 text-slate-300 cursor-not-allowed'
              : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'
          )}
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center text-xl font-bold text-slate-800">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            'w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all',
            value >= max
              ? 'border-slate-200 text-slate-300 cursor-not-allowed'
              : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50 active:bg-emerald-100'
          )}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
