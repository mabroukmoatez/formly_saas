import { apiService } from './api';
import {
  Invoice,
  Quote,
  Article,
  Charge,
  InvoiceListResponse,
  InvoiceDetailsResponse,
  CreateInvoiceData,
  UpdateInvoiceData,
  QuoteListResponse,
  QuoteDetailsResponse,
  CreateQuoteData,
  UpdateQuoteData,
  ArticleListResponse,
  ArticleDetailsResponse,
  CreateArticleData,
  UpdateArticleData,
  ChargeListResponse,
  ChargeDetailsResponse,
  CreateChargeData,
  UpdateChargeData,
  ApiResponse,
  InvoiceStatistics,
  QuoteStatistics,
  ChargeStatistics,
  ExpensesDashboardResponse,
} from './commercial.types';

/**
 * Service for commercial operations (Invoices, Quotes, Articles, Charges)
 */
class CommercialService {
  // ============ INVOICES ============
  async getInvoices(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    min_amount?: number;
    max_amount?: number;
    date_from?: string;
    date_to?: string;
    client_type?: string;
  }): Promise<InvoiceListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.min_amount) queryParams.append('min_amount', params.min_amount.toString());
    if (params?.max_amount) queryParams.append('max_amount', params.max_amount.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.client_type) queryParams.append('client_type', params.client_type);

    const endpoint = '/api/organization/commercial/invoices' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return await apiService.get<InvoiceListResponse>(endpoint);
  }

  async getInvoiceById(id: string): Promise<InvoiceDetailsResponse> {
    return await apiService.get<InvoiceDetailsResponse>(`/api/organization/commercial/invoices/${id}`);
  }

  async createInvoice(data: CreateInvoiceData): Promise<ApiResponse<{ invoice: Invoice }>> {
    return await apiService.post<ApiResponse<{ invoice: Invoice }>>('/api/organization/commercial/invoices', data);
  }

  async updateInvoice(id: string, data: UpdateInvoiceData): Promise<ApiResponse<{ invoice: Invoice }>> {
    return await apiService.put<ApiResponse<{ invoice: Invoice }>>(`/api/organization/commercial/invoices/${id}`, data);
  }

  async updateInvoiceStatus(id: string, status: string): Promise<ApiResponse<{ invoice: Invoice }>> {
    return await apiService.patch<ApiResponse<{ invoice: Invoice }>>(`/api/organization/commercial/invoices/${id}`, { status });
  }

  async deleteInvoice(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/api/organization/commercial/invoices/${id}`);
  }

  async getInvoiceStatistics(): Promise<ApiResponse<InvoiceStatistics>> {
    return await apiService.get<ApiResponse<InvoiceStatistics>>('/api/organization/commercial/invoices/statistics');
  }

  async generateInvoicePdf(id: string): Promise<Blob> {
    return await apiService.get<Blob>(`/api/organization/commercial/invoices/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  async sendInvoiceEmail(id: string, emailData: {
    email: string;
    cc?: string[];
    bcc?: string[];
    subject?: string;
    message?: string;
  }): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>(`/api/organization/commercial/invoices/${id}/send-email`, emailData);
  }

  // ============ QUOTES ============
  async getQuotes(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    min_amount?: number;
    max_amount?: number;
    date_from?: string;
    date_to?: string;
    client_type?: string;
  }): Promise<QuoteListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.min_amount) queryParams.append('min_amount', params.min_amount.toString());
    if (params?.max_amount) queryParams.append('max_amount', params.max_amount.toString());
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.client_type) queryParams.append('client_type', params.client_type);

    const endpoint = '/api/organization/commercial/quotes' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return await apiService.get<QuoteListResponse>(endpoint);
  }

  async getQuoteById(id: string): Promise<QuoteDetailsResponse> {
    return await apiService.get<QuoteDetailsResponse>(`/api/organization/commercial/quotes/${id}`);
  }

  async createQuote(data: CreateQuoteData): Promise<ApiResponse<{ quote: Quote }>> {
    return await apiService.post<ApiResponse<{ quote: Quote }>>('/api/organization/commercial/quotes', data);
  }

  async updateQuote(id: string, data: UpdateQuoteData): Promise<ApiResponse<{ quote: Quote }>> {
    return await apiService.put<ApiResponse<{ quote: Quote }>>(`/api/organization/commercial/quotes/${id}`, data);
  }

  async deleteQuote(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/api/organization/commercial/quotes/${id}`);
  }

  async convertQuoteToInvoice(quoteId: string): Promise<InvoiceDetailsResponse> {
    return await apiService.post<InvoiceDetailsResponse>(`/api/organization/commercial/quotes/${quoteId}/convert-to-invoice`);
  }

  async getQuoteStatistics(): Promise<ApiResponse<QuoteStatistics>> {
    return await apiService.get<ApiResponse<QuoteStatistics>>('/api/organization/commercial/quotes/statistics');
  }

  async generateQuotePdf(id: string): Promise<Blob> {
    return await apiService.get<Blob>(`/api/organization/commercial/quotes/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  async sendQuoteEmail(id: string, emailData: {
    email: string;
    cc?: string[];
    bcc?: string[];
    subject?: string;
    message?: string;
  }): Promise<ApiResponse<null>> {
    return await apiService.post<ApiResponse<null>>(`/api/organization/commercial/quotes/${id}/send-email`, emailData);
  }

  // ============ ARTICLES ============
  async getArticles(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    is_active?: boolean;
  }): Promise<ArticleListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.is_active !== undefined) queryParams.append('is_active', params.is_active.toString());

    const endpoint = '/api/organization/commercial/articles' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return await apiService.get<ArticleListResponse>(endpoint);
  }

  async getArticleById(id: string): Promise<ArticleDetailsResponse> {
    return await apiService.get<ArticleDetailsResponse>(`/api/organization/commercial/articles/${id}`);
  }

  async createArticle(data: CreateArticleData): Promise<ApiResponse<{ article: Article }>> {
    return await apiService.post<ApiResponse<{ article: Article }>>('/api/organization/commercial/articles', data);
  }

  async updateArticle(id: string, data: UpdateArticleData): Promise<ApiResponse<{ article: Article }>> {
    return await apiService.put<ApiResponse<{ article: Article }>>(`/api/organization/commercial/articles/${id}`, data);
  }

  async deleteArticle(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/api/organization/commercial/articles/${id}`);
  }

  // ============ CHARGES/EXPENSES ============
  async getCharges(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    status?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ChargeListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);

    const endpoint = '/api/organization/commercial/charges' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return await apiService.get<ChargeListResponse>(endpoint);
  }

  async getChargeById(id: string): Promise<ChargeDetailsResponse> {
    return await apiService.get<ChargeDetailsResponse>(`/api/organization/commercial/charges/${id}`);
  }

  async createCharge(data: CreateChargeData): Promise<ApiResponse<{ charge: Charge }>> {
    return await apiService.post<ApiResponse<{ charge: Charge }>>('/api/organization/commercial/charges', data);
  }

  async updateCharge(id: string, data: UpdateChargeData): Promise<ApiResponse<{ charge: Charge }>> {
    return await apiService.put<ApiResponse<{ charge: Charge }>>(`/api/organization/commercial/charges/${id}`, data);
  }

  async deleteCharge(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/api/organization/commercial/charges/${id}`);
  }

  async getChargeStatistics(): Promise<ApiResponse<ChargeStatistics>> {
    return await apiService.get<ApiResponse<ChargeStatistics>>('/api/organization/commercial/charges/statistics');
  }

  async getExpensesDashboard(params?: {
    date_from?: string;
    date_to?: string;
    category?: string;
    role?: string;
    contract_type?: string;
  }): Promise<ExpensesDashboardResponse> {
    const queryParams = new URLSearchParams();
    if (params?.date_from) queryParams.append('date_from', params.date_from);
    if (params?.date_to) queryParams.append('date_to', params.date_to);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.role) queryParams.append('role', params.role);
    if (params?.contract_type) queryParams.append('contract_type', params.contract_type);

    const endpoint = '/api/organization/expenses/dashboard' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return await apiService.get<ExpensesDashboardResponse>(endpoint);
  }

  async generateChargePdf(id: string): Promise<Blob> {
    return await apiService.get<Blob>(`/api/organization/commercial/charges/${id}/pdf`, {
      responseType: 'blob',
    });
  }

  // ============ OCR IMPORT ============
  async importInvoiceOCR(formData: FormData): Promise<ApiResponse<any>> {
    // Note: Ne PAS définir Content-Type manuellement pour FormData
    // Le navigateur doit le définir automatiquement avec la boundary correcte
    return await apiService.post<ApiResponse<any>>(
      '/api/organization/commercial/invoices/import-ocr',
      formData
    );
  }

  async importQuoteOCR(formData: FormData): Promise<ApiResponse<any>> {
    // Note: Ne PAS définir Content-Type manuellement pour FormData
    // Le navigateur doit le définir automatiquement avec la boundary correcte
    return await apiService.post<ApiResponse<any>>(
      '/api/organization/commercial/quotes/import-ocr',
      formData
    );
  }

  async matchOrCreateClient(clientData: any): Promise<ApiResponse<any>> {
    return await apiService.post<ApiResponse<any>>(
      '/api/organization/commercial/clients/match-or-create',
      clientData
    );
  }

  async matchOrCreateArticles(articlesData: any): Promise<ApiResponse<any>> {
    return await apiService.post<ApiResponse<any>>(
      '/api/organization/commercial/articles/match-or-create',
      articlesData
    );
  }

  // ============ CLIENTS ============
  async getClients(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    type?: string;
  }): Promise<ApiResponse<any>> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.per_page) queryParams.append('per_page', params.per_page.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.type) queryParams.append('type', params.type);

    const endpoint = '/api/organization/commercial/clients' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
    return await apiService.get<ApiResponse<any>>(endpoint);
  }

  async getClientById(id: string): Promise<ApiResponse<any>> {
    return await apiService.get<ApiResponse<any>>(`/api/organization/commercial/clients/${id}`);
  }

  async createClient(data: any): Promise<ApiResponse<any>> {
    return await apiService.post<ApiResponse<any>>('/api/organization/commercial/clients', data);
  }

  async updateClient(id: string, data: any): Promise<ApiResponse<any>> {
    return await apiService.put<ApiResponse<any>>(`/api/organization/commercial/clients/${id}`, data);
  }

  async deleteClient(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/api/organization/commercial/clients/${id}`);
  }

  // ============ COMPANY DETAILS ============
  async getCompanyDetails(): Promise<ApiResponse<any>> {
    return await apiService.get<ApiResponse<any>>('/api/organization/commercial/company-details');
  }

  async updateCompanyDetails(data: any): Promise<ApiResponse<any>> {
    return await apiService.put<ApiResponse<any>>('/api/organization/commercial/company-details', data);
  }

  async uploadCompanyLogo(formData: FormData): Promise<ApiResponse<any>> {
    return await apiService.post<ApiResponse<any>>('/api/organization/commercial/company-details/logo', formData);
  }

  // ============ BANK ACCOUNTS ============
  async getBankAccounts(): Promise<ApiResponse<any>> {
    return await apiService.get<ApiResponse<any>>('/api/organization/commercial/bank-accounts');
  }

  async createBankAccount(data: any): Promise<ApiResponse<any>> {
    return await apiService.post<ApiResponse<any>>('/api/organization/commercial/bank-accounts', data);
  }

  async updateBankAccount(id: string, data: any): Promise<ApiResponse<any>> {
    return await apiService.put<ApiResponse<any>>(`/api/organization/commercial/bank-accounts/${id}`, data);
  }

  async deleteBankAccount(id: string): Promise<ApiResponse<null>> {
    return await apiService.delete<ApiResponse<null>>(`/api/organization/commercial/bank-accounts/${id}`);
  }

  // ============ PAYMENT CONDITIONS ============
  async getPaymentConditionTemplates(): Promise<ApiResponse<any>> {
    return await apiService.get<ApiResponse<any>>('/api/organization/commercial/payment-conditions/templates');
  }

  async createPaymentConditionTemplate(data: any): Promise<ApiResponse<any>> {
    return await apiService.post<ApiResponse<any>>('/api/organization/commercial/payment-conditions/templates', data);
  }

  async getPaymentSchedule(invoiceId: string): Promise<ApiResponse<any>> {
    return await apiService.get<ApiResponse<any>>(`/api/organization/commercial/invoices/${invoiceId}/payment-schedule`);
  }

  async createPaymentSchedule(invoiceId: string, data: any): Promise<ApiResponse<any>> {
    return await apiService.post<ApiResponse<any>>(`/api/organization/commercial/invoices/${invoiceId}/payment-schedule`, data);
  }

  async updatePaymentScheduleStatus(invoiceId: string, scheduleId: string, status: string): Promise<ApiResponse<any>> {
    return await apiService.patch<ApiResponse<any>>(`/api/organization/commercial/invoices/${invoiceId}/payment-schedule/${scheduleId}`, { status });
  }

  // ============ QUOTE PAYMENT SCHEDULES ============
  async getQuotePaymentSchedule(quoteId: string): Promise<ApiResponse<any>> {
    return await apiService.get<ApiResponse<any>>(`/api/organization/commercial/quotes/${quoteId}/payment-schedule`);
  }

  async createQuotePaymentSchedule(quoteId: string, data: any): Promise<ApiResponse<any>> {
    return await apiService.post<ApiResponse<any>>(`/api/organization/commercial/quotes/${quoteId}/payment-schedule`, data);
  }
}

export const commercialService = new CommercialService();

