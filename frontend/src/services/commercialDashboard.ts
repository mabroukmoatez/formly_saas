import { apiService } from './api';
import { DashboardResponse } from './commercialDashboard.types';

/**
 * Service for commercial dashboard operations
 */
class CommercialDashboardService {
  /**
   * Get dashboard statistics and chart data
   */
  async getDashboard(): Promise<DashboardResponse> {
    try {
      const response = await apiService.get<DashboardResponse>(
        '/api/organization/commercial/dashboard'
      );
      return response;
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }
}

export const commercialDashboardService = new CommercialDashboardService();

