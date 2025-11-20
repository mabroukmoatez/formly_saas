import { apiService } from './api';

export interface OrganizationRegistrationData {
  // Required
  organization_name: string;
  email: string;
  subdomain: string;
  
  // Required - Super Admin User Info
  first_name: string;
  last_name: string;
  password: string;
  password_confirmation: string;
  
  // Optional - Basic Info
  company_name?: string;
  legal_name?: string;
  phone?: string;
  phone_fixed?: string;
  phone_mobile?: string;
  website?: string;
  
  // Optional - Address
  address?: string;
  address_complement?: string;
  city?: string;
  zip_code?: string;
  country?: string;
  
  // Optional - Legal
  siret?: string;
  siren?: string;
  vat_number?: string;
  tva_number?: string;
  naf_code?: string;
  ape_code?: string;
  rcs?: string;
  legal_form?: string;
  capital?: string;
  
  // Optional - Branding
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  organization_tagline?: string;
  organization_description?: string;
  footer_text?: string;
  
  // Optional - Files
  logo?: File;
  favicon?: File;
  
  // Optional - Plan
  plan_id?: number;
}

export interface SubdomainCheckResponse {
  success: boolean;
  data?: {
    subdomain: string;
    available: boolean;
    message: string;
    preview_url: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface OrganizationRegistrationResponse {
  success: boolean;
  message: string;
  data?: {
    id: number;
    organization_name: string;
    slug: string;
    subdomain: string;
    subdomain_url: string;
    logo_url?: string;
    favicon_url?: string;
    super_admin_status: string;
    plan?: {
      id: number;
      name: string;
    };
    created_at: string;
  };
  error?: {
    code: string;
    message: string;
    data?: Record<string, string[]>;
  };
}

class OrganizationRegistrationService {
  /**
   * Check if subdomain is available
   */
  async checkSubdomain(subdomain: string): Promise<SubdomainCheckResponse> {
    try {
      // Use public endpoint for subdomain check (should be accessible without auth)
      // According to documentation: /api/superadmin/organizations/check-subdomain/{subdomain}
      // But for public registration, we might need a public endpoint
      // Try public endpoint first, fallback to superadmin if needed
      let response = await fetch(`http://localhost:8000/api/organizations/check-subdomain/${subdomain}`);
      
      // If 404, try the superadmin endpoint (might be public for this specific check)
      // Don't read the body if it's 404, just try the next endpoint
      if (response.status === 404) {
        response = await fetch(`http://localhost:8000/api/superadmin/organizations/check-subdomain/${subdomain}`);
      }
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Read response text once (can only be read once)
      const responseText = await response.text().catch(() => '');
      
      if (!response.ok) {
        let errorData: any = { message: `HTTP error! status: ${response.status}` };
        
        if (isJson && responseText) {
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            // If JSON parsing fails, use text as message
            errorData = { message: responseText || 'Failed to check subdomain' };
          }
        } else {
          // If not JSON, use text (might be HTML error page)
          errorData = { message: `Server returned non-JSON response: ${response.status}` };
        }
        
        return {
          success: false,
          error: {
            code: 'CHECK_ERROR',
            message: errorData.message || errorData.error?.message || 'Failed to check subdomain availability',
          },
        };
      }
      
      // Parse JSON response
      if (isJson && responseText) {
        try {
          const data = JSON.parse(responseText);
          return data;
        } catch (e) {
          return {
            success: false,
            error: {
              code: 'PARSE_ERROR',
              message: 'Failed to parse server response',
            },
          };
        }
      } else {
        // If not JSON, return error
        return {
          success: false,
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Server returned non-JSON response',
          },
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'CHECK_ERROR',
          message: error.message || 'Failed to check subdomain availability',
        },
      };
    }
  }

