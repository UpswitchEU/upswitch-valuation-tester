/**
 * Business Types Configuration
 * 
 * Synchronized with main platform (120+ business types).
 * Imports from the centralized business types configuration.
 * These are used in the Business Model dropdown for valuations.
 * 
 * NOTE: This file is in the valuation tester app which is separate from the main frontend.
 * We duplicate the types here for independence, but they should stay in sync.
 */

// Import the business types data structure
// For now, we'll define it locally to keep valuation tester independent
// TODO: Consider sharing types via a shared package if repos are unified

export interface BusinessTypeOption {
  value: string;
  label: string;
  icon?: string;
  category: string;
}

// Export all 120+ business types from main platform
export const BUSINESS_TYPES: BusinessTypeOption[] = [
  // 🍽️ Food & Beverage (15 types)
  { value: 'restaurant', label: '🍴 Restaurant', category: 'Food & Beverage' },
  { value: 'catering', label: '🍽️ Catering', category: 'Food & Beverage' },
  { value: 'bakery', label: '🥐 Bakery', category: 'Food & Beverage' },
  { value: 'coffee-shop', label: '☕ Coffee Shop', category: 'Food & Beverage' },
  { value: 'food-truck', label: '🚚 Food Truck', category: 'Food & Beverage' },
  { value: 'brewery', label: '🍺 Brewery', category: 'Food & Beverage' },
  { value: 'winery', label: '🍷 Winery', category: 'Food & Beverage' },
  { value: 'bar-pub', label: '🍻 Bar / Pub', category: 'Food & Beverage' },
  { value: 'juice-bar', label: '🥤 Juice Bar', category: 'Food & Beverage' },
  { value: 'ice-cream', label: '🍦 Ice Cream Shop', category: 'Food & Beverage' },
  { value: 'chef', label: '👨‍🍳 Chef Services', category: 'Food & Beverage' },
  { value: 'meals', label: '🍱 Meal Services', category: 'Food & Beverage' },
  { value: 'food-distribution', label: '📦 Food Distribution', category: 'Food & Beverage' },
  { value: 'butcher', label: '🥩 Butcher / Meat Shop', category: 'Food & Beverage' },
  { value: 'grocery-specialty', label: '🛍️ Specialty Grocery', category: 'Food & Beverage' },

  // 💅 Beauty & Wellness (12 types)
  { value: 'hairstyling', label: '💇‍♀️ Hair Salon', category: 'Beauty & Wellness' },
  { value: 'nail-salon', label: '💅 Nail Salon', category: 'Beauty & Wellness' },
  { value: 'spa', label: '🧖‍♀️ Spa', category: 'Beauty & Wellness' },
  { value: 'massage', label: '💆‍♀️ Massage Therapy', category: 'Beauty & Wellness' },
  { value: 'makeup', label: '💄 Makeup Services', category: 'Beauty & Wellness' },
  { value: 'skincare-clinic', label: '✨ Skincare Clinic', category: 'Beauty & Wellness' },
  { value: 'tattoo-parlor', label: '💉 Tattoo Parlor', category: 'Beauty & Wellness' },
  { value: 'piercing-studio', label: '💍 Piercing Studio', category: 'Beauty & Wellness' },
  { value: 'tanning-salon', label: '☀️ Tanning Salon', category: 'Beauty & Wellness' },
  { value: 'barber-shop', label: '✂️ Barbershop', category: 'Beauty & Wellness' },
  { value: 'beauty-supply', label: '🎀 Beauty Supply Store', category: 'Beauty & Wellness' },
  { value: 'wellness', label: '🧘‍♀️ Wellness Center', category: 'Beauty & Wellness' },

  // 💪 Fitness & Health (10 types)
  { value: 'gym', label: '🏋️ Gym & Fitness Center', category: 'Fitness & Health' },
  { value: 'personaltraining', label: '💪 Personal Training', category: 'Fitness & Health' },
  { value: 'yoga-studio', label: '🧘 Yoga Studio', category: 'Fitness & Health' },
  { value: 'pilates-studio', label: '🤸 Pilates Studio', category: 'Fitness & Health' },
  { value: 'martial-arts', label: '🥋 Martial Arts School', category: 'Fitness & Health' },
  { value: 'healthcare', label: '⚕️ Healthcare Services', category: 'Fitness & Health' },
  { value: 'physical-therapy', label: '🦴 Physical Therapy', category: 'Fitness & Health' },
  { value: 'chiropractic', label: '💆 Chiropractic', category: 'Fitness & Health' },
  { value: 'nutrition-counseling', label: '🥗 Nutrition Counseling', category: 'Fitness & Health' },
  { value: 'mental-health', label: '🧠 Mental Health Services', category: 'Fitness & Health' },

  // 📸 Creative & Media (10 types)
  { value: 'photography', label: '📸 Photography', category: 'Creative & Media' },
  { value: 'videography', label: '🎥 Videography', category: 'Creative & Media' },
  { value: 'design', label: '🎨 Design Services', category: 'Creative & Media' },
  { value: 'marketing', label: '📱 Marketing Agency', category: 'Creative & Media' },
  { value: 'content-creation', label: '✍️ Content Creation', category: 'Creative & Media' },
  { value: 'social-media', label: '📲 Social Media Management', category: 'Creative & Media' },
  { value: 'advertising-agency', label: '📺 Advertising Agency', category: 'Creative & Media' },
  { value: 'printing', label: '🖨️ Printing Services', category: 'Creative & Media' },
  { value: 'animation', label: '🎬 Animation Services', category: 'Creative & Media' },
  { value: 'music-production', label: '🎵 Music Production', category: 'Creative & Media' },

  // 💻 Tech & Digital (15 types)
  { value: 'saas', label: '💻 SaaS', category: 'Tech & Digital' },
  { value: 'software', label: '⚙️ Software Development', category: 'Tech & Digital' },
  { value: 'webdev', label: '🌐 Web Development', category: 'Tech & Digital' },
  { value: 'mobile-app', label: '📱 Mobile App Development', category: 'Tech & Digital' },
  { value: 'itsupport', label: '🖥️ IT Support', category: 'Tech & Digital' },
  { value: 'cybersecurity', label: '🔒 Cybersecurity', category: 'Tech & Digital' },
  { value: 'data-analytics', label: '📊 Data Analytics', category: 'Tech & Digital' },
  { value: 'ai-ml', label: '🤖 AI / Machine Learning', category: 'Tech & Digital' },
  { value: 'blockchain', label: '⛓️ Blockchain Services', category: 'Tech & Digital' },
  { value: 'game-development', label: '🎮 Game Development', category: 'Tech & Digital' },
  { value: 'cloud-services', label: '☁️ Cloud Services', category: 'Tech & Digital' },
  { value: 'seo-services', label: '🔍 SEO Services', category: 'Tech & Digital' },
  { value: 'ui-ux-design', label: '🎯 UI/UX Design', category: 'Tech & Digital' },
  { value: 'tech-training', label: '👨‍💻 Tech Training', category: 'Tech & Digital' },
  { value: 'computer-repair', label: '🔧 Computer Repair', category: 'Tech & Digital' },

  // 🛒 E-commerce & Retail (12 types)
  { value: 'ecommerce', label: '🛒 E-commerce Store', category: 'E-commerce & Retail' },
  { value: 'retail', label: '🏪 Retail Store', category: 'E-commerce & Retail' },
  { value: 'dropshipping', label: '📦 Dropshipping Business', category: 'E-commerce & Retail' },
  { value: 'print-on-demand', label: '👕 Print on Demand', category: 'E-commerce & Retail' },
  { value: 'subscription', label: '📦 Subscription Box', category: 'E-commerce & Retail' },
  { value: 'marketplace', label: '🏬 Online Marketplace', category: 'E-commerce & Retail' },
  { value: 'affiliate-marketing', label: '🤝 Affiliate Marketing', category: 'E-commerce & Retail' },
  { value: 'digital-products', label: '💾 Digital Products', category: 'E-commerce & Retail' },
  { value: 'bookstore', label: '📚 Bookstore', category: 'E-commerce & Retail' },
  { value: 'clothing-store', label: '👗 Clothing Store', category: 'E-commerce & Retail' },
  { value: 'jewelry-store', label: '💎 Jewelry Store', category: 'E-commerce & Retail' },
  { value: 'toy-store', label: '🧸 Toy Store', category: 'E-commerce & Retail' },

  // 🏠 Home & Property (10 types)
  { value: 'cleaning', label: '🧹 Cleaning Services', category: 'Home & Property' },
  { value: 'realestate', label: '🏡 Real Estate', category: 'Home & Property' },
  { value: 'construction', label: '🔨 Construction', category: 'Home & Property' },
  { value: 'landscaping', label: '🌳 Landscaping', category: 'Home & Property' },
  { value: 'painting', label: '🎨 Painting Services', category: 'Home & Property' },
  { value: 'plumbing', label: '🔧 Plumbing Services', category: 'Home & Property' },
  { value: 'electrical', label: '⚡ Electrical Services', category: 'Home & Property' },
  { value: 'hvac', label: '❄️ HVAC Services', category: 'Home & Property' },
  { value: 'roofing', label: '🏠 Roofing Services', category: 'Home & Property' },
  { value: 'interior-design', label: '🛋️ Interior Design', category: 'Home & Property' },

  // 💼 Professional Services (12 types)
  { value: 'consulting', label: '💼 Business Consulting', category: 'Professional Services' },
  { value: 'legal', label: '⚖️ Legal Services', category: 'Professional Services' },
  { value: 'accounting', label: '📊 Accounting & Finance', category: 'Professional Services' },
  { value: 'hr', label: '👥 HR & Recruitment', category: 'Professional Services' },
  { value: 'bookkeeping', label: '📚 Bookkeeping Services', category: 'Professional Services' },
  { value: 'payroll', label: '💵 Payroll Services', category: 'Professional Services' },
  { value: 'translation', label: '🌍 Translation Services', category: 'Professional Services' },
  { value: 'notary', label: '📜 Notary Services', category: 'Professional Services' },
  { value: 'virtual-assistant', label: '💻 Virtual Assistant', category: 'Professional Services' },
  { value: 'business-brokerage', label: '🤝 Business Brokerage', category: 'Professional Services' },
  { value: 'public-relations', label: '📢 Public Relations', category: 'Professional Services' },
  { value: 'market-research', label: '📈 Market Research', category: 'Professional Services' },

  // 📚 Education & Training (8 types)
  { value: 'education', label: '📚 Education & Training', category: 'Education & Training' },
  { value: 'coaching', label: '🎯 Coaching', category: 'Education & Training' },
  { value: 'tutoring', label: '✏️ Tutoring Services', category: 'Education & Training' },
  { value: 'language-school', label: '🗣️ Language School', category: 'Education & Training' },
  { value: 'music-school', label: '🎸 Music School', category: 'Education & Training' },
  { value: 'dance-studio', label: '💃 Dance Studio', category: 'Education & Training' },
  { value: 'art-classes', label: '🎨 Art Classes', category: 'Education & Training' },
  { value: 'childcare', label: '👶 Childcare / Daycare', category: 'Education & Training' },

  // 🚗 Transportation & Logistics (8 types)
  { value: 'logistics', label: '🚚 Logistics & Delivery', category: 'Transportation & Logistics' },
  { value: 'moving-company', label: '📦 Moving Company', category: 'Transportation & Logistics' },
  { value: 'taxi-rideshare', label: '🚕 Taxi / Rideshare', category: 'Transportation & Logistics' },
  { value: 'limo-service', label: '🚗 Limousine Service', category: 'Transportation & Logistics' },
  { value: 'truck-rental', label: '🚛 Truck Rental', category: 'Transportation & Logistics' },
  { value: 'parking-services', label: '🅿️ Parking Services', category: 'Transportation & Logistics' },
  { value: 'freight-broker', label: '📋 Freight Brokerage', category: 'Transportation & Logistics' },
  { value: 'warehousing', label: '🏭 Warehousing & Storage', category: 'Transportation & Logistics' },

  // 🎉 Events & Entertainment (8 types)
  { value: 'events', label: '🎉 Event Planning', category: 'Events & Entertainment' },
  { value: 'entertainment', label: '🎭 Entertainment', category: 'Events & Entertainment' },
  { value: 'party-rental', label: '🎈 Party Rental', category: 'Events & Entertainment' },
  { value: 'venue', label: '🏛️ Event Venue', category: 'Events & Entertainment' },
  { value: 'florist', label: '💐 Florist', category: 'Events & Entertainment' },
  { value: 'amusement', label: '🎪 Amusement Services', category: 'Events & Entertainment' },
  { value: 'theater', label: '🎬 Theater / Performance', category: 'Events & Entertainment' },
  { value: 'magician', label: '🎩 Magician / Entertainer', category: 'Events & Entertainment' },

  // 💰 Financial Services (6 types)
  { value: 'insurance-broker', label: '🛡️ Insurance Brokerage', category: 'Financial Services' },
  { value: 'financial-planning', label: '💰 Financial Planning', category: 'Financial Services' },
  { value: 'tax-preparation', label: '📋 Tax Preparation', category: 'Financial Services' },
  { value: 'mortgage-broker', label: '🏦 Mortgage Brokerage', category: 'Financial Services' },
  { value: 'investment-advisory', label: '📈 Investment Advisory', category: 'Financial Services' },
  { value: 'credit-repair', label: '💳 Credit Repair', category: 'Financial Services' },

  // 🐾 Pet Services (6 types)
  { value: 'pet-grooming', label: '🐕 Pet Grooming', category: 'Pet Services' },
  { value: 'pet-training', label: '🎾 Pet Training', category: 'Pet Services' },
  { value: 'pet-sitting', label: '🏠 Pet Sitting / Boarding', category: 'Pet Services' },
  { value: 'veterinary', label: '⚕️ Veterinary Services', category: 'Pet Services' },
  { value: 'pet-store', label: '🐾 Pet Store', category: 'Pet Services' },
  { value: 'dog-walking', label: '🦮 Dog Walking', category: 'Pet Services' },

  // 🔧 Automotive Services (7 types)
  { value: 'automotive', label: '🚗 Auto Repair', category: 'Automotive Services' },
  { value: 'car-detailing', label: '✨ Car Detailing', category: 'Automotive Services' },
  { value: 'car-rental', label: '🚙 Car Rental', category: 'Automotive Services' },
  { value: 'auto-parts', label: '🔩 Auto Parts', category: 'Automotive Services' },
  { value: 'tire-shop', label: '⚙️ Tire Shop', category: 'Automotive Services' },
  { value: 'body-shop', label: '🔧 Auto Body Shop', category: 'Automotive Services' },
  { value: 'oil-change', label: '🛢️ Oil Change Service', category: 'Automotive Services' },

  // 🏨 Hospitality & Tourism (6 types)
  { value: 'hotel', label: '🏨 Hotel / Lodging', category: 'Hospitality & Tourism' },
  { value: 'bed-breakfast', label: '🛏️ Bed & Breakfast', category: 'Hospitality & Tourism' },
  { value: 'vacation-rental', label: '🏖️ Vacation Rental', category: 'Hospitality & Tourism' },
  { value: 'travel-agency', label: '✈️ Travel Agency', category: 'Hospitality & Tourism' },
  { value: 'tour-operator', label: '🗺️ Tour Operator', category: 'Hospitality & Tourism' },
  { value: 'campground', label: '⛺ Campground / RV Park', category: 'Hospitality & Tourism' },

  // 🌾 Agriculture & Farming (5 types)
  { value: 'farm', label: '🚜 Farm / Agricultural', category: 'Agriculture & Farming' },
  { value: 'nursery', label: '🪴 Plant Nursery', category: 'Agriculture & Farming' },
  { value: 'organic-farm', label: '🥬 Organic Farm', category: 'Agriculture & Farming' },
  { value: 'livestock', label: '🐄 Livestock / Ranch', category: 'Agriculture & Farming' },
  { value: 'aquaculture', label: '🐟 Aquaculture / Fish Farm', category: 'Agriculture & Farming' },

  // Backwards compatibility
  { value: 'b2b_saas', label: '💻 B2B SaaS', category: 'Tech & Digital' },
  { value: 'b2c', label: 'B2C', category: 'General' },
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

