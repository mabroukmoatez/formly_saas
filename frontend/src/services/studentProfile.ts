import apiClient from './api';

const API_BASE = '/api/student';

export interface Country {
  id: number;
  name: string;
  code?: string;
}

export interface State {
  id: number;
  name: string;
  country_id: number;
}

export interface City {
  id: number;
  name: string;
  state_id: number;
}

export interface StudentProfile {
  id: number;
  uuid: string;
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
  mobile_number?: string;
  address?: string;
  postal_code?: string;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  about_me?: string;
  gender?: string;
  image?: string;
  avatar_url?: string;
  status: number;
  organization_id?: number;
  date_of_birth?: string;
  nationality?: string;
  student_number?: string;
  country?: Country;
  state?: State;
  city?: City;
}

export interface UpdateProfileData {
  first_name: string;
  last_name: string;
  phone_number?: string;
  mobile_number?: string;
  address?: string;
  postal_code?: string;
  country_id?: number;
  state_id?: number;
  city_id?: number;
  about_me?: string;
  gender?: string;
  image?: File | null;
  banner_image?: File | null;
}

export interface ChangePasswordData {
  email: string;
  password: string;
  new_password: string;
  new_password_confirmation: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const studentProfileService = {
  /**
   * Get student profile
   */
  getProfile: async (): Promise<ApiResponse<StudentProfile>> => {
    const response = await apiClient.get(`${API_BASE}/profile`);
    return response;
  },

  /**
   * Update student profile
   */
  updateProfile: async (uuid: string, data: UpdateProfileData): Promise<ApiResponse<any>> => {
    const formData = new FormData();

    formData.append('first_name', data.first_name);
    formData.append('last_name', data.last_name);

    if (data.mobile_number) formData.append('mobile_number', data.mobile_number);
    if (data.phone_number) formData.append('phone_number', data.phone_number);
    if (data.address) formData.append('address', data.address);
    if (data.postal_code) formData.append('postal_code', data.postal_code);
    if (data.about_me) formData.append('about_me', data.about_me);
    if (data.gender) formData.append('gender', data.gender);
    if (data.country_id) formData.append('country_id', data.country_id.toString());
    if (data.state_id) formData.append('state_id', data.state_id.toString());
    if (data.city_id) formData.append('city_id', data.city_id.toString());
    if (data.image) formData.append('image', data.image);
    if (data.banner_image) formData.append('banner_image', data.banner_image);

    const response = await apiClient.post(`${API_BASE}/save-profile/${uuid}`, formData);
    return response;
  },

  /**
   * Change password
   */
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse<any>> => {
    const response = await apiClient.post(`${API_BASE}/change-password`, data);
    return response;
  },

  /**
   * Get countries list
   */
  getCountries: async (): Promise<ApiResponse<{ countries: Country[] }>> => {
    const response = await apiClient.get('/api/get-country');
    return response;
  },

  /**
   * Get states by country
   */
  getStatesByCountry: async (countryId: number): Promise<ApiResponse<{ states: State[] }>> => {
    const response = await apiClient.get(`/api/get-state/${countryId}`);
    return response;
  },

  /**
   * Get cities by state
   */
  getCitiesByState: async (stateId: number): Promise<ApiResponse<{ cities: City[] }>> => {
    const response = await apiClient.get(`/api/get-city/${stateId}`);
    return response;
  },
};
