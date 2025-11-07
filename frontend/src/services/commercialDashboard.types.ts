/**
 * Commercial Dashboard API Types
 * Based on the backend documentation
 */

export interface DashboardKPIs {
  revenue: {
    current: number;
    previous: number;
    comparison: number;
  };
  quotes: {
    current: number;
    previous: number;
    comparison: number;
  };
  invoices: {
    current: number;
    previous: number;
    comparison: number;
  };
  overdue: {
    current: number;
  };
  expenses: {
    current: number;
    previous: number;
    comparison: number;
  };
}

export interface ChartDataPoint {
  month: string;
  value: number;
}

export interface Charts {
  revenue: ChartDataPoint[];
}

export interface DashboardData {
  kpis: DashboardKPIs;
  charts: Charts;
}

export interface DashboardResponse {
  success: boolean;
  data: DashboardData;
  message?: string;
}

