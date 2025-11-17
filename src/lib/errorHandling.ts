/**
 * Error Handling Utilities
 * Provides retry logic, error classification, and user-friendly error messages
 */

import { toast } from 'react-hot-toast';
import { logError, handleSupabaseError } from './errorLogger';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retry a function with exponential backoff
 * Implements: 1s, 2s, 4s delays with max 3 attempts
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 4000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Calculate exponential backoff delay: 1s, 2s, 4s
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error.message.includes('network') ||
    error.message.includes('fetch') ||
    error.message.includes('Failed to fetch') ||
    error.message.includes('NetworkError') ||
    error.name === 'NetworkError'
  );
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: Error): boolean {
  return (
    error.message.includes('JWT') ||
    error.message.includes('auth') ||
    error.message.includes('unauthorized') ||
    error.message.includes('Session expired') ||
    error.message.includes('Invalid login credentials')
  );
}

/**
 * Check if error is a database constraint error
 */
export function isDatabaseConstraintError(error: Error & { code?: string }): boolean {
  return (
    error.code === '23505' || // Unique constraint
    error.code === '23503' || // Foreign key constraint
    error.code === '23514' || // Check constraint
    error.code === '23502'    // Not null constraint
  );
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: Error & { code?: string }): string {
  // Network errors
  if (isNetworkError(error)) {
    return 'Connection lost. Please check your internet.';
  }

  // Authentication errors
  if (isAuthError(error)) {
    return 'Session expired. Please login again.';
  }

  // Database constraint errors
  if (isDatabaseConstraintError(error)) {
    return handleSupabaseError(error);
  }

  // Specific error messages
  if (error.message.includes('Invalid email or password')) {
    return 'Invalid email or password';
  }

  if (error.message.includes('already exists')) {
    return 'This record already exists. Please use a different value.';
  }

  if (error.message.includes('not found')) {
    return 'Record not found.';
  }

  // Generic error
  return error.message || 'Something went wrong. Please try again.';
}

/**
 * Handle error with toast notification and optional retry
 */
export function handleErrorWithToast(
  error: Error & { code?: string },
  context: {
    component?: string;
    action?: string;
    showRetry?: boolean;
    onRetry?: () => void;
  } = {}
): void {
  const { component, action, showRetry = false, onRetry } = context;

  // Log error
  logError(error, { component, action });

  // Get user-friendly message
  const message = getUserFriendlyErrorMessage(error);

  // Show toast with retry option if applicable
  if (showRetry && onRetry && isNetworkError(error)) {
    // For network errors, suggest manual retry
    toast.error(message, {
      duration: 5000,
    });
  } else {
    toast.error(message);
  }
}

/**
 * Create a mutation error handler with automatic retry
 */
export function createMutationErrorHandler(context: {
  component: string;
  action: string;
  onRetry?: () => void;
}) {
  return (error: Error & { code?: string }) => {
    handleErrorWithToast(error, {
      ...context,
      showRetry: isNetworkError(error),
    });
  };
}

/**
 * Validate form field and return error message
 */
export function validateField(
  value: string | number | undefined,
  rules: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: RegExp;
    min?: number;
    max?: number;
    custom?: (value: string | number) => string | undefined;
  }
): string | undefined {
  const stringValue = String(value || '');

  // Required validation
  if (rules.required && !stringValue.trim()) {
    return 'This field is required';
  }

  // Skip other validations if empty and not required
  if (!stringValue.trim() && !rules.required) {
    return undefined;
  }

  // Min length validation
  if (rules.minLength && stringValue.length < rules.minLength) {
    return `Must be at least ${rules.minLength} characters`;
  }

  // Max length validation
  if (rules.maxLength && stringValue.length > rules.maxLength) {
    return `Must be no more than ${rules.maxLength} characters`;
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(stringValue)) {
    return 'Invalid format';
  }

  // Number min validation
  if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
    return `Must be at least ${rules.min}`;
  }

  // Number max validation
  if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
    return `Must be no more than ${rules.max}`;
  }

  // Custom validation
  if (rules.custom) {
    return rules.custom(value as string | number);
  }

  return undefined;
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for online connection
 */
export function waitForOnline(timeout = 30000): Promise<void> {
  return new Promise((resolve, reject) => {
    if (navigator.onLine) {
      resolve();
      return;
    }

    const timeoutId = setTimeout(() => {
      window.removeEventListener('online', handleOnline);
      reject(new Error('Connection timeout'));
    }, timeout);

    const handleOnline = () => {
      clearTimeout(timeoutId);
      window.removeEventListener('online', handleOnline);
      resolve();
    };

    window.addEventListener('online', handleOnline);
  });
}
