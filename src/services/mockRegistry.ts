/**
 * Mock Registry Service
 * 
 * Simulates backend API responses for development and testing
 * Replace with real API calls when backend is ready
 */

import type { CompanyFinancialData, CompanySearchResult } from '../types/registry';

/**
 * Mock company search
 * Simulates: POST /api/v1/companies/search
 */
export const mockCompanySearch = async (
  companyName: string,
  countryCode: string
): Promise<CompanySearchResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Simulate errors occasionally
  if (Math.random() < 0.05) {
    throw new Error('Registry temporarily unavailable');
  }

  // Mock data based on country
  const mockResults: CompanySearchResult[] = [
    {
      company_id: '12345678',
      company_name: `${companyName} ${getDefaultLegalForm(countryCode)}`,
      registration_number: countryCode === 'GB' ? '12345678' : 'HRB 123456',
      legal_form: getDefaultLegalForm(countryCode),
      address: getDefaultAddress(countryCode),
      status: 'active',
      confidence_score: 0.95
    },
    {
      company_id: '87654321',
      company_name: `${companyName} HOLDINGS ${getDefaultLegalForm(countryCode)}`,
      registration_number: countryCode === 'GB' ? '87654321' : 'HRB 789012',
      legal_form: getDefaultLegalForm(countryCode),
      address: getDefaultAddress(countryCode),
      status: 'active',
      confidence_score: 0.75
    }
  ];

  return mockResults;
};

/**
 * Mock fetch financials
 * Simulates: POST /api/v1/companies/financials
 */
export const mockFetchFinancials = async (
  companyId: string,
  countryCode: string = 'GB'
): Promise<CompanyFinancialData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate errors occasionally
  if (Math.random() < 0.05) {
    throw new Error('Failed to fetch financial data');
  }

  const companyNames: Record<string, string> = {
    'GB': 'Tech Solutions Ltd',
    'BE': 'Innovate NV',
    'DE': 'Acme GmbH',
    'NL': 'Digital BV',
    'FR': 'Solutions SAS',
    'LU': 'Holdings SA'
  };

  const sources: Record<string, string> = {
    'GB': 'UK Companies House',
    'BE': 'Belgium KBO/BCE',
    'DE': 'Germany Bundesanzeiger',
    'NL': 'Netherlands KVK',
    'FR': 'France Infogreffe',
    'LU': 'Luxembourg RCS'
  };

  return {
    company_id: companyId,
    company_name: companyNames[countryCode] || 'Example Company Ltd',
    registration_number: companyId,
    country_code: countryCode,
    legal_form: getDefaultLegalForm(countryCode),
    
    filing_history: [
      {
        year: 2023,
        revenue: 1500000 + Math.random() * 500000,
        ebitda: 250000 + Math.random() * 100000,
        net_income: 180000 + Math.random() * 50000,
        total_assets: 800000 + Math.random() * 200000,
        total_debt: 200000 + Math.random() * 100000,
        cash: 150000 + Math.random() * 50000,
        filing_date: '2024-06-30',
        source_url: getRegistryUrl(countryCode, companyId)
      },
      {
        year: 2022,
        revenue: 1200000 + Math.random() * 300000,
        ebitda: 200000 + Math.random() * 80000,
        net_income: 150000 + Math.random() * 40000,
        total_assets: 650000 + Math.random() * 150000,
        total_debt: 150000 + Math.random() * 50000,
        cash: 100000 + Math.random() * 30000,
        filing_date: '2023-06-30',
        source_url: getRegistryUrl(countryCode, companyId)
      },
      {
        year: 2021,
        revenue: 900000 + Math.random() * 200000,
        ebitda: 150000 + Math.random() * 50000,
        net_income: 110000 + Math.random() * 30000,
        total_assets: 500000 + Math.random() * 100000,
        total_debt: 100000 + Math.random() * 30000,
        cash: 80000 + Math.random() * 20000,
        filing_date: '2022-06-30',
        source_url: getRegistryUrl(countryCode, companyId)
      }
    ],
    
    founding_year: 2015 + Math.floor(Math.random() * 8),
    industry_code: '62012',
    industry_description: 'Software Development & IT Services',
    employees: 30 + Math.floor(Math.random() * 100),
    website: 'https://example.com',
    
    data_source: sources[countryCode] || 'Company Registry',
    source_url: getRegistryUrl(countryCode, companyId),
    last_updated: new Date().toISOString(),
    completeness_score: 0.85 + Math.random() * 0.10
  };
};

// Helper functions
function getDefaultLegalForm(countryCode: string): string {
  const forms: Record<string, string> = {
    'GB': 'Ltd',
    'BE': 'NV',
    'DE': 'GmbH',
    'NL': 'BV',
    'FR': 'SAS',
    'LU': 'SA'
  };
  return forms[countryCode] || 'Ltd';
}

function getDefaultAddress(countryCode: string): string {
  const addresses: Record<string, string> = {
    'GB': 'London, UK',
    'BE': 'Brussels, Belgium',
    'DE': 'Berlin, Germany',
    'NL': 'Amsterdam, Netherlands',
    'FR': 'Paris, France',
    'LU': 'Luxembourg City, Luxembourg'
  };
  return addresses[countryCode] || 'Unknown';
}

function getRegistryUrl(countryCode: string, companyId: string): string {
  const urls: Record<string, string> = {
    'GB': `https://find-and-update.company-information.service.gov.uk/company/${companyId}`,
    'BE': `https://kbopub.economie.fgov.be/kbopub/zoeknummerform.html?nummer=${companyId}`,
    'DE': `https://www.bundesanzeiger.de/company/${companyId}`,
    'NL': `https://www.kvk.nl/orderstraat/product-kiezen/?kvknummer=${companyId}`,
    'FR': `https://www.infogreffe.fr/entreprise/${companyId}`,
    'LU': `https://www.lbr.lu/mjrcs/jsp/IndexActionNotSecured.action?COMPANYID=${companyId}`
  };
  return urls[countryCode] || '#';
}

