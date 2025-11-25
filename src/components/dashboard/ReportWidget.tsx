import { useState } from 'react';
import { ChevronDown, ChevronUp, Download, ExternalLink } from 'lucide-react';
import Button from '../ui/Button';

interface ReportWidgetProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onExport?: () => void;
  onViewAll?: () => void;
  defaultExpanded?: boolean;
}

export function ReportWidget({
  title,
  description,
  icon,
  children,
  onExport,
  onViewAll,
  defaultExpanded = false,
}: ReportWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="text-[#ffd166]">{icon}</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-[#2c3e50]">{title}</h3>
              <p className="text-sm text-[#7f8c8d]">{description}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {onExport && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onExport}
                icon={<Download size={14} />}
              >
                Export
              </Button>
            )}
            {onViewAll && (
              <Button
                variant="secondary"
                size="sm"
                onClick={onViewAll}
                icon={<ExternalLink size={14} />}
              >
                View All
              </Button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? (
                <ChevronUp size={20} className="text-[#7f8c8d]" />
              ) : (
                <ChevronDown size={20} className="text-[#7f8c8d]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
}
