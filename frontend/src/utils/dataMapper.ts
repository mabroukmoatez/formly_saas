import { ExtractedInvoiceData } from '../services/ocrService';

export interface MappedInvoiceData {
  invoice_number?: string;
  quote_number?: string;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  issue_date?: string;
  quote_date?: string;
  valid_until?: string;
  items?: Array<{
    reference?: string;
    designation: string;
    quantity: number;
    unit_price: number;
    tax_rate: number;
    total: number;
  }>;
  payment_conditions?: string;
  notes?: string;
}

/**
 * Map extracted OCR data to invoice/quote creation form format
 */
export function mapExtractedDataToForm(
  extractedData: ExtractedInvoiceData,
  isQuote: boolean = false
): MappedInvoiceData {
  const mapped: MappedInvoiceData = {};

  // Map document number
  if (isQuote) {
    mapped.quote_number = extractedData.quote_number;
    mapped.quote_date = extractedData.quote_date;
    mapped.valid_until = extractedData.valid_until;
  } else {
    mapped.invoice_number = extractedData.invoice_number;
    mapped.issue_date = extractedData.invoice_date || extractedData.invoice_date;
  }

  // Map client info
  if (extractedData.client) {
    mapped.client_name = extractedData.client.name || '';
    mapped.client_email = extractedData.client.email || '';
    mapped.client_address = extractedData.client.address || '';
    mapped.client_phone = extractedData.client.phone || '';
  }

  // Map items
  if (extractedData.items && extractedData.items.length > 0) {
    mapped.items = extractedData.items.map((item, index) => ({
      reference: '',
      designation: item.description || item.designation || `Article ${index + 1}`,
      quantity: item.quantity || 1,
      unit_price: item.unit_price || item.price_ht || 0,
      tax_rate: item.tax_rate || item.tva_rate || 20,
      total: item.total || item.total_ht || (item.unit_price || item.price_ht || 0) * (item.quantity || 1),
    }));
  }

  // Map payment conditions and notes
  mapped.payment_conditions = extractedData.payment_conditions || '';
  mapped.notes = extractedData.notes || '';

  return mapped;
}

