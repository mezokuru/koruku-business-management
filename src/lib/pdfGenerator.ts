import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Invoice, Client, Project, Quotation, QuotationItem } from '../types/database';

export interface InvoiceWithRelations extends Omit<Invoice, 'client' | 'project'> {
  client: Client | null;
  project: Project | null;
}

interface BusinessSettings {
  business_name: string;
  business_address: string;
  business_phone: string;
  business_email: string;
  business_website?: string;
  tax_number?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_branch_code?: string;
  logo_url?: string;
}

export function generateInvoicePDF(
  invoice: InvoiceWithRelations,
  settings: BusinessSettings
) {
  const doc = new jsPDF();
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Colors
  const primaryColor = '#2c3e50';
  const accentColor = '#ffd166';
  const textColor = '#2c3e50';
  const lightGray = '#7f8c8d';



  // Header - Business Logo/Name
  doc.setFillColor(accentColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add logo if available
  if (settings.logo_url) {
    try {
      // Note: Logo must be loaded as base64 or accessible URL
      // For now, we'll add the logo space and text fallback
      doc.setFontSize(24);
      doc.setTextColor(primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.business_name || 'KORUKU', margin + 45, 25);
      // Logo would be added here: doc.addImage(logoData, 'PNG', margin, 10, 35, 20);
    } catch (error) {
      // Fallback to text only
      doc.setFontSize(24);
      doc.setTextColor(primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.business_name || 'KORUKU', margin, 25);
    }
  } else {
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.business_name || 'KORUKU', margin, 25);
  }

  // Business Details
  yPos = 50;
  doc.setFontSize(9);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  
  if (settings.business_address) {
    doc.text(settings.business_address, margin, yPos);
    yPos += 5;
  }
  if (settings.business_phone) {
    doc.text(`Tel: ${settings.business_phone}`, margin, yPos);
    yPos += 5;
  }
  if (settings.business_email) {
    doc.text(`Email: ${settings.business_email}`, margin, yPos);
    yPos += 5;
  }
  if (settings.business_website) {
    doc.text(`Web: ${settings.business_website}`, margin, yPos);
    yPos += 5;
  }
  if (settings.tax_number) {
    doc.text(`VAT: ${settings.tax_number}`, margin, yPos);
    yPos += 5;
  }

  // Invoice Title
  yPos += 10;
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, yPos, { align: 'right' });

  // Invoice Details (Right side)
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  
  const invoiceDetailsX = pageWidth - margin - 60;
  doc.text('Invoice Number:', invoiceDetailsX, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.invoice_number, pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', invoiceDetailsX, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(format(new Date(invoice.date), 'dd MMM yyyy'), pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Due Date:', invoiceDetailsX, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(format(new Date(invoice.due_date), 'dd MMM yyyy'), pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Status:', invoiceDetailsX, yPos);
  doc.setFont('helvetica', 'bold');
  const statusColor = invoice.status === 'paid' ? '#27ae60' : 
                      invoice.status === 'overdue' ? '#e74c3c' : 
                      invoice.status === 'sent' ? '#3498db' : '#7f8c8d';
  doc.setTextColor(statusColor);
  doc.text(invoice.status.toUpperCase(), pageWidth - margin, yPos, { align: 'right' });

  // Bill To Section
  yPos += 15;
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', margin, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(invoice.client?.business || 'N/A', margin, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  if (invoice.client?.email) {
    doc.text(invoice.client.email, margin, yPos);
    yPos += 5;
  }
  if (invoice.client?.phone) {
    doc.text(invoice.client.phone, margin, yPos);
    yPos += 5;
  }

  // Project Details (if applicable)
  if (invoice.project) {
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(lightGray);
    doc.text(`Project: ${invoice.project.name}`, margin, yPos);
    yPos += 5;
  }

  // Line Items Table
  yPos += 10;
  
  // Table Header
  doc.setFillColor(primaryColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin + 5, yPos + 7);
  doc.text('Amount', pageWidth - margin - 5, yPos + 7, { align: 'right' });

  yPos += 15;

  // Table Row - Description
  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'normal');
  
  const descriptionLines = doc.splitTextToSize(
    invoice.description || 'Professional services rendered',
    pageWidth - 2 * margin - 50
  );
  
  doc.text(descriptionLines, margin + 5, yPos);
  const descriptionHeight = descriptionLines.length * 5;
  
  // Amount
  doc.setFont('helvetica', 'bold');
  doc.text(`R ${invoice.amount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });

  yPos += descriptionHeight + 10;

  // Totals Section
  const totalsX = pageWidth - margin - 80;
  
  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`R ${invoice.amount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });

  // Total
  yPos += 10;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 5, yPos - 3, pageWidth - margin, yPos - 3);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(`R ${invoice.amount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });

  // Notes Section
  if (invoice.notes) {
    yPos += 20;
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPos);
    
    yPos += 7;
    doc.setFontSize(9);
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 5;
  }

  // Payment Terms
  yPos += 15;
  doc.setFontSize(10);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Terms:', margin, yPos);
  
  yPos += 7;
  doc.setFontSize(9);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment is due within 30 days from the invoice date.`, margin, yPos);

  // Bank Details (if available)
  if (settings.bank_name && settings.bank_account_number) {
    yPos += 10;
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Banking Details:', margin, yPos);
    
    yPos += 7;
    doc.setFontSize(9);
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'normal');
    doc.text(`Bank: ${settings.bank_name}`, margin, yPos);
    yPos += 5;
    doc.text(`Account Number: ${settings.bank_account_number}`, margin, yPos);
    if (settings.bank_branch_code) {
      yPos += 5;
      doc.text(`Branch Code: ${settings.bank_branch_code}`, margin, yPos);
    }
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

