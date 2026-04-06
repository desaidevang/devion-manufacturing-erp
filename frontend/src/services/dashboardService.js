// src/services/dashboardService.js
import axiosInstance from '../api/axios';

class DashboardService {
  // Get comprehensive dashboard data
  getDashboard() {
    return axiosInstance.get('/dashboardStat/quick-overview');
  }

  // Get batch-specific dashboard
  getBatchDashboard() {
    return axiosInstance.get('/batches/dashboard');
  }

  // Get employee performance
  getEmployeePerformance() {
    return axiosInstance.get('/dashboardStat/employee-performance');
  }

  // Get production analytics
  getProductionAnalytics(period = 'daily') {
    return axiosInstance.get(`/dashboardStat/production-analytics?period=${period}`);
  }

  // Get system health
  getSystemHealth() {
    return axiosInstance.get('/dashboardStat/system-health');
  }

  // Get critical alerts
  getCriticalAlerts() {
    return axiosInstance.get('/dashboardStat/critical-alerts');
  }

  // Get real-time counters (lightweight for auto-refresh)
  getRealtimeCounters() {
    return axiosInstance.get('/dashboardStat/realtime-counters');
  }

  // Get user statistics
  getUserStats() {
    return axiosInstance.get('/dashboardStat/quick-overview').then(response => {
      return response.data.userStats;
    });
  }

  // Get warehouse statistics
  getWarehouseStats() {
    return axiosInstance.get('/dashboardStat/quick-overview').then(response => {
      return response.data.warehouseStats;
    });
  }

  // Get supplier statistics
  getSupplierStats() {
    return axiosInstance.get('/dashboardStat/quick-overview').then(response => {
      return response.data.supplierStats;
    });
  }

  // Get GRN statistics
  getGRNStats() {
    return axiosInstance.get('/dashboardStat/quick-overview').then(response => {
      return response.data.grnStats;
    });
  }
}

export default new DashboardService();