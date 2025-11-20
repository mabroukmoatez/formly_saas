import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Set up PDF.js worker - use local worker file from public folder
// This is the most reliable solution - no dependency on external CDNs
// The worker file (version 5.4.394) is stored in public/pdf.worker.min.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

export interface ExtractedInvoiceData {
  invoice_number?: string;
  quote_number?: string;
  client?: {
    name?: string;
    email?: string;
    address?: string;
    phone?: string;
  };
  invoice_date?: string;
  quote_date?: string;
  due_date?: string;
  valid_until?: string;
  items?: Array<{
    description?: string;
    designation?: string;
    quantity?: number;
    unit_price?: number;
    price_ht?: number;
    tax_rate?: number;
    tva_rate?: number;
    total?: number;
    total_ht?: number;
  }>;
  total_ht?: number;
  total_tva?: number;
  total_ttc?: number;
  payment_conditions?: string;
  notes?: string;
}

/**
 * Extract text from PDF file
 */
async function extractTextFromPDF(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }

  return fullText;
}

/**
 * Extract data from Excel file
 */
async function extractDataFromExcel(file: File): Promise<any[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
  return data;
}

/**
 * Parse invoice/quote number from text
 */
function parseDocumentNumber(text: string, isQuote: boolean = false): string | undefined {
  const patterns = [
    isQuote 
      ? /(?:devis|quote|devis\s*n[°:]\s*|n[°:]\s*devis\s*)([A-Z0-9\-]+)/i
      : /(?:facture|invoice|facture\s*n[°:]\s*|n[°:]\s*facture\s*)([A-Z0-9\-]+)/i,
    /(?:n[°:]\s*|num[°:]\s*|ref[°:]\s*)([A-Z0-9\-]+)/i,
    /([A-Z]{1,3}[-/]\d{4}[-/]\d{2}[-/]\d{2,4})/i,
    /([A-Z]{1,3}[-/]\d{2,4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1] || match[0];
    }
  }

  return undefined;
}

/**
 * Parse date from text
 */
function parseDate(text: string, fieldName: string = 'date'): string | undefined {
  const patterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
    /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/g,
  ];

  const dates: string[] = [];
  for (const pattern of patterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      dates.push(match[1]);
    }
  }

  if (dates.length > 0) {
    // Try to parse and format the date
    const dateStr = dates[0];
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      let day: string, month: string, year: string;
      
      if (parts[0].length === 4) {
        // YYYY-MM-DD format
        year = parts[0];
        month = parts[1].padStart(2, '0');
        day = parts[2].padStart(2, '0');
      } else {
        // DD/MM/YYYY or DD-MM-YYYY format
        day = parts[0].padStart(2, '0');
        month = parts[1].padStart(2, '0');
        year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
      }
      
      return `${year}-${month}-${day}`;
    }
  }

  return undefined;
}

/**
 * Parse client information from text
 */
function parseClientInfo(text: string): { name?: string; email?: string; address?: string; phone?: string } {
  const client: { name?: string; email?: string; address?: string; phone?: string } = {};

  // Extract email
  const emailMatch = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);
  if (emailMatch) {
    client.email = emailMatch[1];
  }

  // Extract phone
  const phonePatterns = [
    /(?:\+33|0)[1-9](?:[.\s]?\d{2}){4}/g,
    /(?:\+33|0)\d{9}/g,
    /(\d{2}[.\s]?\d{2}[.\s]?\d{2}[.\s]?\d{2}[.\s]?\d{2})/g,
  ];
  for (const pattern of phonePatterns) {
    const match = text.match(pattern);
    if (match) {
      client.phone = match[0].replace(/[.\s]/g, '');
      break;
    }
  }

  // Extract client name (look for common patterns)
  const namePatterns = [
    /(?:client|client\s*:)\s*([A-Z][A-Za-z\s]+)/i,
    /(?:à\s*l['\s]attention\s*de|destinataire|bénéficiaire)\s*:?\s*([A-Z][A-Za-z\s]+)/i,
    /(?:société|company|entreprise)\s*:?\s*([A-Z][A-Za-z0-9\s&]+)/i,
  ];
  for (const pattern of namePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      client.name = match[1].trim();
      break;
    }
  }

  // Extract address (look for common address patterns)
  const addressPatterns = [
    /(?:adresse|address)\s*:?\s*([A-Za-z0-9\s,]+(?:\d{5})?[A-Za-z\s]*)/i,
    /(\d+[,\s]+[A-Za-z\s]+(?:rue|avenue|boulevard|route|impasse|allée)[A-Za-z\s,]+(?:\d{5})?[A-Za-z\s]*)/i,
  ];
  for (const pattern of addressPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      client.address = match[1].trim();
      break;
    }
  }

  return client;
}

