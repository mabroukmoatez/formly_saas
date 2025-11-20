/**
 * Commercial Dashboard API Types
 * Based on the backend documentation
 */

export interface DashboardKPIs {
  revenue: {
    current: number | string;
    previous: number | string;
    comparison: number;
  };
  quotes: {
    current: number | string;
    previous: number | string;
    comparison: number;
  };
  invoices: {
    current: number | string;
    previous: number | string;
    comparison: number;
  };
  overdue: {
    current: number | string;
  };
  expenses: {
    current: number | string;
    previous: number | string;
    comparison: number;
  };
}

export interface ChartDataPoint {
  month: string;
  value: number | string;
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

