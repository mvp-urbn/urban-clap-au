import { useMemo } from 'react';
import { ServiceTier, TIER_MULTIPLIERS } from '@/types';

const BASE_PRICE_CENTS = 6900;   // $69.00 AUD
const BEDROOM_RATE_CENTS = 3500; // $35.00 per bedroom
const BATHROOM_RATE_CENTS = 2500; // $25.00 per bathroom

export interface PricingResult {
  subtotalCents: number;
  totalCents: number;
  gstCents: number;
  formattedTotal: string;
  formattedSubtotal: string;
  formattedGST: string;
  contractorPayoutCents: number;
  formattedContractorPayout: string;
}

function centsToAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function calculatePrice(
  bedrooms: number,
  bathrooms: number,
  tier: ServiceTier | null
): PricingResult {
  const multiplier = tier ? TIER_MULTIPLIERS[tier] : 1;

  const rawCents =
    BASE_PRICE_CENTS +
    bedrooms * BEDROOM_RATE_CENTS +
    bathrooms * BATHROOM_RATE_CENTS;

  // Apply multiplier in integer math (multiply by 10, then divide to avoid float errors)
  const subtotalCents = Math.round(rawCents * multiplier);

  // GST is already included in Australian pricing (price is GST-inclusive)
  // GST component = total / 11
  const gstCents = Math.round(subtotalCents / 11);
  const totalCents = subtotalCents;

  const contractorPayoutCents = Math.round(totalCents * 0.8);

  return {
    subtotalCents,
    totalCents,
    gstCents,
    formattedTotal: centsToAUD(totalCents),
    formattedSubtotal: centsToAUD(subtotalCents),
    formattedGST: centsToAUD(gstCents),
    contractorPayoutCents,
    formattedContractorPayout: centsToAUD(contractorPayoutCents),
  };
}

export function usePricingCalculator(
  bedrooms: number,
  bathrooms: number,
  tier: ServiceTier | null
): PricingResult {
  return useMemo(
    () => calculatePrice(bedrooms, bathrooms, tier),
    [bedrooms, bathrooms, tier]
  );
}
