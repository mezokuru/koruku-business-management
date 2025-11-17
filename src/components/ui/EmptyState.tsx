import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div 
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
      role="status"
      aria-label={`${title}${description ? `: ${description}` : ''}`}
    >
      <div className="mb-4 text-[#7f8c8d] opacity-50" aria-hidden="true">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-[#2c3e50] mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#7f8c8d] mb-6 max-w-md">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
