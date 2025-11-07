/**
 * Commercial Management Types
 * Types for Invoices, Quotes, Articles, and Charges/Expenses
 */

export interface InvoiceClient {
  id: number;
  organization_id: number;
  type: string;
  company_name?: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  zip_code?: string;
  city?: string;
  country?: string;
  siret?: string;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client?: InvoiceClient;
  amount: number;
  tax?: number;
  total_amount?: number;
  total_ttc?: string;
  total_ht?: string;
  total_tva?: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  due_date?: string;
  issue_date: string;
  paid_date?: string;
  description?: string;
  items?: InvoiceItem[];
  payment_terms?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceItem {
  id: string | number;
  invoice_id?: number;
  description: string;
  designation?: string;
  quantity: number;
  unit_price?: number;
  price_ht?: string;
  total?: number;
  total_ht?: string;
  tax_rate?: number;
  tva_rate?: string;
}

export interface Quote {
  id: string;
  quote_number: string;
  client_name?: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  client?: InvoiceClient;
  amount: number;
  tax?: number;
  total_amount?: number;
  total_ttc?: string;
  total_ht?: string;
  total_tva?: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  valid_until?: string;
  issue_date: string;
  accepted_date?: string;
  description?: string;
  items?: QuoteItem[];
  payment_conditions?: string; // Backend field name
  payment_schedule_text?: string; // New structured payment schedule text
  notes?: string;
  expires_at?: string;
  created_at: string;
  updated_at: string;
}

export interface QuoteItem {
  id: string | number;
  quote_id?: number;
  description: string;
  designation?: string;
  quantity: number;
  unit_price?: number;
  price_ht?: string;
  total?: number;
  total_ht?: string;
  tax_rate?: number;
  tva_rate?: string;
}

export interface Article {
  id: string | number;
  name?: string;
  designation?: string;
  reference?: string;
  description?: string;
  unit_price?: number;
  price_ht?: string;
  price_ttc?: string;
  tva?: string;
  tva_rate?: number;
  category?: string;
  tax_rate?: number;
  unit?: string;
  stock_quantity?: number;
  min_stock?: number;
  image_url?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Charge {
  id: string | number;
  organization_id: number;
  category: string;
  label: string;
  description?: string;
  reference?: string;
  role?: string | null;
  contract_type?: string | null;
  course_id?: number | null;
  amount: string;
  date?: string;
  created_at: string;
  updated_at: string;
  course?: any;
  documents?: Array<{
    id: number;
    expense_id: number;
    file_path: string;
    original_name: string;
    created_at: string;
    updated_at: string;
  }>;
  // Legacy fields for compatibility
  expense_type?: string;
  description?: string;
  tax?: number;
  total_amount?: number;
  payment_date?: string;
  vendor?: string;
  receipt_url?: string;
  notes?: string;
  status?: 'pending' | 'paid' | 'rejected';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface ListResponse<T> {
  data: T[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    total_pages: number;
  };
}

export interface InvoiceListResponse extends ApiResponse<ListResponse<Invoice>> {}
export interface InvoiceDetailsResponse extends ApiResponse<{ invoice: Invoice }> {}
export interface CreateInvoiceData {
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  amount: number;
  tax?: number;
  due_date?: string;
  description?: string;
  items?: Partial<InvoiceItem>[];
  payment_terms?: string;
  notes?: string;
  status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}
export interface UpdateInvoiceData extends Partial<CreateInvoiceData> {}
export interface InvoiceStatistics {
  total_invoices: number;
  total_revenue: number;
  paid_invoices: number;
  overdue_invoices: number;
  pending_amount: number;
}

export interface QuoteListResponse extends ApiResponse<ListResponse<Quote>> {}
export interface QuoteDetailsResponse extends ApiResponse<{ quote: Quote }> {}
export interface CreateQuoteData {
  client_name: string;
  client_email?: string;
  client_address?: string;
  client_phone?: string;
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
  amount: number;
  tax?: number;
  valid_until?: string;
  description?: string;
  items?: Partial<QuoteItem>[];
  payment_conditions?: string; // Backend field name
  payment_schedule_text?: string; // New structured payment schedule text
  notes?: string;
}
export interface UpdateQuoteData extends Partial<CreateQuoteData> {}
export interface QuoteStatistics {
  total_quotes: number;
  accepted_quotes: number;
  rejected_quotes: number;
  pending_quotes: number;
  total_revenue: number;
}

export interface ArticleListResponse extends ApiResponse<ListResponse<Article>> {}
export interface ArticleDetailsResponse extends ApiResponse<{ article: Article }> {}
export interface CreateArticleData {
  name: string;
  description?: string;
  reference: string;
  category?: string;
  unit_price: number;
  tax_rate?: number;
  unit?: string;
  stock_quantity?: number;
  min_stock?: number;
  image_url?: string;
}
export interface UpdateArticleData extends Partial<CreateArticleData> {}

export interface ChargeListResponse extends ApiResponse<ListResponse<Charge>> {}
export interface ChargeDetailsResponse extends ApiResponse<{ charge: Charge }> {}
export interface CreateChargeData {
  expense_type: string;
  description: string;
  amount: number;
  tax?: number;
  category: 'office' | 'travel' | 'marketing' | 'utilities' | 'salary' | 'other';
  payment_date: string;
  vendor?: string;
  receipt_url?: string;
  notes?: string;
}
export interface UpdateChargeData extends Partial<CreateChargeData> {}
export interface ChargeStatistics {
  total_expenses: number;
  by_category: Record<string, number>;
  this_month: number;
  last_month: number;
}

export interface ExpensesDashboardResponse {
  success: boolean;
  data: {
    charts: {
      by_category: Array<{ name: string; value: number }>;
      monthly_evolution: Array<{ month: string; value: number }>;
      by_contract_type: Array<{ name: string; value: number }>;
    };
    summary: {
      total_expenses: number;
      total_count: number;
      average_expense: number;
    };
    top_expenses?: any[];
    recent_expenses?: any[];
  };
}

