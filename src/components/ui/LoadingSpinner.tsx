import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div 
      className={`flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading content"
    >
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} aria-hidden="true" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
