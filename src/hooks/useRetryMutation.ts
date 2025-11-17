/**
 * Custom hook utilities for mutations with retry logic
 * 
 * Note: React Query already provides built-in retry logic configured in QueryClient.
 * This file provides helper utilities for manual retry scenarios.
 */

import { retryWithBackoff } from '../lib/errorHandling';

/**
 * Wrap a mutation function with retry logic
 * Use this when you need manual control over retry behavior
 */
export function withRetry<TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
) {
  return async (variables: TVariables): Promise<TData> => {
    return retryWithBackoff(
      () => mutationFn(variables),
      {
        maxAttempts: options.maxRetries || 3,
        onRetry: options.onRetry,
      }
    );
  };
}
