import toast from 'react-hot-toast';

/**
 * Toast notification wrapper with custom styling and accessibility
 * Provides success, error, and info variants with consistent styling
 */

interface ToastOptions {
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}

const defaultOptions: ToastOptions = {
  duration: 3000,
  position: 'top-right',
};

/**
 * Display a success toast notification
 * @param message - Message to display
 * @param options - Optional toast configuration
 */
export function showSuccess(message: string, options?: ToastOptions) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return toast.success(message, {
    duration: mergedOptions.duration,
    position: mergedOptions.position,
    ariaProps: {
      role: 'status',
      'aria-live': 'polite',
    },
    style: {
      background: '#fff',
      color: '#2c3e50',
      border: '1px solid #27ae60',
    },
    iconTheme: {
      primary: '#27ae60',
      secondary: '#fff',
    },
  });
}

/**
 * Display an error toast notification
 * @param message - Message to display
 * @param options - Optional toast configuration
 */
export function showError(message: string, options?: ToastOptions) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return toast.error(message, {
    duration: mergedOptions.duration,
    position: mergedOptions.position,
    ariaProps: {
      role: 'alert',
      'aria-live': 'assertive',
    },
    style: {
      background: '#fff',
      color: '#2c3e50',
      border: '1px solid #e74c3c',
    },
    iconTheme: {
      primary: '#e74c3c',
      secondary: '#fff',
    },
  });
}

/**
 * Display an info toast notification
 * @param message - Message to display
 * @param options - Optional toast configuration
 */
export function showInfo(message: string, options?: ToastOptions) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return toast(message, {
    duration: mergedOptions.duration,
    position: mergedOptions.position,
    ariaProps: {
      role: 'status',
      'aria-live': 'polite',
    },
    icon: 'ℹ️',
    style: {
      background: '#fff',
      color: '#2c3e50',
      border: '1px solid #3498db',
    },
  });
}

/**
 * Display a loading toast notification
 * @param message - Message to display
 * @param options - Optional toast configuration
 */
export function showLoading(message: string, options?: ToastOptions) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return toast.loading(message, {
    duration: mergedOptions.duration,
    position: mergedOptions.position,
    ariaProps: {
      role: 'status',
      'aria-live': 'polite',
    },
    style: {
      background: '#fff',
      color: '#2c3e50',
    },
  });
}

/**
 * Dismiss a specific toast or all toasts
 * @param toastId - Optional toast ID to dismiss specific toast
 */
export function dismissToast(toastId?: string) {
  if (toastId) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss();
  }
}

/**
 * Display a promise-based toast that shows loading, success, and error states
 * @param promise - Promise to track
 * @param messages - Messages for loading, success, and error states
 * @param options - Optional toast configuration
 */
export function showPromise<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((error: any) => string);
  },
  options?: ToastOptions
) {
  const mergedOptions = { ...defaultOptions, ...options };
  
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      position: mergedOptions.position,
      style: {
        background: '#fff',
        color: '#2c3e50',
      },
      success: {
        duration: mergedOptions.duration,
        iconTheme: {
          primary: '#27ae60',
          secondary: '#fff',
        },
      },
      error: {
        duration: mergedOptions.duration,
        iconTheme: {
          primary: '#e74c3c',
          secondary: '#fff',
        },
      },
    }
  );
}

// Export the original toast for advanced use cases
export { toast };
