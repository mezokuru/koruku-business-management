import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/layout/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineBanner from './components/OfflineBanner';
import LoadingSpinner from './components/ui/LoadingSpinner';
import { isNetworkError } from './lib/errorHandling';

// Lazy load page components for code splitting
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Clients = lazy(() => import('./pages/Clients'));
const Projects = lazy(() => import('./pages/Projects'));
const Invoices = lazy(() => import('./pages/Invoices'));
const Quotations = lazy(() => import('./pages/Quotations'));
const Settings = lazy(() => import('./pages/Settings'));

// Configure React Query with enhanced error handling and retry logic
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error instanceof Error && error.message.includes('JWT')) {
          return false;
        }
        // Retry network errors up to 3 times
        if (error instanceof Error && isNetworkError(error)) {
          return failureCount < 3;
        }
        // Retry other errors once
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on auth errors
        if (error instanceof Error && error.message.includes('JWT')) {
          return false;
        }
        // Retry network errors up to 3 times
        if (error instanceof Error && isNetworkError(error)) {
          return failureCount < 3;
        }
        // Don't retry other mutation errors
        return false;
      },
      retryDelay: (attemptIndex) => {
        // Exponential backoff: 1s, 2s, 4s
        return Math.min(1000 * Math.pow(2, attemptIndex), 4000);
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <OfflineBanner />
          <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen">
              <LoadingSpinner size="lg" />
            </div>
          }>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route element={<ProtectedRoute />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/clients" element={<Clients />} />
                  <Route path="/projects" element={<Projects />} />
                  <Route path="/invoices" element={<Invoices />} />
                  <Route path="/quotations" element={<Quotations />} />
                  <Route path="/settings" element={<Settings />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#2c3e50',
              fontSize: '14px',
              padding: '12px 16px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            },
            success: {
              iconTheme: {
                primary: '#27ae60',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #27ae60',
              },
              ariaProps: {
                role: 'status',
                'aria-live': 'polite',
              },
            },
            error: {
              iconTheme: {
                primary: '#e74c3c',
                secondary: '#fff',
              },
              style: {
                border: '1px solid #e74c3c',
              },
              ariaProps: {
                role: 'alert',
                'aria-live': 'assertive',
              },
            },
            loading: {
              style: {
                border: '1px solid #3498db',
              },
              ariaProps: {
                role: 'status',
                'aria-live': 'polite',
              },
            },
          }}
          containerStyle={{
            top: 20,
            right: 20,
          }}
        />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
