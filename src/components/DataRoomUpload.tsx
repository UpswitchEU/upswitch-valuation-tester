import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, X, AlertCircle } from 'lucide-react';
import { fileProcessingService, type ProcessedFile } from '../services/fileProcessingService';
import { serviceLogger } from '../utils/logger';

// Use ProcessedFile from service instead of local interface

interface DataRoomUploadProps {
  onComplete: (files: ProcessedFile[]) => void;
}

export const DataRoomUpload: React.FC<DataRoomUploadProps> = ({ onComplete }) => {
  const [uploadedFiles, setUploadedFiles] = useState<ProcessedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    processFiles(files);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);

    try {
      const processedFiles = await fileProcessingService.processFiles(files);
      setUploadedFiles(prev => [...prev, ...processedFiles]);
    } catch (error) {
      serviceLogger.error('Failed to process files', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleContinue = () => {
    const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
    if (completedFiles.length > 0) {
      onComplete(completedFiles);
    }
  };

  const canContinue = uploadedFiles.some(f => f.status === 'completed') && !isProcessing;

  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header */}
      <div className="mb-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 mb-4">
            <Upload className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Upload Your Financial Documents
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Your financial data is processed securely on our servers and{' '}
            <strong className="text-primary-600">never sent to external AI services</strong>.
          </p>
        </div>

        {/* What to Upload Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            Which documents should I upload?
          </h3>
          
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">✅ Best for Accuracy</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Annual Report</strong> (contains all financials)</li>
                    <li>• <strong>Financial Statements</strong> (P&L + Balance Sheet)</li>
                    <li>• <strong>Tax Returns</strong> (verified numbers)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-blue-100">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">💡 Also Works</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Management Accounts</strong></li>
                    <li>• <strong>Bookkeeping Reports</strong></li>
                    <li>• <strong>Bank Statements</strong> (for revenue)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-gray-900 text-sm mb-2">📊 What we need to extract:</h4>
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="font-semibold text-gray-700 mb-1">Required:</p>
                <ul className="text-gray-600 space-y-0.5">
                  <li>✓ Annual Revenue</li>
                  <li>✓ EBITDA / Operating Profit</li>
                  <li>✓ Company Name</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Highly Recommended:</p>
                <ul className="text-gray-600 space-y-0.5">
                  <li>✓ 3+ years history</li>
                  <li>✓ Total Assets</li>
                  <li>✓ Total Debt & Cash</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-700 mb-1">Improves Accuracy:</p>
                <ul className="text-gray-600 space-y-0.5">
                  <li>✓ Net Income / Profit</li>
                  <li>✓ Cost of Goods Sold</li>
                  <li>✓ Operating Expenses</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex-1 border-2 border-dashed rounded-2xl transition-all ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <div className="h-full flex flex-col items-center justify-center p-12">
          {uploadedFiles.length === 0 ? (
            <>
              <div className="w-20 h-20 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Drop your files here
              </h3>
              <p className="text-gray-500 mb-6 text-center max-w-md">
                or click to browse. We support PDF, Excel (.xlsx, .xls), CSV, and images.
              </p>
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls,.csv,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <span className="inline-flex items-center px-6 py-3 rounded-lg bg-primary-600 text-white font-medium hover:bg-primary-700 transition-colors">
                  <Upload className="w-5 h-5 mr-2" />
                  Choose Files
                </span>
              </label>
            </>
          ) : (
            <div className="w-full space-y-3">
              {uploadedFiles.map(file => (
                <div
                  key={file.id}
                  className="bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4"
                >
                  {/* File Icon */}
                  <div className="flex-shrink-0">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.file.name}
                      </p>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Status */}
                    {file.status === 'uploading' && (
                      <div className="space-y-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500">Uploading... {file.progress}%</p>
                      </div>
                    )}

                    {file.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary-600 border-t-transparent" />
                        <p className="text-xs text-gray-600">Processing with our secure engine...</p>
                      </div>
                    )}

                    {file.status === 'completed' && file.extractedData && (
                      <div className="space-y-2 mt-2">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          <p className="text-xs font-medium">
                            Processed successfully ({Math.round((file.extractedData.confidence || 0) * 100)}% confidence)
                          </p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                          <p className="text-xs font-semibold text-gray-700 mb-1.5">✓ Extracted Data:</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                            {file.extractedData.company_name && (
                              <div>
                                <span className="text-gray-500">Company:</span>{' '}
                                <span className="font-medium text-gray-900">{file.extractedData.company_name}</span>
                              </div>
                            )}
                            {file.extractedData.revenue && (
                              <div>
                                <span className="text-gray-500">Revenue:</span>{' '}
                                <span className="font-medium text-gray-900">€{file.extractedData.revenue.toLocaleString()}</span>
                              </div>
                            )}
                            {file.extractedData.ebitda && (
                              <div>
                                <span className="text-gray-500">EBITDA:</span>{' '}
                                <span className="font-medium text-gray-900">€{file.extractedData.ebitda.toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 italic">
                            💡 You can review and edit these numbers before calculating
                          </p>
                        </div>
                      </div>
                    )}

                    {file.status === 'error' && (
                      <div className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-xs">{file.error}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Add More Files */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls,.csv,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-primary-500 hover:bg-primary-50 transition-colors">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Add more files</p>
                </div>
              </label>
            </div>
          )}
        </div>
      </div>

      {/* Continue Button */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {uploadedFiles.filter(f => f.status === 'completed').length} of {uploadedFiles.length}{' '}
            files processed
          </p>
          <button
            onClick={handleContinue}
            disabled={!canContinue}
            className="px-8 py-3 rounded-lg bg-primary-600 text-white font-semibold hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            Continue to AI Assistant
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};
