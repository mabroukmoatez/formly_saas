import { apiService } from './api';
import { DashboardResponse } from './commercialDashboard.types';

/**
 * Service for commercial dashboard operations
 */
class CommercialDashboardService {
  /**
   * Get dashboard statistics and chart data
   * @param year Optional year filter for the dashboard data
   */
  async getDashboard(year?: number): Promise<DashboardResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (year) {
        queryParams.append('year', year.toString());
      }
      const endpoint = '/api/organization/commercial/dashboard' + (queryParams.toString() ? `?${queryParams.toString()}` : '');
      const response = await apiService.get<DashboardResponse>(endpoint);
      return response;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

export const commercialDashboardService = new CommercialDashboardService();

