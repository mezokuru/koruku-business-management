import { AlertCircle } from 'lucide-react';

interface FormErrorProps {
  id: string;
  error?: string;
  visible?: boolean;
}

/**
 * FormError Component
 * Displays form validation errors with proper ARIA attributes
 * Implements WCAG 2.1 AA accessibility standards
 */
export default function FormError({ id, error, visible = true }: FormErrorProps) {
  if (!error || !visible) {
    return null;
  }

  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="flex items-start gap-2 mt-1 text-sm text-[#e74c3c]"
    >
      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span>{error}</span>
    </div>
  );
}

export { FormError };
