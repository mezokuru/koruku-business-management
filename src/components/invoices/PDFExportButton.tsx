import { useState } from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';
import { downloadInvoicePDF, printInvoicePDF, type InvoiceWithRelations } from '../../lib/pdfGenerator';
import { useSettings } from '../../hooks/useSettings';
import toast from 'react-hot-toast';
import type { Invoice } from '../../types/database';

interface PDFExportButtonProps {
  invoice: Invoice;
  variant?: 'download' | 'print' | 'both';
  compact?: boolean;
}

const PDFExportButton = ({ invoice, variant = 'both', compact = false }: PDFExportButtonProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: settings } = useSettings();

  const handleDownload = async () => {
    if (!settings) {
      toast.error('Unable to load business settings');
      return;
    }

    setIsGenerating(true);
    try {
      const invoiceWithRelations: InvoiceWithRelations = {
        ...invoice,
        client: invoice.client || null,
        project: invoice.project || null,
      };
      
      const businessSettings = {
        business_name: settings.business_info?.business_name || 'KORUKU',
        business_address: settings.business_info?.business_address || '',
        business_phone: settings.business_info?.business_phone || '',
        business_email: settings.business_info?.business_email || '',
        business_website: settings.business_info?.business_website,
        tax_number: settings.business_info?.tax_number,
        bank_name: settings.business_info?.bank_name,
        bank_account_number: settings.business_info?.bank_account_number,
        bank_branch_code: settings.business_info?.bank_branch_code,
      };
      
      downloadInvoicePDF(invoiceWithRelations, businessSettings);
      toast.success('Invoice PDF downloaded successfully');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    if (!settings) {
      toast.error('Unable to load business settings');
      return;
    }

    setIsGenerating(true);
    try {
      const invoiceWithRelations: InvoiceWithRelations = {
        ...invoice,
        client: invoice.client || null,
        project: invoice.project || null,
      };
      
      const businessSettings = {
        business_name: settings.business_info?.business_name || 'KORUKU',
        business_address: settings.business_info?.business_address || '',
        business_phone: settings.business_info?.business_phone || '',
        business_email: settings.business_info?.business_email || '',
        business_website: settings.business_info?.business_website,
        tax_number: settings.business_info?.tax_number,
        bank_name: settings.business_info?.bank_name,
        bank_account_number: settings.business_info?.bank_account_number,
        bank_branch_code: settings.business_info?.bank_branch_code,
      };
      
      printInvoicePDF(invoiceWithRelations, businessSettings);
      toast.success('Opening print dialog...');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  if (variant === 'download') {
    if (compact) {
      return (
        <button
          onClick={handleDownload}
          disabled={isGenerating}
          className="p-2 rounded hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#ffd166] min-w-[44px] min-h-[44px] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Download invoice as PDF"
          title="Download PDF"
        >
          {isGenerating ? (
            <Loader2 className="animate-spin text-[#27ae60]" size={18} aria-hidden="true" />
          ) : (
            <Download size={18} className="text-[#27ae60]" aria-hidden="true" />
          )}
        </button>
      );
    }
    
    return (
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#27ae60] text-white rounded-lg hover:bg-[#229954] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:ring-offset-2 min-h-[44px]"
        aria-label="Download invoice as PDF"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Download size={18} aria-hidden="true" />
            <span>Download PDF</span>
          </>
        )}
      </button>
    );
  }

  if (variant === 'print') {
    return (
      <button
        onClick={handlePrint}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:ring-offset-2 min-h-[44px]"
        aria-label="Print invoice"
      >
        {isGenerating ? (
          <>
            <Loader2 className="animate-spin" size={18} aria-hidden="true" />
            <span>Generating...</span>
          </>
        ) : (
          <>
            <Printer size={18} aria-hidden="true" />
            <span>Print</span>
          </>
        )}
      </button>
    );
  }

  // Both buttons
  return (
    <div className="flex gap-2">
      <button
        onClick={handleDownload}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#27ae60] text-white rounded-lg hover:bg-[#229954] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:ring-offset-2 min-h-[44px]"
        aria-label="Download invoice as PDF"
      >
        {isGenerating ? (
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
        ) : (
          <Download size={18} aria-hidden="true" />
        )}
        <span className="hidden sm:inline">Download PDF</span>
      </button>
      
      <button
        onClick={handlePrint}
        disabled={isGenerating}
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#3498db] text-white rounded-lg hover:bg-[#2980b9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#ffd166] focus:ring-offset-2 min-h-[44px]"
        aria-label="Print invoice"
      >
        {isGenerating ? (
          <Loader2 className="animate-spin" size={18} aria-hidden="true" />
        ) : (
          <Printer size={18} aria-hidden="true" />
        )}
        <span className="hidden sm:inline">Print</span>
      </button>
    </div>
  );
};

export default PDFExportButton;
