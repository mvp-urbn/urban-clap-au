export const CONTRACTOR_CATEGORIES = [
  { id: 'cleaning',        label: 'Home Cleaning',   icon: '🧹', requiresInsurance: true,  requiresLicense: false, requiresEquipment: false },
  { id: 'mowing',          label: 'Lawn Mowing',     icon: '🌿', requiresInsurance: false, requiresLicense: false, requiresEquipment: true  },
  { id: 'gardening',       label: 'Gardening',       icon: '🌱', requiresInsurance: false, requiresLicense: false, requiresEquipment: true  },
  { id: 'handyman',        label: 'Handyman',        icon: '🔧', requiresInsurance: true,  requiresLicense: true,  requiresEquipment: false },
  { id: 'carpet_cleaning', label: 'Carpet Cleaning', icon: '🧽', requiresInsurance: false, requiresLicense: false, requiresEquipment: true  },
  { id: 'window_cleaning', label: 'Window Cleaning', icon: '🪟', requiresInsurance: false, requiresLicense: false, requiresEquipment: false },
  { id: 'pest_control',    label: 'Pest Control',    icon: '🐛', requiresInsurance: true,  requiresLicense: true,  requiresEquipment: false },
] as const;

export type ContractorCategoryId = typeof CONTRACTOR_CATEGORIES[number]['id'];
