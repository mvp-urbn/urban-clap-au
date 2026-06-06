export type UserRole = 'customer' | 'contractor' | 'admin';
export type ServiceTier = 'Silver' | 'Gold' | 'Pro';
export type BookingStatus =
  | 'payment_pending'
  | 'pending_dispatch'
  | 'assigned'
  | 'completed'
  | 'cancelled';

export type ContractorStatus = 'pending' | 'approved' | 'suspended';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  phone_number: string | null;
  postcode: string | null;
  created_at: string;
  // Contractor-specific fields
  abn: string | null;
  insurance_expiry: string | null;
  insurance_document_url: string | null;
  contractor_status: ContractorStatus | null;
  service_postcodes: string[] | null;
  contractor_categories: string[] | null;
  bank_bsb: string | null;
  bank_account_number: string | null;
  experience_years: number | null;
  reference_name: string | null;
  reference_phone: string | null;
  license_number: string | null;
  equipment_owned: boolean | null;
  referral_code: string | null;
  referred_by: string | null;
}

export interface Service {
  id: string;
  category_name: string;
  base_price_cents: number;
  tier: ServiceTier;
  description: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  customer_id: string;
  service_id: string;
  address: string;
  suburb: string;
  postcode: string;
  bedrooms_count: number;
  bathrooms_count: number;
  scheduled_datetime: string;
  status: BookingStatus;
  total_price_cents: number;
  stripe_payment_intent_id: string | null;
  assigned_contractor_id: string | null;
  checkin_otp: string | null;
  checked_in_at: string | null;
  created_at: string;
  // Joined fields
  profiles?: Profile;
  services?: Service;
}

export interface BookingFormState {
  // Step 2
  bedrooms: number;
  bathrooms: number;
  // Step 3
  tier: ServiceTier | null;
  serviceId: string | null;
  // Step 4
  date: string;
  timeSlot: string;
  address: string;
  suburb: string;
  postcode: string;
  // Computed
  totalPriceCents: number;
}

export const TIER_MULTIPLIERS: Record<ServiceTier, number> = {
  Silver: 1.0,
  Gold: 1.4,
  Pro: 1.8,
};

export const TIER_COLORS: Record<ServiceTier, string> = {
  Silver: 'from-slate-400 to-slate-600',
  Gold: 'from-amber-400 to-amber-600',
  Pro: 'from-violet-500 to-violet-700',
};

export const TIER_BADGE_COLORS: Record<ServiceTier, string> = {
  Silver: 'bg-slate-100 text-slate-700 border-slate-200',
  Gold: 'bg-amber-50 text-amber-700 border-amber-200',
  Pro: 'bg-violet-50 text-violet-700 border-violet-200',
};

export interface Review {
  id: string;
  booking_id: string;
  customer_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}
