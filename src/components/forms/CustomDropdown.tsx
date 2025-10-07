/* eslint-disable @typescript-eslint/no-unused-vars */
// 📋 Custom Dropdown Component - Enhanced dropdown with floating label
// Location: src/shared/components/forms/CustomDropdown.tsx
// Purpose: Reusable dropdown component with HeroUI styling and floating label

import { ChevronDown } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface DropdownOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomDropdownProps {
  /**
   * Label for the dropdown
   */
  label: string;

  /**
   * Placeholder text when no option is selected
   */
  placeholder?: string;

  /**
   * Array of dropdown options
   */
  options: DropdownOption[];

  /**
   * Currently selected value
   */
  value?: string;

  /**
   * Callback when selection changes
   */
  onChange: (value: string) => void;

  /**
   * Whether the field is required
   */
  required?: boolean;

  /**
   * Whether the dropdown is disabled
   */
  disabled?: boolean;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Whether the field has been touched (for validation)
   */
  touched?: boolean;

  /**
   * Name attribute for the dropdown
   */
  name?: string;

  /**
   * Custom CSS classes
   */
  className?: string;

  /**
   * Reference to the dropdown element
   */
  dropdownRef?: React.RefObject<HTMLDivElement>;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  error,
  touched = false,
  name,
  className = '',
  dropdownRef,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = useRef<HTMLDivElement>(null);
  const ref = dropdownRef || internalRef;

  // Find the selected option
  const selectedOption = options.find(option => option.value === value);
  const hasValue = !!selectedOption;
  const isFilled = hasValue || isFocused;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setIsFocused(!isOpen);
    }
  };

  const handleOptionSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setIsFocused(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div className="relative">
        {/* Main Dropdown Button */}
        <button
          type="button"
          tabIndex={0}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Delay to allow option selection
            setTimeout(() => setIsFocused(false), 150);
          }}
          disabled={disabled}
          name={name}
          className={`
            w-full h-14 px-4 pt-6 pb-2 text-base text-black bg-white 
            border border-gray-300 rounded-xl transition-all duration-200 
            focus:outline-none focus:border-gray-900 focus:ring-0
            hover:border-gray-500
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${error && touched ? 'border-red-400 focus:border-red-500' : ''}
            flex-col items-start justify-center gap-0
            text-gray-900
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-labelledby={`${label}-label ${label}-value`}
        >
          {/* Fixed Label */}
          <label
            className={`
            absolute left-4 top-2 text-xs text-gray-700 pointer-events-none font-medium
            ${error && touched ? 'text-red-600' : ''}
            ${disabled ? 'text-gray-400' : ''}
            ${required ? "after:content-['*'] after:text-red-500 after:ml-1" : ''}
          `}
            id={`${label}-label`}
          >
            {label}
          </label>

          {/* Inner Content */}
          <div className="flex items-center w-full h-full">
            <span
              className={`
              font-normal w-full text-start text-gray-900 truncate
              ${!hasValue ? 'text-gray-400' : ''}
            `}
              id={`${label}-value`}
            >
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>

          {/* Dropdown Icon */}
          <ChevronDown
            className={`
            absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-transform duration-150 ease
            ${isOpen ? 'rotate-180' : ''}
            ${disabled ? 'text-gray-400' : 'text-gray-500'}
          `}
            aria-hidden="true"
          />
        </button>

        {/* Dropdown Options */}
        {isOpen && (
          <div className="relative z-[9999] mt-0 w-full">
            <div className="absolute w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
              {options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionSelect(option.value)}
                  disabled={option.disabled}
                  className={`
                  w-full px-4 py-3 text-left text-gray-900 transition-colors
                  ${
                    option.disabled
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'hover:bg-gray-50 cursor-pointer'
                  }
                  ${option.value === value ? 'bg-gray-100 text-gray-900' : ''}
                `}
                  role="option"
                  aria-selected={option.value === value}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
      </div>
      {error && touched && (
        <span className="block text-sm text-red-600 mt-2 font-medium">{error}</span>
      )}
    </div>
  );
};

export default CustomDropdown;
