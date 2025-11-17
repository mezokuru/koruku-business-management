import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#ffd166] disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[#ffd166] text-[#2c3e50] hover:bg-[#ffc34d] active:bg-[#ffb533]',
    secondary: 'bg-white text-[#2c3e50] border border-[#2c3e50] hover:bg-gray-50 active:bg-gray-100',
    danger: 'bg-[#e74c3c] text-white hover:bg-[#c0392b] active:bg-[#a93226]',
    ghost: 'bg-transparent text-[#2c3e50] hover:bg-gray-100 active:bg-gray-200'
  };
  
  const sizeStyles = {
    sm: 'px-3 py-2 text-sm gap-1.5 min-h-[44px]',
    md: 'px-4 py-2.5 text-base gap-2 min-h-[44px]',
    lg: 'px-6 py-3 text-lg gap-2.5 min-h-[48px]'
  };
  
  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16} aria-hidden="true" />
          <span className="sr-only">Loading</span>
        </>
      ) : icon ? (
        <span aria-hidden="true">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}

export { Button };