/**
 * Parse items from text (for PDF)
 */
function parseItemsFromText(text: string): Array<{
  description?: string;
  quantity?: number;
  unit_price?: number;
  tax_rate?: number;
  total?: number;
}> {
  const items: Array<{
    description?: string;
    quantity?: number;
    unit_price?: number;
    tax_rate?: number;
    total?: number;
  }> = [];

  // Look for table-like structures
  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Try to find item rows (usually contain numbers for quantity, price, total)
  let inItemsSection = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Detect items section
    if (line.includes('désignation') || line.includes('description') || 
        line.includes('article') || line.includes('libellé') ||
        line.includes('quantité') || line.includes('prix') || line.includes('total')) {
      inItemsSection = true;
      continue;
    }

    // Skip if we're past items section
    if (inItemsSection && (line.includes('total') || line.includes('tva') || line.includes('ttc'))) {
      if (line.includes('total') && !line.includes('quantité')) {
        break;
      }
    }

    if (inItemsSection) {
      // Try to extract item data
      const numbers = line.match(/\d+[.,]?\d*/g);
      if (numbers && numbers.length >= 2) {
        const parts = line.split(/\s{2,}|\t/);
        if (parts.length >= 3) {
          const item = {
            description: parts[0]?.trim() || parts.slice(0, -3).join(' ').trim(),
            quantity: parseFloat(numbers[0]?.replace(',', '.') || '1'),
            unit_price: parseFloat(numbers[1]?.replace(',', '.') || '0'),
            tax_rate: 20, // Default TVA rate
            total: parseFloat(numbers[numbers.length - 1]?.replace(',', '.') || '0'),
          };
          
          if (item.description && item.quantity > 0 && item.unit_price > 0) {
            items.push(item);
          }
        }
      }
    }
  }

  return items;
}

/**
 * Parse totals from text
 */
function parseTotals(text: string): { total_ht?: number; total_tva?: number; total_ttc?: number } {
  const totals: { total_ht?: number; total_tva?: number; total_ttc?: number } = {};

  // Look for total patterns
  const patterns = {
    total_ht: /(?:total\s*ht|ht\s*total|montant\s*ht|sous\s*total)\s*:?\s*([\d\s,]+)/i,
    total_tva: /(?:tva|taxe)\s*:?\s*([\d\s,]+)/i,
    total_ttc: /(?:total\s*ttc|ttc\s*total|montant\s*ttc|total\s*à\s*payer)\s*:?\s*([\d\s,]+)/i,
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const value = parseFloat(match[1].replace(/\s/g, '').replace(',', '.'));
      if (!isNaN(value)) {
        totals[key as keyof typeof totals] = value;
      }
    }
  }

  return totals;
}

/**
 * Extract invoice/quote data from PDF
 */
export async function extractDataFromPDF(file: File, isQuote: boolean = false): Promise<ExtractedInvoiceData> {
  const text = await extractTextFromPDF(file);
  const extracted: ExtractedInvoiceData = {};

  // Extract document number
  extracted[isQuote ? 'quote_number' : 'invoice_number'] = parseDocumentNumber(text, isQuote);

  // Extract dates
  const date = parseDate(text, 'date');
  if (date) {
    extracted[isQuote ? 'quote_date' : 'invoice_date'] = date;
  }

  // Extract client info
  extracted.client = parseClientInfo(text);

  // Extract items
  extracted.items = parseItemsFromText(text);

  // Extract totals
  const totals = parseTotals(text);
  extracted.total_ht = totals.total_ht;
  extracted.total_tva = totals.total_tva;
  extracted.total_ttc = totals.total_ttc;

  return extracted;
}

/**
 * Extract invoice/quote data from Excel
 */
