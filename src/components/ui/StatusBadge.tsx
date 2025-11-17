import { Circle, CheckCircle, Clock, AlertCircle, Code, Heart, RefreshCw, CheckCircle2, XCircle, HourglassIcon } from 'lucide-react';

type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue';
type ProjectStatus = 'planning' | 'development' | 'honey-period' | 'retainer' | 'completed';
type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

interface StatusBadgeProps {
  status: InvoiceStatus | ProjectStatus | QuotationStatus;
  variant: 'invoice' | 'project' | 'quotation';
}

export default function StatusBadge({ status, variant }: StatusBadgeProps) {
  const invoiceConfig = {
    draft: {
      color: 'bg-[#7f8c8d] text-white',
      icon: Circle,
      label: 'Draft'
    },
    sent: {
      color: 'bg-[#3498db] text-white',
      icon: Clock,
      label: 'Sent'
    },
    paid: {
      color: 'bg-[#27ae60] text-white',
      icon: CheckCircle,
      label: 'Paid'
    },
    overdue: {
      color: 'bg-[#e74c3c] text-white',
      icon: AlertCircle,
      label: 'Overdue'
    }
  };
  
  const projectConfig = {
    planning: {
      color: 'bg-[#9b59b6] text-white',
      icon: Circle,
      label: 'Planning'
    },
    development: {
      color: 'bg-[#3498db] text-white',
      icon: Code,
      label: 'Development'
    },
    'honey-period': {
      color: 'bg-[#f39c12] text-white',
      icon: Heart,
      label: 'Honey Period'
    },
    retainer: {
      color: 'bg-[#27ae60] text-white',
      icon: RefreshCw,
      label: 'Retainer'
    },
    completed: {
      color: 'bg-[#7f8c8d] text-white',
      icon: CheckCircle2,
      label: 'Completed'
    }
  };
  
  const quotationConfig = {
    draft: {
      color: 'bg-[#7f8c8d] text-white',
      icon: Circle,
      label: 'Draft'
    },
    sent: {
      color: 'bg-[#3498db] text-white',
      icon: Clock,
      label: 'Sent'
    },
    accepted: {
      color: 'bg-[#27ae60] text-white',
      icon: CheckCircle,
      label: 'Accepted'
    },
    rejected: {
      color: 'bg-[#e74c3c] text-white',
      icon: XCircle,
      label: 'Rejected'
    },
    expired: {
      color: 'bg-[#95a5a6] text-white',
      icon: HourglassIcon,
      label: 'Expired'
    }
  };
  
  const config = variant === 'invoice' 
    ? invoiceConfig[status as InvoiceStatus]
    : variant === 'project'
    ? projectConfig[status as ProjectStatus]
    : quotationConfig[status as QuotationStatus];
  
  if (!config) return null;
  
  const Icon = config.icon;
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${config.color}`}
      role="status"
      aria-label={`Status: ${config.label}`}
    >
      <Icon size={12} />
      {config.label}
    </span>
  );
}
