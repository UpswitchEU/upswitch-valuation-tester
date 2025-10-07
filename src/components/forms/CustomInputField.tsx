/* eslint-disable @typescript-eslint/no-unused-vars */
// 📝 Custom Input Field - Enhanced input with floating label
// Location: src/shared/components/forms/CustomInputField.tsx
// Purpose: Reusable input field with smooth animations and validation states

import React, { useState } from 'react';

export interface CustomInputFieldProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (_e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (_e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (_e: React.FocusEvent<HTMLInputElement>) => void;
  name?: string;
  className?: string;
  error?: string;
  touched?: boolean;
  required?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  description?: string;
  autoComplete?: string;
  inputRef?: React.RefObject<HTMLInputElement>;
}

const CustomInputField: React.FC<CustomInputFieldProps> = ({
  label = '',
  type = 'text',
  placeholder = '',
  value = '',
  onChange = () => {},
  onBlur = () => {},
  onFocus,
  name = '',
  className = '',
  error,
  touched,
  required = false,
  disabled = false,
  autoFocus = false,
  leftIcon,
  rightIcon,
  description,
  autoComplete,
  inputRef,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur(e);
  };

  const hasValue = value.length > 0;
  const isLabelFloating = isFocused || hasValue;
  const hasError = error && touched;

  return (
    <div className={`relative ${className}`}>
      <div className="relative custom-input-group border border-gray-300 bg-white rounded-xl shadow-sm hover:border-gray-400 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-500/20 transition-all duration-200">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {leftIcon}
          </div>
        )}

        <input
          ref={inputRef}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder=" "
          required={required}
          disabled={disabled}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={`
            w-full h-16 px-4 pt-6 pb-2 text-base text-gray-900 
            bg-transparent border-none rounded-xl 
            focus:outline-none focus:ring-0
            transition-all duration-200 ease-in-out
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon ? 'pr-10' : ''}
            ${hasError ? 'text-red-600' : ''}
            ${disabled ? 'bg-gray-100 cursor-not-allowed text-gray-400' : ''}
          `}
        />

        {rightIcon && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
            {rightIcon}
          </div>
        )}

        <label
          className={`
            absolute left-4 transition-all duration-200 ease-in-out pointer-events-none
            ${
              isLabelFloating
                ? 'top-2 text-xs text-gray-600 font-medium'
                : 'top-5 text-base text-gray-500'
            }
            ${hasError ? 'text-red-500' : ''}
            ${disabled ? 'text-gray-400' : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      </div>

      {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}

      {hasError && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default CustomInputField;
