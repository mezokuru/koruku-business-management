import { useEffect, useState } from 'react';

interface AriaLiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive';
  clearDelay?: number;
}

/**
 * AriaLiveRegion component for announcing dynamic content updates to screen readers
 * Used for status changes, loading states, and other dynamic updates
 */
export function AriaLiveRegion({ 
  message, 
  politeness = 'polite',
  clearDelay = 3000 
}: AriaLiveRegionProps) {
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => {
    if (message) {
      // Use queueMicrotask to avoid setState during render
      queueMicrotask(() => {
        setAnnouncement(message);
      });
      
      // Clear the announcement after delay to allow for new announcements
      const timer = setTimeout(() => {
        setAnnouncement('');
      }, clearDelay);
      
      return () => clearTimeout(timer);
    }
  }, [message, clearDelay]);

  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

/**
 * Screen reader only utility class
 * Add to tailwind.config.js or use inline styles
 */
export const srOnlyStyles = {
  position: 'absolute' as const,
  width: '1px',
  height: '1px',
  padding: '0',
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap' as const,
  borderWidth: '0',
};
