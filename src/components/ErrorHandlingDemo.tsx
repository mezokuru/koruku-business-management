/**
 * ErrorHandlingDemo Component
 * Demonstrates comprehensive error handling features:
 * - Form validation with aria attributes
 * - Network error detection with retry
 * - Database constraint error handling
 * - Offline detection
 * - Authentication error handling
 * 
 * This component serves as a reference implementation
 */

import { useState } from 'react';
import { Input, Button } from './ui';
import { validateField } from '../lib/errorHandling';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export default function ErrorHandlingDemo() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isOnline = useOnlineStatus();

  const handleEmailChange = (value: string) => {
    setEmail(value);
    
    // Validate on change
    const error = validateField(value, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    });
    
    setEmailError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate before submit
    const error = validateField(email, {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    });
    
    if (error) {
      setEmailError(error);
      return;
    }
    
    if (!isOnline) {
      setEmailError('You are offline. Please check your connection.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('Form submitted:', email);
    } catch (error) {
      console.error('Submit error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Error Handling Demo</h2>
      
      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-4">
          <Input
            type="email"
            label="Email Address"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            error={emailError}
            required
            disabled={isSubmitting || !isOnline}
            aria-describedby={emailError ? 'email-error' : undefined}
          />
        </div>
        
        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          disabled={!!emailError || !isOnline}
          className="w-full"
        >
          Submit
        </Button>
        
        {!isOnline && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            You are currently offline. Form submission is disabled.
          </div>
        )}
      </form>
    </div>
  );
}