  /**
   * Register a new organization
   */
  async registerOrganization(data: OrganizationRegistrationData): Promise<OrganizationRegistrationResponse> {
    try {
      const formData = new FormData();

      // Required fields
      formData.append('organization_name', data.organization_name);
      formData.append('email', data.email);
      formData.append('subdomain', data.subdomain);
      
      // Required - Super Admin User Info
      formData.append('first_name', data.first_name);
      formData.append('last_name', data.last_name);
      formData.append('password', data.password);
      formData.append('password_confirmation', data.password_confirmation);

      // Optional basic info
      if (data.company_name) formData.append('company_name', data.company_name);
      if (data.legal_name) formData.append('legal_name', data.legal_name);
      if (data.phone) formData.append('phone', data.phone);
      if (data.phone_fixed) formData.append('phone_fixed', data.phone_fixed);
      if (data.phone_mobile) formData.append('phone_mobile', data.phone_mobile);
      if (data.website) formData.append('website', data.website);

      // Optional address
      if (data.address) formData.append('address', data.address);
      if (data.address_complement) formData.append('address_complement', data.address_complement);
      if (data.city) formData.append('city', data.city);
      if (data.zip_code) formData.append('zip_code', data.zip_code);
      if (data.country) formData.append('country', data.country);

      // Optional legal
      if (data.siret) formData.append('siret', data.siret);
      if (data.siren) formData.append('siren', data.siren);
      if (data.vat_number) formData.append('vat_number', data.vat_number);
      if (data.tva_number) formData.append('tva_number', data.tva_number);
      if (data.naf_code) formData.append('naf_code', data.naf_code);
      if (data.ape_code) formData.append('ape_code', data.ape_code);
      if (data.rcs) formData.append('rcs', data.rcs);
      if (data.legal_form) formData.append('legal_form', data.legal_form);
      if (data.capital) formData.append('capital', data.capital);

      // Optional branding
      if (data.primary_color) formData.append('primary_color', data.primary_color);
      if (data.secondary_color) formData.append('secondary_color', data.secondary_color);
      if (data.accent_color) formData.append('accent_color', data.accent_color);
      if (data.organization_tagline) formData.append('organization_tagline', data.organization_tagline);
      if (data.organization_description) formData.append('organization_description', data.organization_description);
      if (data.footer_text) formData.append('footer_text', data.footer_text);

      // Optional files
      if (data.logo) formData.append('logo', data.logo);
      if (data.favicon) formData.append('favicon', data.favicon);

      // Optional plan
      if (data.plan_id) formData.append('plan_id', data.plan_id.toString());

      // Use public endpoint for registration
      // According to documentation: /api/superadmin/organizations/create-complete
      // But for public registration, we might need a public endpoint
      // Try public endpoint first, fallback to superadmin if needed
      let response = await fetch('http://localhost:8000/api/organizations/register', {
        method: 'POST',
        body: formData,
      });
      
      // If 404 or 401, try the superadmin endpoint (might be public for registration)
      // Don't read the body if it's 404/401, just try the next endpoint
      // Note: We need to clone formData for the second request if needed
      if (response.status === 404 || response.status === 401) {
        // Create a new FormData for the second request
        const newFormData = new FormData();
        for (const [key, value] of formData.entries()) {
          newFormData.append(key, value);
        }
        
        response = await fetch('http://localhost:8000/api/superadmin/organizations/create-complete', {
          method: 'POST',
          body: newFormData,
        });
      }
      
      // Check if response is JSON before parsing
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      // Read response text once (can only be read once)
      const responseText = await response.text().catch(() => '');
      
      if (!response.ok) {
        let errorData: any = { message: `HTTP error! status: ${response.status}` };
        
        if (isJson && responseText) {
          try {
            errorData = JSON.parse(responseText);
          } catch (e) {
            // If JSON parsing fails, use text as message
            errorData = { message: responseText || 'Failed to register organization' };
          }
        } else {
          // If not JSON, use text (might be HTML error page)
          errorData = { 
            message: `Server returned non-JSON response: ${response.status}`,
            details: responseText.substring(0, 200) // First 200 chars for debugging
          };
        }
        
        return {
          success: false,
          message: errorData.message || errorData.error?.message || 'Failed to register organization',
          error: {
            code: 'REGISTRATION_ERROR',
            message: errorData.message || errorData.error?.message || 'Failed to register organization',
            data: errorData.data || errorData.errors,
          },
        };
      }
      
      // Parse JSON response
      if (isJson && responseText) {
        try {
          const responseData = JSON.parse(responseText);
          
          // Debug: log the parsed response
          console.log('Parsed registration response:', responseData);
          
          // Ensure the response has the expected structure
          if (responseData.success && responseData.data) {
            return responseData;
          } else if (responseData.success && !responseData.data) {
            // If success but no data, try to construct it from the response
            console.warn('Response success but no data field, checking response structure:', responseData);
            return responseData;
          }
          
          return responseData;
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          return {
            success: false,
            message: 'Failed to parse server response',
            error: {
              code: 'PARSE_ERROR',
              message: 'Server returned invalid JSON',
            },
          };
        }
      } else {
        // If not JSON, return error
        return {
          success: false,
          message: 'Server returned non-JSON response',
          error: {
            code: 'INVALID_RESPONSE',
            message: 'Server did not return JSON',
          },
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: error.message || 'Failed to register organization',
        error: {
          code: 'REGISTRATION_ERROR',
          message: error.message || 'Failed to register organization',
          data: error.data,
        },
      };
    }
  }
}

export const organizationRegistrationService = new OrganizationRegistrationService();

