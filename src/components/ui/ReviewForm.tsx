'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Star, CheckCircle2 } from 'lucide-react';
import { submitReview } from '@/app/actions/bookings';
import { Button } from '@/components/ui/Button';

const LABELS = ['', 'Terrible', 'Poor', 'OK', 'Good', 'Excellent!'];

interface ReviewFormProps {
  bookingId: string;
  existingRating?: number | null;
  existingComment?: string | null;
}

export function ReviewForm({ bookingId, existingRating, existingComment }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(existingRating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState(existingComment ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(!!existingRating);
  const [error, setError] = useState('');

  // Read-only display after submission
  if (submitted) {
    return (
      <div className="pt-3 border-t border-slate-100 space-y-1.5">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="text-xs font-semibold text-slate-600">Your review</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Star
              key={i}
              className={`w-4 h-4 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
            />
          ))}
          <span className="text-xs text-slate-400 ml-1">{LABELS[rating]}</span>
        </div>
        {comment && (
          <p className="text-xs text-slate-500 italic">"{comment}"</p>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please pick a star rating.');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: err } = await submitReview(bookingId, rating, comment.trim());
    setSubmitting(false);
    if (err) {
      setError(err);
      return;
    }
    setSubmitted(true);
    router.refresh();
  };

  return (
    <div className="pt-3 border-t border-slate-100 space-y-3">
      <p className="text-xs font-semibold text-slate-600">How was your clean?</p>

      {/* Star selector */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            type="button"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(i)}
            className="p-1 rounded-lg hover:bg-amber-50 transition-colors"
            aria-label={`Rate ${i} star${i > 1 ? 's' : ''}`}
          >
            <Star
              className={`w-6 h-6 transition-colors ${
                i <= (hovered || rating)
                  ? 'fill-amber-400 text-amber-400'
                  : 'text-slate-200 hover:text-amber-300'
              }`}
            />
          </button>
        ))}
        {(hovered || rating) > 0 && (
          <span className="ml-1 text-xs font-semibold text-amber-600">
            {LABELS[hovered || rating]}
          </span>
        )}
      </div>

      {/* Comment */}
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us what you thought (optional)..."
        rows={2}
        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors placeholder:text-slate-300"
      />

      {error && <p className="text-xs text-red-500">{error}</p>}

      <Button
        variant="primary"
        size="sm"
        onClick={handleSubmit}
        isLoading={submitting}
        className="w-full"
      >
        <Star className="w-4 h-4" />
        Submit Review
      </Button>
    </div>
  );
}