export function downloadInvoicePDF(invoice: InvoiceWithRelations, settings: BusinessSettings) {
  const doc = generateInvoicePDF(invoice, settings);
  const fileName = `Invoice_${invoice.invoice_number}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
  return doc;
}

export function printInvoicePDF(invoice: InvoiceWithRelations, settings: BusinessSettings) {
  const doc = generateInvoicePDF(invoice, settings);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl') as unknown as string;
  window.open(blobUrl, '_blank');
  return doc;
}


// Quotation PDF Generation
export interface QuotationWithRelations extends Omit<Quotation, 'client' | 'project' | 'items'> {
  client: Client | null;
  project: Project | null;
  items: QuotationItem[];
}

export function generateQuotationPDF(
  quotation: QuotationWithRelations,
  settings: BusinessSettings
) {
  const doc = new jsPDF();
  
  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;

  // Colors
  const primaryColor = '#2c3e50';
  const accentColor = '#ffd166';
  const textColor = '#2c3e50';
  const lightGray = '#7f8c8d';

  // Header - Business Logo/Name
  doc.setFillColor(accentColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Add logo if available
  if (settings.logo_url) {
    try {
      doc.setFontSize(24);
      doc.setTextColor(primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.business_name || 'KORUKU', margin + 45, 25);
    } catch (error) {
      doc.setFontSize(24);
      doc.setTextColor(primaryColor);
      doc.setFont('helvetica', 'bold');
      doc.text(settings.business_name || 'KORUKU', margin, 25);
    }
  } else {
    doc.setFontSize(24);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.business_name || 'KORUKU', margin, 25);
  }

  // Business Details
  yPos = 50;
  doc.setFontSize(9);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'normal');
  
  if (settings.business_address) {
    doc.text(settings.business_address, margin, yPos);
    yPos += 5;
  }
  if (settings.business_phone) {
    doc.text(`Tel: ${settings.business_phone}`, margin, yPos);
    yPos += 5;
  }
  if (settings.business_email) {
    doc.text(`Email: ${settings.business_email}`, margin, yPos);
    yPos += 5;
  }

  // Quotation Title
  yPos += 10;
  doc.setFontSize(20);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('QUOTATION', pageWidth - margin, yPos, { align: 'right' });

  // Quotation Details (Right side)
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(textColor);
  
  const quotationDetailsX = pageWidth - margin - 60;
  doc.text('Quotation Number:', quotationDetailsX, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(quotation.quotation_number, pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', quotationDetailsX, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(format(new Date(quotation.date), 'dd MMM yyyy'), pageWidth - margin, yPos, { align: 'right' });
  
  yPos += 7;
  doc.setFont('helvetica', 'normal');
  doc.text('Valid Until:', quotationDetailsX, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(format(new Date(quotation.valid_until), 'dd MMM yyyy'), pageWidth - margin, yPos, { align: 'right' });

  // Bill To Section
  yPos += 15;
  doc.setFontSize(12);
  doc.setTextColor(primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('PREPARED FOR:', margin, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'bold');
  doc.text(quotation.client?.business || 'N/A', margin, yPos);

  yPos += 6;
  doc.setFont('helvetica', 'normal');
  if (quotation.client?.email) {
    doc.text(quotation.client.email, margin, yPos);
    yPos += 5;
  }
  if (quotation.client?.phone) {
    doc.text(quotation.client.phone, margin, yPos);
    yPos += 5;
  }

  // Project Details (if applicable)
  if (quotation.project) {
    yPos += 5;
    doc.setFontSize(9);
    doc.setTextColor(lightGray);
    doc.text(`Project: ${quotation.project.name}`, margin, yPos);
    yPos += 5;
  }

  // Line Items Table
  yPos += 10;
  
  // Table Header
  doc.setFillColor(primaryColor);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 10, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', margin + 5, yPos + 7);
  doc.text('Qty', pageWidth - margin - 80, yPos + 7, { align: 'right' });
  doc.text('Unit Price', pageWidth - margin - 50, yPos + 7, { align: 'right' });
  doc.text('Amount', pageWidth - margin - 5, yPos + 7, { align: 'right' });

  yPos += 15;

  // Table Rows - Items
  doc.setFontSize(10);
  doc.setTextColor(textColor);
  doc.setFont('helvetica', 'normal');
  
  if (quotation.items && quotation.items.length > 0) {
    quotation.items.forEach((item) => {
      const descriptionLines = doc.splitTextToSize(item.description, pageWidth - 2 * margin - 100);
      doc.text(descriptionLines, margin + 5, yPos);
      doc.text(item.quantity.toString(), pageWidth - margin - 80, yPos, { align: 'right' });
      doc.text(`R ${item.unit_price.toFixed(2)}`, pageWidth - margin - 50, yPos, { align: 'right' });
      doc.text(`R ${item.amount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
      
      yPos += Math.max(descriptionLines.length * 5, 7);
    });
  }

  yPos += 10;

  // Totals Section
  const totalsX = pageWidth - margin - 80;
  
  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', totalsX, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`R ${quotation.subtotal.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });

  // Discount (if applicable)
  if (quotation.discount_percentage > 0) {
    yPos += 7;
    doc.setFont('helvetica', 'normal');
    doc.text(`Discount (${quotation.discount_percentage}%):`, totalsX, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(`-R ${quotation.discount_amount.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });
  }

  // Total
  yPos += 10;
  doc.setDrawColor(primaryColor);
  doc.setLineWidth(0.5);
  doc.line(totalsX - 5, yPos - 3, pageWidth - margin, yPos - 3);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor);
  doc.text('TOTAL:', totalsX, yPos);
  doc.text(`R ${quotation.total.toFixed(2)}`, pageWidth - margin - 5, yPos, { align: 'right' });

  // Notes Section
  if (quotation.notes) {
    yPos += 20;
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes:', margin, yPos);
    
    yPos += 7;
    doc.setFontSize(9);
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'normal');
    const notesLines = doc.splitTextToSize(quotation.notes, pageWidth - 2 * margin);
    doc.text(notesLines, margin, yPos);
    yPos += notesLines.length * 5;
  }

  // Terms Section
  if (quotation.terms) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setTextColor(primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions:', margin, yPos);
    
    yPos += 7;
    doc.setFontSize(9);
    doc.setTextColor(textColor);
    doc.setFont('helvetica', 'normal');
    const termsLines = doc.splitTextToSize(quotation.terms, pageWidth - 2 * margin);
    doc.text(termsLines, margin, yPos);
  }

  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 20;
  doc.setFontSize(8);
  doc.setTextColor(lightGray);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for considering our services!', pageWidth / 2, footerY, { align: 'center' });

  return doc;
}

export function downloadQuotationPDF(quotation: QuotationWithRelations, settings: BusinessSettings) {
  const doc = generateQuotationPDF(quotation, settings);
  const fileName = `Quotation_${quotation.quotation_number}_${format(new Date(), 'yyyyMMdd')}.pdf`;
  doc.save(fileName);
  return doc;
}

export function printQuotationPDF(quotation: QuotationWithRelations, settings: BusinessSettings) {
  const doc = generateQuotationPDF(quotation, settings);
  doc.autoPrint();
  const blobUrl = doc.output('bloburl') as unknown as string;
  window.open(blobUrl, '_blank');
  return doc;
}
