/* eslint-disable @typescript-eslint/no-unused-vars */
// 🔢 Custom Number Input Field - Number input with formatting and validation
// Location: src/shared/components/forms/CustomNumberInputField.tsx
// Purpose: Number input with formatting, min/max validation, and consistent styling

import React, { useEffect, useState } from 'react';

export interface CustomNumberInputFieldProps {
  label: string;
  placeholder: string;
  value: string | number;
  onChange: (_e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: (_e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (_e: React.FocusEvent<HTMLInputElement>) => void;
  name: string;
  className?: string;
  error?: string;
  touched?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  required?: boolean;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  prefix?: string;
  suffix?: string;
  allowDecimals?: boolean;
  formatAsCurrency?: boolean;
}

const CustomNumberInputField: React.FC<CustomNumberInputFieldProps> = ({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  name,
  className = '',
  error,
  touched,
  inputRef,
  required = false,
  disabled = false,
  min,
  max,
  step = 1,
  prefix,
  suffix,
  allowDecimals = true,
  formatAsCurrency = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  useEffect(() => {
    setHasContent(!!value);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: backspace, delete, tab, escape, enter, decimal point, minus, comma
    if (
      [8, 9, 27, 13, 46, 110, 190, 189, 109, 188].indexOf(e.keyCode) !== -1 ||
      // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (e.keyCode === 65 && e.ctrlKey === true) ||
      (e.keyCode === 67 && e.ctrlKey === true) ||
      (e.keyCode === 86 && e.ctrlKey === true) ||
      (e.keyCode === 88 && e.ctrlKey === true) ||
      // Allow: home, end, left, right, down, up
      (e.keyCode >= 35 && e.keyCode <= 40)
    ) {
      return;
    }
    // Allow numbers (0-9) from both main keyboard and numpad
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      return;
    }
    // Allow decimal point if decimals are allowed
    if (allowDecimals && (e.keyCode === 190 || e.keyCode === 110)) {
      return;
    }
    // Allow comma for thousands separator
    if (e.keyCode === 188) {
      return;
    }
    // Block all other keys
    e.preventDefault();
  };

  const hasError = error && touched;

  return (
    <div className={`mb-6 ${className}`}>
      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            {prefix}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder={placeholder}
          className={`
            w-full h-14 px-4 pt-6 pb-2 text-base text-black bg-white 
            border border-gray-300 rounded-xl transition-all duration-200 
            focus:outline-none focus:border-gray-900 focus:ring-0
            hover:border-gray-500
            ${hasError ? 'border-red-400 focus:border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${prefix ? 'pl-8' : ''}
            ${suffix ? 'pr-8' : ''}
            placeholder:text-gray-400
          `}
          aria-label={label}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          name={name}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
        />
        {suffix && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm font-medium">
            {suffix}
          </span>
        )}
        <label
          className={`
            absolute left-4 transition-all duration-200 pointer-events-none font-medium
            ${
              hasContent || isFocused || value
                ? 'top-2 text-xs text-gray-700'
                : 'top-1/2 -translate-y-1/2 text-sm text-gray-500'
            }
            ${hasError ? 'text-red-600' : ''}
            ${prefix ? 'left-8' : ''}
          `}
        >
          {label}
        </label>
      </div>

      {hasError && <span className="block text-sm text-red-600 mt-2 font-medium">{error}</span>}
    </div>
  );
};

export default CustomNumberInputField;
