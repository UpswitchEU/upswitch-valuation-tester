/**
 * Manual Form Field Renderer
 *
 * Single Responsibility: Render data fields using traditional form input patterns
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 */

import React from 'react';
import { DataField, FieldRendererProps } from '../../../types/data-collection';

export const ManualFormFieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  value,
  onChange,
  errors = [],
  disabled = false,
  autoFocus = false
}) => {
  const hasErrors = errors.length > 0;
  const errorMessage = errors.find(e => e.severity === 'error')?.message;

  const handleChange = (newValue: string | number | boolean | null | undefined) => {
    onChange(newValue, 'manual_form');
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-white">
        {field.label}
        {field.required && <span className="text-red-400 ml-1">*</span>}
      </label>

      {field.description && (
        <p className="text-sm text-zinc-400">{field.description}</p>
      )}

      <FieldInput
        field={field}
        value={value}
        onChange={handleChange}
        disabled={disabled}
        autoFocus={autoFocus}
        hasErrors={hasErrors}
      />

      {errorMessage && (
        <p className="text-sm text-red-400">{errorMessage}</p>
      )}
    </div>
  );
};

interface FieldInputProps {
  field: DataField;
  value: string | number | boolean | null | undefined;
  onChange: (value: string | number | boolean | null | undefined) => void;
  disabled?: boolean;
  autoFocus?: boolean;
  hasErrors?: boolean;
}

const FieldInput: React.FC<FieldInputProps> = ({
  field,
  value,
  onChange,
  disabled = false,
  autoFocus = false,
  hasErrors = false
}) => {
  const baseClasses = `
    w-full px-3 py-2 bg-zinc-800 border rounded-lg text-white placeholder-zinc-400
    focus:outline-none focus:ring-2 focus:ring-primary-500
    ${hasErrors ? 'border-red-500' : 'border-zinc-600'}
    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
  `;

  switch (field.type) {
    case 'text':
    case 'textarea':
      if (field.type === 'textarea') {
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            rows={4}
            className={baseClasses}
          />
        );
      }
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={baseClasses}
        />
      );

    case 'number':
    case 'currency':
      return (
        <input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(field.type === 'currency' ? parseFloat(e.target.value) : parseInt(e.target.value))}
          placeholder={field.placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          min={field.validation?.find(v => v.type === 'min')?.value}
          max={field.validation?.find(v => v.type === 'max')?.value}
          className={baseClasses}
        />
      );

    case 'select':
      return (
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          autoFocus={autoFocus}
          className={baseClasses}
        >
          <option value="">
            {field.placeholder || `Select ${field.label}`}
          </option>
          {field.options?.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );

    case 'boolean':
      return (
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            autoFocus={autoFocus}
            className="w-4 h-4 text-primary-600 bg-zinc-800 border-zinc-600 rounded focus:ring-primary-500"
          />
          <span className="text-sm text-zinc-300">Yes</span>
        </div>
      );

    case 'percentage':
      return (
        <div className="relative">
          <input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(parseFloat(e.target.value) / 100)} // Store as decimal
            placeholder={field.placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            min="0"
            max="100"
            className={baseClasses}
          />
          <span className="absolute right-3 top-2 text-zinc-400">%</span>
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className={baseClasses}
        />
      );
  }
};