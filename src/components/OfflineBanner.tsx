import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

/**
 * OfflineBanner Component
 * Displays a persistent banner when the user loses internet connectivity
 * Implements WCAG 2.1 AA accessibility with ARIA live regions
 */
function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      
      // Hide "back online" message after 3 seconds
      setTimeout(() => {
        setWasOffline(false);
      }, 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Don't render anything if online and was never offline
  if (isOnline && !wasOffline) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOnline ? 'translate-y-0' : 'translate-y-0'
      }`}
    >
      {!isOnline ? (
        <div className="bg-red-600 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <WifiOff className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">
              You're offline. Changes will sync when connection is restored.
            </p>
          </div>
        </div>
      ) : wasOffline ? (
        <div className="bg-green-600 text-white px-4 py-3 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <Wifi className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p className="text-sm font-medium">
              You're back online!
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default OfflineBanner;
