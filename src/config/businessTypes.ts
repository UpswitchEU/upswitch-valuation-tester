/**
 * Business Types Configuration
 * 
 * Comprehensive list of business types matching the main platform's business card prelude.
 * These are used in the Business Model dropdown for valuations.
 */

export interface BusinessTypeOption {
  value: string;
  label: string;
  icon?: string;
  category: string;
}

export const BUSINESS_TYPES: BusinessTypeOption[] = [
  // 🍽️ Food & Beverage Services
  { value: 'catering', label: '🍽️ Catering', category: 'Food & Beverage' },
  { value: 'chef', label: '👨‍🍳 Chef Services', category: 'Food & Beverage' },
  { value: 'meals', label: '🍱 Meal Services', category: 'Food & Beverage' },
  { value: 'restaurant', label: '🍴 Restaurant', category: 'Food & Beverage' },

  // 💅 Beauty & Wellness Services
  { value: 'hairstyling', label: '💇‍♀️ Hairstyling', category: 'Beauty & Wellness' },
  { value: 'makeup', label: '💄 Make-up', category: 'Beauty & Wellness' },
  { value: 'massage', label: '💆‍♀️ Massage', category: 'Beauty & Wellness' },
  { value: 'nailcare', label: '💅 Nail Care', category: 'Beauty & Wellness' },
  { value: 'wellness', label: '🧘‍♀️ Wellness Treatments', category: 'Beauty & Wellness' },

  // 💪 Fitness & Health
  { value: 'personaltraining', label: '💪 Personal Training', category: 'Fitness & Health' },
  { value: 'gym', label: '🏋️ Gym & Fitness', category: 'Fitness & Health' },
  { value: 'healthcare', label: '⚕️ Healthcare Services', category: 'Fitness & Health' },

  // 📸 Creative & Media
  { value: 'photography', label: '📸 Photography', category: 'Creative & Media' },
  { value: 'videography', label: '🎥 Videography', category: 'Creative & Media' },
  { value: 'design', label: '🎨 Design Services', category: 'Creative & Media' },
  { value: 'marketing', label: '📱 Marketing Agency', category: 'Creative & Media' },

  // 💻 Tech & Digital
  { value: 'saas', label: '💻 SaaS', category: 'Tech & Digital' },
  { value: 'software', label: '⚙️ Software Development', category: 'Tech & Digital' },
  { value: 'webdev', label: '🌐 Web Development', category: 'Tech & Digital' },
  { value: 'itsupport', label: '🖥️ IT Support', category: 'Tech & Digital' },

  // 🛒 E-commerce & Retail
  { value: 'ecommerce', label: '🛒 E-commerce', category: 'E-commerce & Retail' },
  { value: 'retail', label: '🏪 Retail Store', category: 'E-commerce & Retail' },
  { value: 'subscription', label: '📦 Subscription Box', category: 'E-commerce & Retail' },

  // 🏠 Home & Property Services
  { value: 'cleaning', label: '🧹 Cleaning Services', category: 'Home & Property' },
  { value: 'realestate', label: '🏡 Real Estate', category: 'Home & Property' },
  { value: 'construction', label: '🔨 Construction', category: 'Home & Property' },
  { value: 'landscaping', label: '🌳 Landscaping', category: 'Home & Property' },

  // 💼 Professional Services
  { value: 'consulting', label: '💼 Business Consulting', category: 'Professional Services' },
  { value: 'legal', label: '⚖️ Legal Services', category: 'Professional Services' },
  { value: 'accounting', label: '📊 Accounting & Finance', category: 'Professional Services' },
  { value: 'hr', label: '👥 HR & Recruitment', category: 'Professional Services' },

  // 📚 Education & Training
  { value: 'education', label: '📚 Education & Training', category: 'Education & Training' },
  { value: 'coaching', label: '🎯 Coaching', category: 'Education & Training' },

  // 🚗 Transportation & Logistics
  { value: 'logistics', label: '🚚 Logistics & Delivery', category: 'Transportation & Logistics' },
  { value: 'automotive', label: '🚗 Automotive Services', category: 'Transportation & Logistics' },

  // 🎉 Events & Entertainment
  { value: 'events', label: '🎉 Event Planning', category: 'Events & Entertainment' },
  { value: 'entertainment', label: '🎭 Entertainment', category: 'Events & Entertainment' },

  // Backwards compatibility with old generic types
  { value: 'b2b_saas', label: '💻 B2B SaaS', category: 'Tech & Digital' },
  { value: 'b2c', label: 'B2C', category: 'General' },
  { value: 'marketplace', label: 'Marketplace', category: 'E-commerce & Retail' },
  { value: 'manufacturing', label: 'Manufacturing', category: 'General' },
  { value: 'services', label: 'Services (General)', category: 'General' },
  { value: 'other', label: 'Other', category: 'General' },
];

/**
 * Get grouped business types for categorized dropdown
 */
export const getGroupedBusinessTypes = (): Record<string, BusinessTypeOption[]> => {
  const grouped: Record<string, BusinessTypeOption[]> = {};
  
  BUSINESS_TYPES.forEach(type => {
    if (!grouped[type.category]) {
      grouped[type.category] = [];
    }
    grouped[type.category].push(type);
  });
  
  return grouped;
};

/**
 * Get business type label by value
 */
export const getBusinessTypeLabel = (value: string): string => {
  const type = BUSINESS_TYPES.find(t => t.value === value);
  return type?.label || value;
};

