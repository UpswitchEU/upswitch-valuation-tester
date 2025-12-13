/**
 * @package @upswitch/data-collection
 *
 * File Upload Field Renderer - Renders fields with file upload functionality.
 */

import React, { useRef } from 'react';
import type { FieldRendererProps, ValidationRule } from '../types';

export const FileUploadFieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  errors = [],
  disabled = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasErrors = errors.length > 0;
  const errorMessage = errors.find(e => e.severity === 'error')?.message;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In a real implementation, this would process the file
      // For now, we'll just store the file name as a placeholder
      onChange(file.name, 'file_upload');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onChange(file.name, 'file_upload');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-white">
          {field.label}
          {field.required && <span className="text-red-400 ml-1">*</span>}
        </label>

        {field.description && (
          <p className="text-sm text-zinc-400">{field.description}</p>
        )}
      </div>

      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${hasErrors ? 'border-red-500 bg-red-900/20' : 'border-zinc-600 hover:border-zinc-500 bg-zinc-800/50'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className="mx-auto w-12 h-12 bg-zinc-700 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          <div>
            <p className="text-sm text-zinc-300">
              Drop your file here, or <span className="text-primary-400 underline">browse</span>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Supports PDF, Excel, CSV (max 10MB)
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          disabled={disabled}
          accept=".pdf,.xlsx,.xls,.csv"
          className="hidden"
        />
      </div>

      {/* Current File Display */}
      {value && (
        <div className="bg-zinc-800/50 rounded-lg p-3 border border-zinc-700/50">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-zinc-300">
                Uploaded: <span className="text-white font-medium">{value}</span>
              </p>
              <p className="text-xs text-zinc-500">File processed successfully</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <p className="text-sm text-red-400">{errorMessage}</p>
      )}
    </div>
  );
};