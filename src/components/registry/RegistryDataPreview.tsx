import React, { useState } from 'react';
import { Building2, TrendingUp, Calendar, ExternalLink, Edit2, Check, X, Calculator } from 'lucide-react';
import type { CompanyFinancialData, FinancialFilingYear } from '../../types/registry';
import { useValuationStore } from '../../store/useValuationStore';

interface RegistryDataPreviewProps {
  companyData: CompanyFinancialData;
  onCalculateValuation: () => void;
}

export const RegistryDataPreview: React.FC<RegistryDataPreviewProps> = ({
  companyData,
  onCalculateValuation
}) => {
  const { updateFormData } = useValuationStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<FinancialFilingYear>(
    companyData.filing_history[0]
  );

  const formatCurrency = (amount: number): string => {
    const symbol = companyData.country_code === 'GB' ? '£' : '€';
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(2)}M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  };

  const getCountryFlag = (code: string): string => {
    const flags: Record<string, string> = {
      'GB': '🇬🇧',
      'BE': '🇧🇪',
      'NL': '🇳🇱',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'LU': '🇱🇺'
    };
    return flags[code] || '🌍';
  };

  const handleSaveEdit = () => {
    // Update the form data with edited values
    const currentYear = editedData.year || new Date().getFullYear();
    
    updateFormData({
      company_name: companyData.company_name,
      country_code: companyData.country_code,
      industry: companyData.industry_description?.toLowerCase().replace(/\s+/g, '_') || 'technology',
      revenue: editedData.revenue,
      ebitda: editedData.ebitda,
      current_year_data: {
        year: currentYear,
        revenue: editedData.revenue || 0,
        ebitda: editedData.ebitda || 0,
        net_income: editedData.net_income,
        total_assets: editedData.total_assets,
        total_debt: editedData.total_debt,
        cash: editedData.cash,
      },
      // Add historical data if available (excluding the current year)
      historical_years_data: companyData.filing_history.slice(1).map(year => ({
        year: year.year,
        revenue: year.revenue || 0,
        ebitda: year.ebitda || 0, // Required field, default to 0
        net_income: year.net_income,
        total_assets: year.total_assets,
        total_debt: year.total_debt,
        cash: year.cash,
      }))
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedData(companyData.filing_history[0]);
    setIsEditing(false);
  };

  const handleCalculate = () => {
    // Ensure data is synced to store
    const currentYear = editedData.year || new Date().getFullYear();
    
    updateFormData({
      company_name: companyData.company_name,
      country_code: companyData.country_code,
      industry: companyData.industry_description?.toLowerCase().replace(/\s+/g, '_') || 'technology',
      revenue: editedData.revenue,
      ebitda: editedData.ebitda,
      current_year_data: {
        year: currentYear,
        revenue: editedData.revenue || 0,
        ebitda: editedData.ebitda || 0,
        net_income: editedData.net_income,
        total_assets: editedData.total_assets,
        total_debt: editedData.total_debt,
        cash: editedData.cash,
      },
      // Add historical data if available (excluding the current year)
      historical_years_data: companyData.filing_history.slice(1).map(year => ({
        year: year.year,
        revenue: year.revenue || 0,
        ebitda: year.ebitda || 0, // Required field, default to 0
        net_income: year.net_income,
        total_assets: year.total_assets,
        total_debt: year.total_debt,
        cash: year.cash,
      }))
    });
    onCalculateValuation();
  };

  const latestYear = companyData.filing_history[0];

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold">{companyData.company_name}</h2>
                <span className="text-3xl">{getCountryFlag(companyData.country_code)}</span>
              </div>
              <p className="text-green-100 text-sm">
                {companyData.legal_form} • {companyData.registration_number}
              </p>
              {companyData.industry_description && (
                <p className="text-green-100 text-sm mt-1">
                  📊 {companyData.industry_description}
                </p>
              )}
            </div>
          </div>
          <a
            href={companyData.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
          >
            View Registry <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Data Source Info */}
      <div className="bg-blue-50 border-b border-blue-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-blue-900">
            <TrendingUp className="w-4 h-4" />
            <span className="font-medium">Data Source:</span>
            <span>{companyData.data_source}</span>
            <span className="text-blue-600">•</span>
            <span>{companyData.filing_history.length} years of history</span>
            <span className="text-blue-600">•</span>
            <span className="font-semibold">{Math.round(companyData.completeness_score * 100)}% complete</span>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white hover:bg-gray-50 rounded-lg border border-blue-200 transition-colors"
          >
            {isEditing ? (
              <>
                <X className="w-4 h-4" /> Cancel
              </>
            ) : (
              <>
                <Edit2 className="w-4 h-4" /> Edit Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Financial Data */}
      <div className="p-6">
        {/* Latest Year (Editable) */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Latest Financial Year: {latestYear.year}
            </h3>
            {latestYear.filing_date && (
              <span className="text-sm text-gray-500">
                Filed: {new Date(latestYear.filing_date).toLocaleDateString()}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Revenue */}
            <div className="bg-gradient-to-br from-blue-50 to-primary-50 rounded-xl p-4 border border-blue-100">
              <div className="text-sm font-medium text-gray-600 mb-1">Revenue</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editedData.revenue || ''}
                  onChange={(e) => setEditedData({ ...editedData, revenue: parseFloat(e.target.value) })}
                  className="w-full text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(editedData.revenue || 0)}
                </div>
              )}
            </div>

            {/* EBITDA */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
              <div className="text-sm font-medium text-gray-600 mb-1">EBITDA</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editedData.ebitda || ''}
                  onChange={(e) => setEditedData({ ...editedData, ebitda: parseFloat(e.target.value) })}
                  className="w-full text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(editedData.ebitda || 0)}
                </div>
              )}
            </div>

            {/* Net Income */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-100">
              <div className="text-sm font-medium text-gray-600 mb-1">Net Income</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editedData.net_income || ''}
                  onChange={(e) => setEditedData({ ...editedData, net_income: parseFloat(e.target.value) })}
                  className="w-full text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(editedData.net_income || 0)}
                </div>
              )}
            </div>

            {/* Assets */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 border border-yellow-100">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Assets</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editedData.total_assets || ''}
                  onChange={(e) => setEditedData({ ...editedData, total_assets: parseFloat(e.target.value) })}
                  className="w-full text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(editedData.total_assets || 0)}
                </div>
              )}
            </div>

            {/* Debt */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-4 border border-red-100">
              <div className="text-sm font-medium text-gray-600 mb-1">Total Debt</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editedData.total_debt || ''}
                  onChange={(e) => setEditedData({ ...editedData, total_debt: parseFloat(e.target.value) })}
                  className="w-full text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(editedData.total_debt || 0)}
                </div>
              )}
            </div>

            {/* Cash */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-4 border border-teal-100">
              <div className="text-sm font-medium text-gray-600 mb-1">Cash</div>
              {isEditing ? (
                <input
                  type="number"
                  value={editedData.cash || ''}
                  onChange={(e) => setEditedData({ ...editedData, cash: parseFloat(e.target.value) })}
                  className="w-full text-xl font-bold text-gray-900 bg-white border border-gray-300 rounded px-2 py-1"
                />
              ) : (
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(editedData.cash || 0)}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Check className="w-4 h-4" /> Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}
        </div>

        {/* Historical Data */}
        {companyData.filing_history.length > 1 && (
          <div className="mt-8">
            <h4 className="text-base font-semibold text-gray-900 mb-3">Historical Data</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-700">Year</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Revenue</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">EBITDA</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Net Income</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-700">Assets</th>
                  </tr>
                </thead>
                <tbody>
                  {companyData.filing_history.slice(1).map((year, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{year.year}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(year.revenue || 0)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(year.ebitda || 0)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(year.net_income || 0)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(year.total_assets || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Calculate Button */}
        <div className="mt-8 pt-6 border-t">
          <button
            onClick={handleCalculate}
            disabled={isEditing}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 text-white rounded-xl hover:from-primary-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl text-lg font-semibold"
          >
            <Calculator className="w-6 h-6" />
            Calculate Business Valuation
          </button>
          {isEditing && (
            <p className="text-sm text-gray-500 text-center mt-2">
              Save your changes first before calculating
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

