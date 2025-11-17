import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, helperText, className = '', required, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-[#2c3e50] mb-1"
          >
            {label}
            {required && <span className="text-[#e74c3c] ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7f8c8d]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-3 py-2 border rounded min-h-[44px]
              ${icon ? 'pl-10' : ''}
              ${error ? 'border-[#e74c3c] focus:ring-[#e74c3c]' : 'border-gray-300 focus:ring-[#ffd166]'}
              focus:outline-none focus:ring-2 focus:ring-offset-0
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${className}
            `}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />
        </div>
        {error && (
          <p
            id={errorId}
            className="mt-1 text-sm text-[#e74c3c]"
            role="alert"
          >
            {error}
          </p>
        )}
        {!error && helperText && (
          <p
            id={helperId}
            className="mt-1 text-sm text-[#7f8c8d]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
export { Input };
