/**
 * DynamicQuestionRenderer Component
 * 
 * Renders individual questions based on their type (single_select, number, text, etc.).
 * Handles validation and displays real-time feedback.
 * 
 * @author UpSwitch CTO Team
 * @version 2.0.0
 */

import React from 'react';
import { BusinessTypeQuestion } from '../hooks/useBusinessTypeQuestions';
import { ValidationMessageData } from './ValidationMessage';
import { ValidationMessage } from './ValidationMessage';

// ============================================================================
// TYPES
// ============================================================================

interface DynamicQuestionRendererProps {
  question: BusinessTypeQuestion;
  value: any;
  onChange: (value: any) => void;
  validation?: ValidationMessageData[];
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DynamicQuestionRenderer: React.FC<DynamicQuestionRendererProps> = ({
  question,
  value,
  onChange,
  validation = [],
  className = '',
}) => {
  const {
    question_text,
    help_text,
    placeholder,
    question_type,
    options,
    required,
    unit,
  } = question;

  // Render different input types based on question_type
  const renderInput = () => {
    switch (question_type) {
      case 'single_select':
        return (
          <select
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select an option...</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multi_select':
        return (
          <div className="mt-1 space-y-2">
            {options?.map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-2"
              >
                <input
                  type="checkbox"
                  checked={value?.includes(option.value) || false}
                  onChange={(e) => {
                    const newValue = value || [];
                    if (e.target.checked) {
                      onChange([...newValue, option.value]);
                    } else {
                      onChange(newValue.filter((v: string) => v !== option.value));
                    }
                  }}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'number':
      case 'currency':
      case 'percentage':
        return (
          <div className="mt-1 relative rounded-md shadow-sm">
            {unit && question_type === 'currency' && (
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">{unit}</span>
              </div>
            )}
            <input
              type="number"
              value={value || ''}
              onChange={(e) => onChange(e.target.value ? parseFloat(e.target.value) : null)}
              required={required}
              placeholder={placeholder}
              className={`
                block w-full rounded-md border-gray-300 shadow-sm 
                focus:border-indigo-500 focus:ring-indigo-500
                ${unit && question_type === 'currency' ? 'pl-7' : ''}
                ${unit && question_type === 'percentage' ? 'pr-8' : ''}
              `}
            />
            {unit && question_type === 'percentage' && (
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                <span className="text-gray-500 sm:text-sm">{unit}</span>
              </div>
            )}
          </div>
        );

      case 'text':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            placeholder={placeholder}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            placeholder={placeholder}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        );

      case 'boolean':
        return (
          <div className="mt-1 flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={value === true}
                onChange={() => onChange(true)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Yes</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={value === false}
                onChange={() => onChange(false)}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">No</span>
            </label>
          </div>
        );

      case 'range':
      case 'slider':
        return (
          <div className="mt-1">
            <input
              type="range"
              value={value || 0}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              min={question.validation_rules?.min || 0}
              max={question.validation_rules?.max || 100}
              step={question.validation_rules?.step || 1}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{question.validation_rules?.min || 0}</span>
              <span className="font-medium text-gray-900">{value || 0}</span>
              <span>{question.validation_rules?.max || 100}</span>
            </div>
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            placeholder={placeholder}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        );
    }
  };

  return (
    <div className={`dynamic-question ${className}`}>
      {/* Question Label */}
      <label className="block text-sm font-medium text-gray-700">
        {question_text}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Help Text */}
      {help_text && (
        <p className="mt-1 text-xs text-gray-500">{help_text}</p>
      )}

      {/* Input */}
      {renderInput()}

      {/* Validation Messages */}
      {validation.length > 0 && (
        <div className="mt-2 space-y-1">
          {validation.map((v, index) => (
            <ValidationMessage key={index} validation={v} />
          ))}
        </div>
      )}
    </div>
  );
};

export default DynamicQuestionRenderer;

