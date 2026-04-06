import React, { useState, useEffect } from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, FiPackage, FiCheckCircle, 
  FiBarChart2, FiDollarSign, FiTrendingUp,
  FiLayers, FiAlertCircle, FiClock, FiActivity,
  FiAlertTriangle, FiCheck, FiRefreshCw,
  FiEye, FiEdit2, FiPlus, FiGrid,
  FiServer, FiDatabase, FiCpu, FiShield,
  FiShoppingCart, FiCalendar, FiTrendingDown,
  FiChevronRight, FiUserCheck, FiBox, FiTruck,
  FiSettings, FiFileText, FiMessageSquare
} from 'react-icons/fi';
import { LoadingSpinner } from '../components/LoadingSpinner';
import DashboardService from '../services/dashboardService';
import BatchService from '../services/batchService';
import UserService from '../services/userService';
import { toast } from 'react-hot-toast';

export const Dashboard = () => {
  useProtectedRoute();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [quickOverview, setQuickOverview] = useState(null);
  const [productionAnalytics, setProductionAnalytics] = useState(null);
  const [systemHealth, setSystemHealth] = useState(null);
  const [criticalAlerts, setCriticalAlerts] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [recentBatches, setRecentBatches] = useState([]);
  const [employeePerformance, setEmployeePerformance] = useState(null);
  
  // Time-based updates
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch all dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch comprehensive dashboard data
      const [overviewRes, analyticsRes, healthRes, alertsRes, batchesRes] = await Promise.all([
        DashboardService.getDashboard(),
        DashboardService.getProductionAnalytics(),
        DashboardService.getSystemHealth(),
        DashboardService.getCriticalAlerts(),
        BatchService.getAllBatches()
      ]);
      
      setQuickOverview(overviewRes.data);
      setProductionAnalytics(analyticsRes.data);
      setSystemHealth(healthRes.data);
      setCriticalAlerts(alertsRes.data.alerts || []);
      
      // Get recent batches (last 5)
      const recentBatchesList = batchesRes.data
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      setRecentBatches(recentBatchesList);
      
      // Fetch employee performance if user has permission
      if (user.role === 'ADMIN' || user.role === 'SUPERVISOR') {
        try {
          const empRes = await DashboardService.getEmployeePerformance();
          setEmployeePerformance(empRes.data);
        } catch (error) {
          console.error('Error fetching employee performance:', error);
        }
      }
      
      // Generate recent activities from data
      generateRecentActivities();
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Generate recent activities from system data
  const generateRecentActivities = () => {
    const activities = [];
    
    // Add recent batches as activities
    recentBatches.forEach(batch => {
      activities.push({
        id: `batch-${batch.id}`,
        user: batch.createdBy || 'System',
        action: `Created batch ${batch.batchCode}`,
        time: formatTimeAgo(new Date(batch.createdAt)),
        role: 'Production',
        type: 'batch',
        icon: FiLayers
      });
    });
    
    // Add critical alerts as activities
    if (criticalAlerts.length > 0) {
      criticalAlerts.slice(0, 2).forEach(alert => {
        activities.push({
          id: `alert-${alert.type}`,
          user: 'System Alert',
          action: alert.message,
          time: 'Just now',
          role: 'System',
          type: 'alert',
          icon: FiAlertCircle,
          severity: alert.severity
        });
      });
    }
    
    setRecentActivities(activities.slice(0, 10));
  };

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'ONLINE':
      case 'HEALTHY':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'ERROR':
      case 'OFFLINE':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get alert severity color
  const getAlertSeverityColor = (severity) => {
    switch (severity) {
      case 'HIGH': return 'bg-red-50 border-red-200 text-red-800';
      case 'MEDIUM': return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'LOW': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  // Auto-refresh
  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      // Refresh counters every 30 seconds
      DashboardService.getRealtimeCounters().then(res => {
        if (quickOverview) {
          setQuickOverview(prev => ({
            ...prev,
            ...res.data
          }));
        }
      }).catch(console.error);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (loading && !quickOverview) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with Devion Technologies ERP today.
          </p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <FiClock className="mr-2" />
            Last updated: {currentTime.toLocaleTimeString()}
            {autoRefresh && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                Auto-refresh ON
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`btn-secondary flex items-center ${autoRefresh ? 'bg-green-50 text-green-700' : ''}`}
          >
            <FiRefreshCw className={`mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto ON' : 'Auto OFF'}
          </button>
          <button
            onClick={fetchDashboardData}
            className="btn-secondary flex items-center"
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/report/generate')}
            className="btn-primary flex items-center"
          >
            <FiFileText className="mr-2" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        {/* Total Users */}
        <div 
          className="card p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/users')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {quickOverview?.userStats?.totalUsers || 0}
              </p>
              <div className="flex items-center text-xs text-blue-600 mt-2">
                <FiUserCheck className="mr-1" />
                {quickOverview?.userStats?.activeUsers || 0} active
              </div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Total Batches */}
        <div 
          className="card p-6 bg-gradient-to-br from-indigo-50 to-white border-indigo-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/batch/manage')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Batches</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {quickOverview?.batchStats?.totalBatches || 0}
              </p>
              <div className="flex items-center text-xs text-indigo-600 mt-2">
                <FiActivity className="mr-1" />
                {quickOverview?.batchStats?.inProgressBatches || 0} in progress
              </div>
            </div>
            <div className="p-3 bg-indigo-100 rounded-xl">
              <FiLayers className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* Warehouse Items */}
        <div 
          className="card p-6 bg-gradient-to-br from-green-50 to-white border-green-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/warehouse')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Warehouse Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {quickOverview?.warehouseStats?.totalStockItems || 0}
              </p>
              <div className="text-xs text-green-600 mt-2">
                <span className={`px-1 ${quickOverview?.warehouseStats?.lowStockItems > 0 ? 'text-red-600' : ''}`}>
                  {quickOverview?.warehouseStats?.lowStockItems || 0} low stock
                </span>
              </div>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <FiPackage className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Suppliers */}
        <div 
          className="card p-6 bg-gradient-to-br from-purple-50 to-white border-purple-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/suppliers')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Suppliers</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {quickOverview?.supplierStats?.totalSuppliers || 0}
              </p>
              <div className="text-xs text-purple-600 mt-2">
                {quickOverview?.supplierStats?.approvedSuppliers || 0} approved
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <FiTruck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="card p-6 bg-gradient-to-br from-emerald-50 to-white border-emerald-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {productionAnalytics?.completionRate ? 
                  `${Math.round(productionAnalytics.completionRate)}%` : '0%'
                }
              </p>
              <div className="text-xs text-emerald-600 mt-2">
                {productionAnalytics?.totalCompleted || 0} completed
              </div>
            </div>
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FiCheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* System Health */}
        <div 
          className="card p-6 bg-gradient-to-br from-amber-50 to-white border-amber-100 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate('/settings')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">System Health</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {systemHealth?.services?.every(s => s.status === 'ACTIVE') ? '100%' : '90%'}
              </p>
              <div className="text-xs text-amber-600 mt-2">
                All systems operational
              </div>
            </div>
            <div className="p-3 bg-amber-100 rounded-xl">
              <FiServer className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Recent Activity & Production Analytics */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Activity */}
          <div className="card">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiActivity className="mr-2" />
                Recent Activity
              </h2>
              <button
                onClick={() => navigate('/activities')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                View All
                <FiChevronRight className="ml-1" />
              </button>
            </div>
            
            <div className="p-6">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8">
                  <FiActivity className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => {
                    const ActivityIcon = activity.icon || FiActivity;
                    
                    return (
                      <div key={activity.id} className="flex items-start p-4 hover:bg-gray-50 rounded-lg transition-colors group">
                        <div className="flex-shrink-0 mt-1">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            activity.type === 'alert' && activity.severity === 'HIGH' ? 'bg-red-100' :
                            activity.type === 'alert' ? 'bg-yellow-100' :
                            activity.type === 'batch' ? 'bg-blue-100' :
                            'bg-gray-100'
                          }`}>
                            <ActivityIcon className={`w-5 h-5 ${
                              activity.type === 'alert' && activity.severity === 'HIGH' ? 'text-red-600' :
                              activity.type === 'alert' ? 'text-yellow-600' :
                              activity.type === 'batch' ? 'text-blue-600' :
                              'text-gray-600'
                            }`} />
                          </div>
                        </div>
                        
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">{activity.user}</h4>
                              <p className="text-sm text-gray-600 mt-1">{activity.action}</p>
                            </div>
                            <span className="text-xs text-gray-500">{activity.time}</span>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded ${
                              activity.type === 'alert' ? getAlertSeverityColor(activity.severity) :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {activity.role}
                            </span>
                            {activity.type === 'batch' && (
                              <button
                                onClick={() => navigate('/batch/manage')}
                                className="text-xs text-blue-600 hover:text-blue-800 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                View Details →
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Production Analytics */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiTrendingUp className="mr-2" />
                Production Analytics
              </h2>
              <p className="text-sm text-gray-600 mt-1">Key performance indicators</p>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Daily Average</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {productionAnalytics?.dailyAverage ? 
                      `${Math.round(productionAnalytics.dailyAverage * 100) / 100}/day` : '0/day'
                    }
                  </p>
                  <div className="flex items-center mt-2">
                    <FiTrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">Last 30 days</span>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">On-time Delivery</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {productionAnalytics?.onTimeDeliveryRate ? 
                      `${Math.round(productionAnalytics.onTimeDeliveryRate)}%` : '0%'
                    }
                  </p>
                  <div className="flex items-center mt-2">
                    <FiCheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-xs text-green-600">Within 48 hours</span>
                  </div>
                </div>
              </div>
              
              {/* Daily Production Chart */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 mb-4">Daily Production (Last 7 Days)</p>
                <div className="flex items-end h-32 space-x-1">
                  {productionAnalytics?.dailyProduction && Object.entries(productionAnalytics.dailyProduction)
                    .slice(-7)
                    .map(([date, count], index) => {
                      const maxCount = Math.max(...Object.values(productionAnalytics.dailyProduction || {}));
                      const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                      
                      return (
                        <div key={date} className="flex-1 flex flex-col items-center">
                          <div 
                            className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${
                              count > 0 ? 'bg-blue-500' : 'bg-gray-200'
                            }`}
                            style={{ height: `${Math.max(10, height)}%` }}
                          ></div>
                          <span className="text-xs text-gray-500 mt-2">
                            {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                          </span>
                          <span className="text-xs font-medium text-gray-900">{count}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Critical Alerts & Quick Stats */}
        <div className="space-y-8">
          {/* Critical Alerts */}
          <div className="card border-red-200">
            <div className="p-6 border-b border-red-200 bg-red-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiAlertTriangle className="mr-2 text-red-600" />
                Critical Alerts ({criticalAlerts.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">Requires immediate attention</p>
            </div>
            
            <div className="p-6">
              {criticalAlerts.length === 0 ? (
                <div className="text-center py-4">
                  <FiCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">No critical alerts</p>
                  <p className="text-sm text-gray-500">All systems are normal</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {criticalAlerts.slice(0, 5).map((alert, index) => (
                    <div 
                      key={index}
                      className={`p-4 border rounded-lg ${getAlertSeverityColor(alert.severity)}`}
                    >
                      <div className="flex items-start">
                        <FiAlertCircle className={`w-5 h-5 mr-3 mt-0.5 ${
                          alert.severity === 'HIGH' ? 'text-red-600' :
                          alert.severity === 'MEDIUM' ? 'text-yellow-600' :
                          'text-blue-600'
                        }`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{alert.type.replace('_', ' ')}</span>
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              alert.severity === 'HIGH' ? 'bg-red-200 text-red-800' :
                              alert.severity === 'MEDIUM' ? 'bg-yellow-200 text-yellow-800' :
                              'bg-blue-200 text-blue-800'
                            }`}>
                              {alert.severity}
                            </span>
                          </div>
                          <p className="text-sm mt-2">{alert.message}</p>
                          {alert.actionRequired && (
                            <button className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-800">
                              Take Action →
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {criticalAlerts.length > 5 && (
                    <button
                      onClick={() => navigate('/alerts')}
                      className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                    >
                      View All {criticalAlerts.length} Alerts
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiSettings className="mr-2" />
                Quick Actions
              </h2>
            </div>
            
            <div className="p-6 space-y-3">
              {(user.role === 'ADMIN' || user.role === 'PRODUCTION_MANAGER') && (
                <button
                  onClick={() => navigate('/batch/create')}
                  className="w-full text-left px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors duration-150 flex items-center"
                >
                  <FiPlus className="mr-3" />
                  Create New Batch
                </button>
              )}
              
              {user.role === 'ADMIN' && (
                <>
                  <button
                    onClick={() => navigate('/users')}
                    className="w-full text-left px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg transition-colors duration-150 flex items-center"
                  >
                    <FiUsers className="mr-3" />
                    Manage Users
                  </button>
                  <button
                    onClick={() => navigate('/settings')}
                    className="w-full text-left px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg transition-colors duration-150 flex items-center"
                  >
                    <FiSettings className="mr-3" />
                    System Settings
                  </button>
                </>
              )}
              
              {(user.role === 'ADMIN' || user.role === 'WAREHOUSE_MANAGER') && (
                <button
                  onClick={() => navigate('/warehouse')}
                  className="w-full text-left px-4 py-3 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition-colors duration-150 flex items-center"
                >
                  <FiPackage className="mr-3" />
                  Inventory Management
                </button>
              )}
              
              {(user.role === 'ADMIN' || user.role === 'INSPECTION_OFFICER') && (
                <button
                  onClick={() => navigate('/inspection/new')}
                  className="w-full text-left px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors duration-150 flex items-center"
                >
                  <FiCheckCircle className="mr-3" />
                  New Inspection
                </button>
              )}
              
              <button
                onClick={() => navigate('/report/generate')}
                className="w-full text-left px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors duration-150 flex items-center"
              >
                <FiFileText className="mr-3" />
                Generate Report
              </button>
            </div>
          </div>

          {/* System Status */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiServer className="mr-2" />
                System Status
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              {systemHealth?.services?.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {service.name === 'Database' && <FiDatabase className="w-4 h-4 text-gray-400 mr-2" />}
                    {service.name === 'API Services' && <FiCpu className="w-4 h-4 text-gray-400 mr-2" />}
                    {service.name === 'Batch Service' && <FiLayers className="w-4 h-4 text-gray-400 mr-2" />}
                    {service.name === 'User Service' && <FiUsers className="w-4 h-4 text-gray-400 mr-2" />}
                    <span className="text-sm text-gray-600">{service.name}</span>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                    service.status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {service.status}
                  </span>
                </div>
              ))}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Server Uptime</p>
                  <p className="text-lg font-bold text-gray-900 mt-1">99.8%</p>
                  <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  <p className="font-medium">Last Backup</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {systemHealth?.lastBackup ? 
                      new Date(systemHealth.lastBackup).toLocaleString() : 
                      'Today, 02:00 AM'
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Performance (Only for Admins/Supervisors) */}
      {(user.role === 'ADMIN' || user.role === 'SUPERVISOR') && employeePerformance && (
        <div className="card mt-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <FiTrendingUp className="mr-2" />
              Employee Performance
            </h2>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Average Efficiency</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {employeePerformance.metrics?.avgCompletionRate ? 
                    `${Math.round(employeePerformance.metrics.avgCompletionRate)}%` : '0%'
                  }
                </p>
                <div className="text-xs text-gray-500 mt-2">Across all employees</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Top Performers</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {employeePerformance.topPerformers?.length || 0}
                </p>
                <div className="text-xs text-gray-500 mt-2">90%+ efficiency</div>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">On-time Rate</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {employeePerformance.metrics?.onTimeRate ? 
                    `${Math.round(employeePerformance.metrics.onTimeRate)}%` : '100%'
                  }
                </p>
                <div className="text-xs text-gray-500 mt-2">No delays</div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {employeePerformance.employeeSummary?.slice(0, 5).map((emp) => {
                    const efficiency = emp.getEfficiency ? emp.getEfficiency() : 
                      (emp.totalAssigned > 0 ? (emp.completed / emp.totalAssigned) * 100 : 0);
                    
                    return (
                      <tr key={emp.employeeId} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <span className="text-blue-800 font-medium text-sm">
                                {emp.employeeName?.split(' ').map(n => n[0]).join('') || 'E'}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{emp.employeeName}</div>
                              <div className="text-xs text-gray-500">@{emp.username}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-gray-900">{emp.totalAssigned}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-green-700">{emp.completed}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className={`h-2 rounded-full ${
                                  efficiency >= 80 ? 'bg-green-500' :
                                  efficiency >= 60 ? 'bg-blue-500' :
                                  'bg-yellow-500'
                                }`}
                                style={{ width: `${Math.min(100, efficiency)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{Math.round(efficiency)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            emp.delayed > 0 ? 'bg-red-100 text-red-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {emp.delayed > 0 ? 'Delayed' : 'On Track'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {employeePerformance.employeeSummary?.length > 5 && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => navigate('/reports/employee-performance')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  View All Employees
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};