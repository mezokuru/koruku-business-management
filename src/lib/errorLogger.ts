/**
 * Error Logger Utility
 * Provides centralized error logging with context information
 */

interface ErrorContext {
  component?: string;
  action?: string;
  data?: Record<string, unknown>;
}

interface ErrorLog {
  timestamp: string;
  message: string;
  stack?: string;
  context: {
    component: string;
    action: string;
    data: Record<string, unknown>;
    userAgent: string;
    url: string;
  };
}

interface WarningLog {
  timestamp: string;
  message: string;
  context: ErrorContext;
}

interface InfoLog {
  timestamp: string;
  message: string;
  context: ErrorContext;
}

interface SupabaseError extends Error {
  code?: string;
}

/**
 * Log error with context information
 */
export function logError(error: Error | string, context: ErrorContext = {}): ErrorLog {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Create structured error log
  const errorLog: ErrorLog = {
    timestamp,
    message: errorMessage,
    stack: errorStack,
    context: {
      component: context.component || 'Unknown',
      action: context.action || 'Unknown',
      data: context.data || {},
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    },
  };

  // Log to console in development
  if (import.meta.env.DEV) {
    console.group(`🔴 Error: ${errorMessage}`);
    console.error('Message:', errorMessage);
    if (errorStack) console.error('Stack:', errorStack);
    console.log('Context:', context);
    console.log('Timestamp:', timestamp);
    console.groupEnd();
  } else {
    // In production, log minimal info to console
    console.error('Error:', errorMessage, 'Context:', context.component);
  }

  // In production, you could send to an error tracking service
  // Example: Sentry, LogRocket, etc.
  // if (import.meta.env.PROD) {
  //   sendToErrorTrackingService(errorLog);
  // }

  return errorLog;
}

/**
 * Log warning with context information
 */
export function logWarning(message: string, context: ErrorContext = {}): WarningLog {
  const timestamp = new Date().toISOString();

  const warningLog: WarningLog = {
    timestamp,
    message,
    context,
  };

  if (import.meta.env.DEV) {
    console.group(`⚠️ Warning: ${message}`);
    console.warn('Message:', message);
    console.log('Context:', context);
    console.log('Timestamp:', timestamp);
    console.groupEnd();
  } else {
    console.warn('Warning:', message);
  }

  return warningLog;
}

/**
 * Log info message with context
 */
export function logInfo(message: string, context: ErrorContext = {}): InfoLog {
  const timestamp = new Date().toISOString();

  if (import.meta.env.DEV) {
    console.log(`ℹ️ Info: ${message}`, context);
  }

  return { timestamp, message, context };
}

/**
 * Handle Supabase errors and return user-friendly messages
 */
export function handleSupabaseError(error: SupabaseError, context: ErrorContext = {}): string {
  logError(error, context);

  // Map common Supabase error codes to user-friendly messages
  if (error.code === '23505') {
    // Unique constraint violation
    return 'This record already exists. Please use a different value.';
  }

  if (error.code === '23503') {
    // Foreign key violation
    return 'Cannot perform this action due to related records.';
  }

  if (error.code === '23514') {
    // Check constraint violation
    return 'Invalid value provided. Please check your input.';
  }

  if (error.code === 'PGRST116') {
    // No rows returned
    return 'Record not found.';
  }

  if (error.message?.includes('JWT')) {
    // Authentication error
    return 'Session expired. Please login again.';
  }

  if (error.message?.includes('network') || error.message?.includes('fetch')) {
    // Network error
    return 'Connection lost. Please check your internet.';
  }

  // Generic error message
  return 'Something went wrong. Please try again.';
}

/**
 * Create error boundary handler
 */
export function createErrorHandler(
  callback?: (error: Error, errorInfo: Record<string, unknown>) => void
): (error: Error, errorInfo: Record<string, unknown>) => void {
  return (error: Error, errorInfo: Record<string, unknown>) => {
    logError(error, {
      component: 'ErrorBoundary',
      action: 'React Error',
      data: errorInfo,
    });

    if (callback) {
      callback(error, errorInfo);
    }
  };
}
