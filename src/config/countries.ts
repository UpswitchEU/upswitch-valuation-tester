// 🗺️ Target Countries Configuration
// Focus on BENELUX + Germany, UK, and France

export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: string;
  currencySymbol: string;
  locale: string;
  taxSystem: string;
}

export const TARGET_COUNTRIES: Country[] = [
  {
    code: 'BE',
    name: 'Belgium',
    flag: '🇧🇪',
    currency: 'EUR',
    currencySymbol: '€',
    locale: 'nl-BE', // Dutch Belgium default, can add fr-BE
    taxSystem: 'belgian',
  },
  // Temporarily disabled - only Belgium supported for now
  // {
  //   code: 'NL',
  //   name: 'Netherlands',
  //   flag: '🇳🇱',
  //   currency: 'EUR',
  //   currencySymbol: '€',
  //   locale: 'nl-NL',
  //   taxSystem: 'dutch',
  // },
  // {
  //   code: 'LU',
  //   name: 'Luxembourg',
  //   flag: '🇱🇺',
  //   currency: 'EUR',
  //   currencySymbol: '€',
  //   locale: 'fr-LU',
  //   taxSystem: 'luxembourg',
  // },
  // {
  //   code: 'DE',
  //   name: 'Germany',
  //   flag: '🇩🇪',
  //   currency: 'EUR',
  //   currencySymbol: '€',
  //   locale: 'de-DE',
  //   taxSystem: 'german',
  // },
  // {
  //   code: 'GB',
  //   name: 'United Kingdom',
  //   flag: '🇬🇧',
  //   currency: 'GBP',
  //   currencySymbol: '£',
  //   locale: 'en-GB',
  //   taxSystem: 'uk',
  // },
  // {
  //   code: 'FR',
  //   name: 'France',
  //   flag: '🇫🇷',
  //   currency: 'EUR',
  //   currencySymbol: '€',
  //   locale: 'fr-FR',
  //   taxSystem: 'french',
  // },
] as const;

export const DEFAULT_COUNTRY = TARGET_COUNTRIES[0]; // Belgium

// Helper functions
export function getCountryByCode(code: string): Country | undefined {
  return TARGET_COUNTRIES.find(c => c.code === code);
}

export function formatCurrency(amount: number, countryCode: string): string {
  const country = getCountryByCode(countryCode);
  if (!country) return `€${amount.toLocaleString()}`;

  return new Intl.NumberFormat(country.locale, {
    style: 'currency',
    currency: country.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getCurrencySymbol(countryCode: string): string {
  const country = getCountryByCode(countryCode);
  return country?.currencySymbol || '€';
}

// Industry categories relevant for these markets
export const INDUSTRIES = [
  'Technology & Software',
  'E-commerce & Retail',
  'Manufacturing',
  'Professional Services',
  'Healthcare & Life Sciences',
  'Financial Services',
  'Real Estate',
  'Hospitality & Tourism',
  'Transportation & Logistics',
  'Construction',
  'Energy & Utilities',
  'Food & Beverage',
  'Media & Entertainment',
  'Education',
  'Agriculture',
  'Other',
] as const;

export type Industry = typeof INDUSTRIES[number];

