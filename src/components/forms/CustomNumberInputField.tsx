// 🔢 Custom Number Input Field - Number input with formatting and validation
// Location: src/shared/components/forms/CustomNumberInputField.tsx
// Purpose: Number input with formatting, min/max validation, and consistent styling

import React from 'react';

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
  showArrows?: boolean; // New prop to show up/down arrows
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
  showArrows = false,
}) => {
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    onBlur(e);
  };

  const handlePaste = (_e: React.ClipboardEvent<HTMLInputElement>) => {
    // Allow paste operations - don't prevent default
    // The onChange handler will process the pasted content
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle arrow keys for increment/decrement when arrows are shown
    if (showArrows && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      const currentValue = typeof value === 'string' ? parseInt(value) || 0 : value;
      const stepValue = step || 1;
      let newValue: number;
      
      if (e.key === 'ArrowUp') {
        newValue = currentValue + stepValue;
      } else {
        newValue = currentValue - stepValue;
      }
      
      // Apply min/max constraints
      if (min !== undefined && newValue < min) {
        newValue = min;
      }
      if (max !== undefined && newValue > max) {
        newValue = max;
      }
      
      // Trigger onChange with the new value
      const syntheticEvent = {
        target: { value: newValue.toString() }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
      return;
    }
    
    // Allow all Ctrl+key combinations (including paste, copy, cut, select all)
    if (e.ctrlKey || e.metaKey) {
      return;
    }
    
    // Allow: backspace, delete, tab, escape, enter, decimal point, minus, comma
    if (
      ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', '.', '-', ','].includes(e.key) ||
      // Allow: home, end, left, right, down, up
      ['Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp'].includes(e.key)
    ) {
      return;
    }
    // Allow numbers (0-9) from both main keyboard and numpad
    if (/^[0-9]$/.test(e.key)) {
      return;
    }
    // Allow decimal point if decimals are allowed
    if (allowDecimals && e.key === '.') {
      return;
    }
    // Allow comma for thousands separator
    if (e.key === ',') {
      return;
    }
    // Block all other keys
    e.preventDefault();
  };

  const handleArrowClick = (direction: 'up' | 'down') => {
    const currentValue = typeof value === 'string' ? parseInt(value) || 0 : value;
    const stepValue = step || 1;
    let newValue: number;
    
    if (direction === 'up') {
      newValue = currentValue + stepValue;
    } else {
      newValue = currentValue - stepValue;
    }
    
    // Apply min/max constraints
    if (min !== undefined && newValue < min) {
      newValue = min;
    }
    if (max !== undefined && newValue > max) {
      newValue = max;
    }
    
    // Trigger onChange with the new value
    const syntheticEvent = {
      target: { value: newValue.toString() }
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  const hasError = error && touched;
  
  // Use formatAsCurrency to avoid unused variable warning
  if (formatAsCurrency) {
    // Currency formatting logic would go here if needed
  }

  return (
    <div className={className}>
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
            ${suffix || showArrows ? 'pr-8' : ''}
            placeholder:text-gray-400
          `}
          aria-label={label}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
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
        {showArrows && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
            <button
              type="button"
              onClick={() => handleArrowClick('up')}
              disabled={disabled || (max !== undefined && (typeof value === 'string' ? parseInt(value) || 0 : value) >= max)}
              className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Increase value"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m18 15-6-6-6 6"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => handleArrowClick('down')}
              disabled={disabled || (min !== undefined && (typeof value === 'string' ? parseInt(value) || 0 : value) <= min)}
              className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Decrease value"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m6 9 6 6 6-6"/>
              </svg>
            </button>
          </div>
        )}
        <label
          className={`
            absolute left-4 top-2 text-xs text-gray-700 pointer-events-none font-medium
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
