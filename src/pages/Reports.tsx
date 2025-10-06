/**
 * Reports Page
 * Displays all saved valuation reports
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { urls } from '../router';
import { useReportsStore, type SavedReport } from '../store/useReportsStore';
import { FileText, Trash2, Eye, Download, AlertCircle, TrendingUp, Calendar, Building2, ArrowLeft } from 'lucide-react';

export const Reports: React.FC = () => {
  const navigate = useNavigate();
  const { reports, deleteReport, clearAllReports } = useReportsStore();
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSourceBadge = (source: string) => {
    const badges = {
      manual: { label: 'Manual Input', color: 'bg-blue-100 text-blue-800 border-blue-300' },
      instant: { label: '⚡ Instant', color: 'bg-green-100 text-green-800 border-green-300' },
      document: { label: '📄 Document', color: 'bg-purple-100 text-purple-800 border-purple-300' },
    };
    const badge = badges[source as keyof typeof badges] || badges.manual;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  const handleDelete = (id: string) => {
    deleteReport(id);
    setShowDeleteConfirm(null);
    if (selectedReport?.id === id) {
      setSelectedReport(null);
    }
  };

  const handleView = (report: SavedReport) => {
    setSelectedReport(report);
  };

  const handleDownload = (report: SavedReport) => {
    const dataStr = JSON.stringify(report, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `valuation-${report.company_name.replace(/\s+/g, '-')}-${new Date(report.created_at).toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to={urls.home()}
                className="flex items-center gap-2 text-primary-600 hover:text-primary-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Back to Valuation</span>
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary-600" />
                <h1 className="text-2xl font-bold text-gray-900">Valuation Reports</h1>
              </div>
            </div>
            {reports.length > 0 && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete all reports? This action cannot be undone.')) {
                    clearAllReports();
                    setSelectedReport(null);
                  }
                }}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
              >
                Clear All Reports
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reports.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                <FileText className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Reports Yet</h2>
              <p className="text-gray-600 mb-8">
                Generate your first valuation report to see it here. All your saved reports will be stored securely in your browser.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to={urls.instantValuation()}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 transition-colors"
                >
                  ⚡ Instant Valuation
                </Link>
                <Link
                  to={urls.manualValuation()}
                  className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-white text-primary-600 font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
                >
                  Manual Entry
                </Link>
              </div>
            </div>
          </div>
        ) : (
          // Reports Grid
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Reports List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">All Reports</h2>
                  <span className="text-sm text-gray-500">{reports.length} total</span>
                </div>
                <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {reports.map((report) => (
                    <div
                      key={report.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedReport?.id === report.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                      }`}
                      onClick={() => handleView(report)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{report.company_name}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(report.created_at)}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowDeleteConfirm(report.id);
                          }}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        {getSourceBadge(report.source)}
                        <span className="text-sm font-bold text-primary-600">
                          {formatCurrency(report.result.equity_value_mid)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Report Details */}
            <div className="lg:col-span-2">
              {selectedReport ? (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  {/* Report Header */}
                  <div className="bg-gradient-to-r from-primary-600 to-blue-600 p-6 text-white">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-8 h-8" />
                        <div>
                          <h2 className="text-2xl font-bold">{selectedReport.company_name}</h2>
                          <p className="text-primary-100 text-sm">{formatDate(selectedReport.created_at)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(selectedReport)}
                        className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                    </div>
                    {getSourceBadge(selectedReport.source)}
                  </div>

                  {/* Valuation Results */}
                  <div className="p-6">
                    {/* Enterprise Value */}
                    <div className="mb-8">
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp className="w-5 h-5 text-primary-600" />
                        <h3 className="text-lg font-bold text-gray-900">Enterprise Value</h3>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">Low Estimate</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(selectedReport.result.equity_value_low)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-primary-50 rounded-lg border-2 border-primary-500">
                          <p className="text-sm text-primary-600 mb-1">Mid-Point</p>
                          <p className="text-2xl font-bold text-primary-600">
                            {formatCurrency(selectedReport.result.equity_value_mid)}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600 mb-1">High Estimate</p>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(selectedReport.result.equity_value_high)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Confidence Score */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Confidence Score</span>
                        <span className="text-lg font-bold text-gray-900">
                          {selectedReport.result.confidence_score}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all"
                          style={{ width: `${selectedReport.result.confidence_score}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    {selectedReport.result.financial_metrics && (
                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-gray-600 mb-1">EBITDA Margin</p>
                          <p className="text-xl font-bold text-blue-600">
                            {((selectedReport.result.financial_metrics.ebitda_margin || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-sm text-gray-600 mb-1">Revenue Growth</p>
                          <p className="text-xl font-bold text-green-600">
                            {((selectedReport.result.financial_metrics.revenue_growth || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Value Drivers */}
                    {selectedReport.result.value_drivers && selectedReport.result.value_drivers.length > 0 && (
                      <div className="mb-6">
                        <h4 className="font-bold text-gray-900 mb-3">Key Value Drivers</h4>
                        <div className="space-y-2">
                          {selectedReport.result.value_drivers.map((driver, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-green-500 mt-0.5">✓</span>
                              <span>{driver}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Risk Factors */}
                    {selectedReport.result.risk_factors && selectedReport.result.risk_factors.length > 0 && (
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">Risk Factors</h4>
                        <div className="space-y-2">
                          {selectedReport.result.risk_factors.map((risk, index) => (
                            <div key={index} className="flex items-start gap-2 text-sm text-gray-700">
                              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                              <span>{risk}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleDownload(selectedReport)}
                        className="flex-1 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Report
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(selectedReport.id)}
                        className="px-4 py-2 border-2 border-red-300 text-red-600 font-semibold rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
                  <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Select a Report</h3>
                  <p className="text-gray-600">Click on a report from the list to view its details</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Report?</h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone. The report will be permanently deleted from your browser storage.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