export async function extractInvoiceDataFromExcel(file: File, isQuote: boolean = false): Promise<ExtractedInvoiceData> {
  const data = await extractDataFromExcel(file);
  const extracted: ExtractedInvoiceData = {};

  if (data.length === 0) {
    return extracted;
  }

  // Try to detect structure
  const firstRow = data[0] as any;
  const keys = Object.keys(firstRow);

  // Map common Excel column names to our structure
  const columnMap: Record<string, string> = {
    'n°': 'number',
    'numero': 'number',
    'numéro': 'number',
    'reference': 'number',
    'référence': 'number',
    'client': 'client_name',
    'nom client': 'client_name',
    'client name': 'client_name',
    'email': 'email',
    'adresse': 'address',
    'address': 'address',
    'telephone': 'phone',
    'téléphone': 'phone',
    'phone': 'phone',
    'date': 'date',
    'designation': 'description',
    'désignation': 'description',
    'description': 'description',
    'libellé': 'description',
    'quantité': 'quantity',
    'quantity': 'quantity',
    'qty': 'quantity',
    'prix unitaire': 'unit_price',
    'prix': 'unit_price',
    'unit price': 'unit_price',
    'price': 'unit_price',
    'taux tva': 'tax_rate',
    'tva': 'tax_rate',
    'tax': 'tax_rate',
    'total': 'total',
    'montant': 'total',
    'amount': 'total',
  };

  // Extract header row
  let headerRow: any = null;
  let itemsStartIndex = 0;

  for (let i = 0; i < data.length; i++) {
    const row = data[i] as any;
    const rowKeys = Object.keys(row);
    
    // Check if this looks like a header row
    if (rowKeys.some(key => columnMap[key.toLowerCase()] === 'description' || 
                            columnMap[key.toLowerCase()] === 'quantity')) {
      headerRow = row;
      itemsStartIndex = i + 1;
      break;
    }
  }

  // Extract items
  const items: any[] = [];
  for (let i = itemsStartIndex; i < data.length; i++) {
    const row = data[i] as any;
    const item: any = {};

    for (const [excelKey, mappedKey] of Object.entries(columnMap)) {
      const matchingKey = Object.keys(row).find(k => k.toLowerCase() === excelKey);
      if (matchingKey && row[matchingKey]) {
        if (mappedKey === 'quantity' || mappedKey === 'unit_price' || mappedKey === 'tax_rate' || mappedKey === 'total') {
          item[mappedKey] = parseFloat(String(row[matchingKey]).replace(',', '.')) || 0;
        } else if (mappedKey === 'description') {
          item.description = String(row[matchingKey]);
        }
      }
    }

    // Also check for client info in first rows
    if (i < itemsStartIndex) {
      for (const [excelKey, mappedKey] of Object.entries(columnMap)) {
        const matchingKey = Object.keys(row).find(k => k.toLowerCase() === excelKey);
        if (matchingKey && row[matchingKey]) {
          if (mappedKey === 'client_name' && !extracted.client?.name) {
            extracted.client = extracted.client || {};
            extracted.client.name = String(row[matchingKey]);
          } else if (mappedKey === 'email' && !extracted.client?.email) {
            extracted.client = extracted.client || {};
            extracted.client.email = String(row[matchingKey]);
          } else if (mappedKey === 'address' && !extracted.client?.address) {
            extracted.client = extracted.client || {};
            extracted.client.address = String(row[matchingKey]);
          } else if (mappedKey === 'phone' && !extracted.client?.phone) {
            extracted.client = extracted.client || {};
            extracted.client.phone = String(row[matchingKey]);
          } else if (mappedKey === 'date' && !extracted[isQuote ? 'quote_date' : 'invoice_date']) {
            const dateStr = String(row[matchingKey]);
            const parsedDate = parseDate(dateStr, 'date');
            if (parsedDate) {
              extracted[isQuote ? 'quote_date' : 'invoice_date'] = parsedDate;
            }
          } else if (mappedKey === 'number' && !extracted[isQuote ? 'quote_number' : 'invoice_number']) {
            extracted[isQuote ? 'quote_number' : 'invoice_number'] = String(row[matchingKey]);
          }
        }
      }
    }

    if (item.description && (item.quantity || item.unit_price)) {
      items.push(item);
    }
  }

  extracted.items = items;

  // Calculate totals if not present
  if (items.length > 0) {
    extracted.total_ht = items.reduce((sum, item) => sum + (item.total || (item.unit_price || 0) * (item.quantity || 0)), 0);
    extracted.total_tva = items.reduce((sum, item) => {
      const itemTotal = item.total || (item.unit_price || 0) * (item.quantity || 0);
      return sum + (itemTotal * (item.tax_rate || 20) / 100);
    }, 0);
    extracted.total_ttc = (extracted.total_ht || 0) + (extracted.total_tva || 0);
  }

  return extracted;
}

/**
 * Main function to extract data from file (PDF or Excel)
 */
export async function extractDocumentData(file: File, isQuote: boolean = false): Promise<ExtractedInvoiceData> {
  const fileType = file.type;
  const fileName = file.name.toLowerCase();

  if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
    return await extractDataFromPDF(file, isQuote);
  } else if (
    fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
    fileType === 'application/vnd.ms-excel' ||
    fileName.endsWith('.xlsx') ||
    fileName.endsWith('.xls')
  ) {
    return await extractInvoiceDataFromExcel(file, isQuote);
  } else {
    throw new Error('Format de fichier non supporté. Utilisez PDF ou Excel (.xlsx, .xls)');
  }
}

