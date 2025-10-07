// 📝 Custom Textarea - Enhanced textarea with floating label
// Location: src/shared/components/forms/CustomTextarea.tsx
// Purpose: Reusable textarea with smooth animations and validation states

import React, { useEffect, useRef, useState } from 'react';

export interface CustomTextareaProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (_e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onBlur: (_e: React.FocusEvent<HTMLTextAreaElement>) => void;
  onFocus?: (_e: React.FocusEvent<HTMLTextAreaElement>) => void;
  name: string;
  className?: string;
  error?: string;
  touched?: boolean;
  textareaRef?: React.RefObject<HTMLTextAreaElement>;
  required?: boolean;
  disabled?: boolean;
      rows?: number;
      minHeight?: number;
      maxHeight?: number;
      autoResize?: boolean;
      minRows?: number;
      maxRows?: number;
      characterLimit?: number;
      description?: string;
}

const CustomTextarea: React.FC<CustomTextareaProps> = ({
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
  textareaRef,
  required = false,
  disabled = false,
      rows = 4,
      minHeight = 120,
      maxHeight,
      autoResize = true,
      minRows,
      maxRows,
      characterLimit,
      description,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const ref = textareaRef || internalRef;

  useEffect(() => {
    setHasContent(!!value);
  }, [value]);

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    onBlur(e);
  };

  const hasError = error && touched;

      // Auto-resize functionality
      const adjustHeight = () => {
        if (autoResize && ref.current) {
          const textarea = ref.current;
          textarea.style.height = 'auto';
          const scrollHeight = textarea.scrollHeight;
          const minHeightPx = minRows ? minRows * 24 : minHeight; // 24px per row
          const maxHeightPx = maxRows ? maxRows * 24 : (maxHeight || minHeight * 3);
          const newHeight = Math.min(Math.max(scrollHeight, minHeightPx), maxHeightPx);
          textarea.style.height = `${newHeight}px`;
        }
      };

  useEffect(() => {
    adjustHeight();
  }, [value, autoResize, minHeight, maxHeight, adjustHeight]);

  return (
    <div className={`mb-6 ${className}`}>
      <div className="relative custom-input-group flex flex-col items-center border border-gray-900 bg-default-100 rounded-xl shadow-sm">
        <textarea
          ref={ref}
          placeholder={placeholder}
          className={`
            w-full px-4 pt-6 pb-2 text-base text-black bg-white 
            border border-gray-300 rounded-xl focus:outline-none focus-visible:outline-none border-none rounded-xl focus:ring-2 focus:ring-black custom-input bg-filled text-md pt-4 pl-4 transition-all duration-200 ease-in-out
            ${hasError ? 'border-red-400 focus:border-red-500' : ''}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            placeholder:text-transparent resize-none
          `}
          aria-label={label}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          name={name}
          required={required}
          disabled={disabled}
          rows={autoResize ? undefined : rows}
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: maxHeight ? `${maxHeight}px` : 'none',
          }}
        />
        <label
          className={`
               absolute left-4 transition-all duration-200 ease-in-out pointer-events-none
            ${
              hasContent || isFocused || value
                ? 'top-3 text-xs text-gray-600' 
                : 'top-5 text-md text-gray-500'
            }
            ${hasError ? 'text-red-600' : ''}
          `}
        >
          {label}
        </label>
      </div>

          {hasError && <span className="block text-sm text-red-600 mt-2 font-medium">{error}</span>}
          
          {/* Character limit and description */}
          <div className="flex justify-between items-center mt-2">
            {description && <span className="text-sm text-gray-500">{description}</span>}
            {characterLimit && (
              <span className={`text-sm ${value.length > characterLimit ? 'text-red-500' : 'text-gray-500'}`}>
                {value.length}/{characterLimit}
              </span>
            )}
          </div>
        </div>
      );
    };

export default CustomTextarea;