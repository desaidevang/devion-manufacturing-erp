// src/pages/batch/BatchDashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiLayers, FiPlus, FiRefreshCw, FiSearch, FiFilter,
  FiAlertCircle, FiCheck, FiClock, FiUser, FiPackage,
  FiTrendingUp, FiActivity, FiAlertTriangle, FiChevronRight,
  FiEye, FiEdit2, FiPlay, FiCheckCircle, FiPause,
  FiUsers, FiCalendar, FiBarChart, FiGrid, FiPieChart
} from 'react-icons/fi';
import BatchService from '../../services/batchService';
import ProductService from '../../services/productService';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const BatchDashboard = () => {
  const navigate = useNavigate();
  
  // State Management
  const [dashboardData, setDashboardData] = useState(null);
  const [recentBatches, setRecentBatches] = useState([]);
  const [delayedBatches, setDelayedBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    completed: 0,
    delayed: 0
  });

  // Time-based updates
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await BatchService.getDashboard();
      const data = response.data;
      
      setDashboardData(data);
      setStats({
        total: data.totalBatches,
        pending: data.pendingBatches,
        inProgress: data.inProgressBatches,
        completed: data.completedBatches,
        delayed: data.delayedBatches
      });
      
      setRecentBatches(data.recentBatches || []);
      setDelayedBatches(data.delayedBatchesList || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      fetchDashboardData();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboardData]);

  // Format time remaining
  const formatTimeRemaining = (startTime) => {
    if (!startTime) return null;
    
    const start = new Date(startTime);
    const now = new Date();
    const elapsedHours = Math.floor((now - start) / (1000 * 60 * 60));
    const remainingHours = Math.max(0, 48 - elapsedHours);
    
    if (elapsedHours > 48) {
      return { overdue: true, hours: elapsedHours - 48, text: `${elapsedHours - 48}h overdue` };
    }
    
    return { 
      overdue: false, 
      hours: remainingHours, 
      text: `${remainingHours}h remaining` 
    };
  };

  // Get status badge
  const getStatusBadge = (status, startTime) => {
    const badges = {
      PENDING: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FiClock, label: 'Pending' },
      IN_PROGRESS: { 
        bg: 'bg-blue-100', 
        text: 'text-blue-800', 
        icon: FiActivity, 
        label: 'In Progress',
        time: formatTimeRemaining(startTime)
      },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', icon: FiCheck, label: 'Completed' },
      DELAYED: { bg: 'bg-red-100', text: 'text-red-800', icon: FiAlertTriangle, label: 'Delayed' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', icon: FiPause, label: 'Cancelled' },
      ON_HOLD: { bg: 'bg-orange-100', text: 'text-orange-800', icon: FiPause, label: 'On Hold' }
    };
    
    return badges[status] || badges.PENDING;
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    const badges = {
      LOW: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Low' },
      MEDIUM: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Medium' },
      HIGH: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'High' },
      URGENT: { bg: 'bg-red-100', text: 'text-red-800', label: 'Urgent' }
    };
    
    return badges[priority] || badges.MEDIUM;
  };

  // Calculate progress percentage
  const calculateProgress = (batch) => {
    if (batch.progressPercentage !== undefined) return batch.progressPercentage;
    
    if (batch.totalPartsRequired && batch.totalPartsUsed) {
      return Math.min(100, Math.round((batch.totalPartsUsed / batch.totalPartsRequired) * 100));
    }
    
    if (batch.status === 'COMPLETED') return 100;
    if (batch.status === 'PENDING') return 0;
    return 25; // Default for IN_PROGRESS
  };

  // Handle quick actions
  const handleViewBatch = (batchId) => {
    navigate(`/batch/${batchId}`);
  };

  const handleAssignBatch = (batchId) => {
    navigate(`/batch/${batchId}/assign`);
  };

  const handleStartBatch = async (batchId) => {
    try {
      const employees = await BatchService.getAvailableEmployees();
      if (employees.data.length === 0) {
        toast.error('No employees available for assignment');
        return;
      }
      navigate(`/batch/${batchId}/start`);
    } catch (error) {
      toast.error('Failed to fetch available employees');
    }
  };

  const handleCompleteBatch = (batchId) => {
    navigate(`/batch/${batchId}/complete`);
  };

  if (loading && !dashboardData) {
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
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <FiLayers className="mr-3 text-blue-700" />
            Batch Production Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time monitoring of production batches, assignments, and progress
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
            title={autoRefresh ? "Auto-refresh enabled" : "Auto-refresh disabled"}
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
            onClick={() => navigate('/batch/create')}
            className="btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Create Batch
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Batches */}
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Batches</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
              <div className="text-xs text-gray-500 mt-2">All time production</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FiLayers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* In Progress */}
        <div className="card p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-700 mt-2">{stats.inProgress}</p>
              <div className="text-xs text-blue-600 mt-2">Active production</div>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <FiActivity className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Pending */}
        <div className="card p-6 bg-gradient-to-br from-yellow-50 to-white border-yellow-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-yellow-700 mt-2">{stats.pending}</p>
              <div className="text-xs text-yellow-600 mt-2">Awaiting start</div>
            </div>
            <div className="p-3 bg-yellow-100 rounded-xl">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Completed */}
        <div className="card p-6 bg-gradient-to-br from-green-50 to-white border-green-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-700 mt-2">{stats.completed}</p>
              <div className="text-xs text-green-600 mt-2">This month</div>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Delayed */}
        <div className="card p-6 bg-gradient-to-br from-red-50 to-white border-red-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delayed</p>
              <p className="text-3xl font-bold text-red-700 mt-2">{stats.delayed}</p>
              <div className="text-xs text-red-600 mt-2"> 48 hours</div>
            </div>
            <div className="p-3 bg-red-100 rounded-xl">
              <FiAlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Bar */}
      <div className="card p-4 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/batch/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center text-sm"
            >
              <FiPlus className="mr-2" />
              New Batch
            </button>
            <button
              onClick={() => navigate('/batch/manage')}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition flex items-center text-sm"
            >
              <FiGrid className="mr-2" />
              Manage All
            </button>
            <button
              onClick={() => navigate('/batch/status')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center text-sm"
            >
              <FiActivity className="mr-2" />
              Status Board
            </button>
            <button
              onClick={() => navigate('/batch/assign')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center text-sm"
            >
              <FiUsers className="mr-2" />
              Assign Batches
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Recent Batches */}
        <div className="lg:col-span-2 space-y-8">
          {/* Recent Batches */}
          <div className="card">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiClock className="mr-2" />
                Recent Batches
              </h2>
              <button
                onClick={() => navigate('/batch/manage')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
              >
                View All
                <FiChevronRight className="ml-1" />
              </button>
            </div>
            
            <div className="p-6">
              {recentBatches.length === 0 ? (
                <div className="text-center py-8">
                  <FiLayers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No batches created yet</p>
                  <button
                    onClick={() => navigate('/batch/create')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                  >
                    Create First Batch
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentBatches.map((batch) => {
                    const statusBadge = getStatusBadge(batch.status, batch.startTime);
                    const priorityBadge = getPriorityBadge(batch.priority);
                    const progress = calculateProgress(batch);
                    const StatusIcon = statusBadge.icon;
                    
                    return (
                      <div key={batch.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="bg-white border border-gray-200 rounded-lg p-2">
                              <span className="font-bold text-gray-900">{batch.batchCode}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{batch.product?.productName}</h4>
                              <p className="text-sm text-gray-500">Qty: {batch.batchQuantity}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${priorityBadge.bg} ${priorityBadge.text}`}>
                              {priorityBadge.label}
                            </span>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center ${statusBadge.bg} ${statusBadge.text}`}>
                              <StatusIcon className="mr-1" />
                              {statusBadge.label}
                            </span>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-600">Progress</span>
                            <span className="text-xs font-medium text-gray-900">{progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                batch.status === 'COMPLETED' ? 'bg-green-500' :
                                batch.status === 'DELAYED' ? 'bg-red-500' :
                                'bg-blue-500'
                              }`}
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Details Row */}
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center space-x-4">
                            {batch.assignedEmployee && (
                              <div className="flex items-center">
                                <FiUser className="w-4 h-4 text-gray-400 mr-1" />
                                <span className="text-gray-700">{batch.assignedEmployee.fullName}</span>
                              </div>
                            )}
                            {batch.startTime && (
                              <div className="flex items-center">
                                <FiCalendar className="w-4 h-4 text-gray-400 mr-1" />
                                <span className="text-gray-700">
                                  Started: {new Date(batch.startTime).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          
                          {/* Time Status */}
                          {statusBadge.time && (
                            <div className={`text-xs font-medium px-2 py-1 rounded ${
                              statusBadge.time.overdue 
                                ? 'bg-red-100 text-red-800 animate-pulse' 
                                : statusBadge.time.hours < 8 
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {statusBadge.time.text}
                            </div>
                          )}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleViewBatch(batch.id)}
                            className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                          >
                            <FiEye className="inline mr-1" />
                            View
                          </button>
                          
                          {batch.status === 'PENDING' && (
                            <button
                              onClick={() => handleStartBatch(batch.id)}
                              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
                            >
                              <FiPlay className="inline mr-1" />
                              Start
                            </button>
                          )}
                          
                          {(batch.status === 'IN_PROGRESS' || batch.status === 'DELAYED') && (
                            <button
                              onClick={() => handleCompleteBatch(batch.id)}
                              className="px-3 py-1.5 text-sm bg-green-600 text-white hover:bg-green-700 rounded-lg transition"
                            >
                              <FiCheckCircle className="inline mr-1" />
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Employee Performance Summary */}
          {dashboardData?.employeeSummary && dashboardData.employeeSummary.length > 0 && (
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiUsers className="mr-2" />
                  Team Performance
                </h2>
              </div>
              
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">In Progress</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Delayed</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Efficiency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {dashboardData.employeeSummary.map((emp) => {
                        const efficiency = emp.totalAssigned > 0 
                          ? Math.round((emp.completed / emp.totalAssigned) * 100)
                          : 0;
                        
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
                              <span className="font-medium text-blue-700">{emp.inProgress}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="font-medium text-green-700">{emp.completed}</span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`font-medium ${emp.delayed > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                                {emp.delayed}
                              </span>
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
                                    style={{ width: `${efficiency}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{efficiency}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Critical Alerts & Quick Stats */}
        <div className="space-y-8">
          {/* Delayed Batches Alert */}
          <div className="card border-red-200">
            <div className="p-6 border-b border-red-200 bg-red-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiAlertTriangle className="mr-2 text-red-600" />
                Delayed Batches ({delayedBatches.length})
              </h2>
              <p className="text-sm text-gray-600 mt-1">Batches exceeding 48-hour limit</p>
            </div>
            
            <div className="p-6">
              {delayedBatches.length === 0 ? (
                <div className="text-center py-4">
                  <FiCheck className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-green-700 font-medium">No delayed batches</p>
                  <p className="text-sm text-gray-500">All batches are on schedule</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {delayedBatches.slice(0, 3).map((batch) => {
                    const hoursOverdue = batch.delayHours || 0;
                    const priorityBadge = getPriorityBadge(batch.priority);
                    
                    return (
                      <div key={batch.id} className="bg-red-50 border border-red-200 rounded-lg p-3 animate-pulse">
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-medium text-gray-900">{batch.batchCode}</div>
                          <span className={`px-2 py-1 text-xs font-bold rounded ${priorityBadge.bg} ${priorityBadge.text}`}>
                            {priorityBadge.label}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 mb-2">
                          {batch.product?.productName}
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="text-red-700 font-bold">
                            {hoursOverdue}h overdue
                          </div>
                          {batch.assignedEmployee && (
                            <div className="text-gray-600">
                              {batch.assignedEmployee.fullName}
                            </div>
                          )}
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={() => navigate(`/batch/${batch.id}`)}
                            className="w-full px-3 py-2 bg-white text-red-700 border border-red-300 rounded-lg hover:bg-red-50 transition text-sm font-medium"
                          >
                            Take Action
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {delayedBatches.length > 3 && (
                    <button
                      onClick={() => navigate('/batch/manage?status=DELAYED')}
                      className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                    >
                      View All {delayedBatches.length} Delayed Batches
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Production Stats */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiBarChart className="mr-2" />
                Production Stats
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {/* Daily Average */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Daily Average</p>
                    <p className="text-lg font-bold text-gray-900">4.2 batches/day</p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FiTrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                
                {/* Completion Rate */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Completion Rate</p>
                    <p className="text-lg font-bold text-gray-900">87%</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FiCheck className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                
                {/* On-time Delivery */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">On-time Delivery</p>
                    <p className="text-lg font-bold text-gray-900">92%</p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FiClock className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                
                {/* Productivity Trend */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">Productivity Trend</p>
                  <div className="flex items-center space-x-1">
                    {[40, 65, 75, 85, 92, 87].map((value, index) => (
                      <div 
                        key={index}
                        className="flex-1 bg-blue-100 rounded-t"
                        style={{ height: `${value * 0.8}px` }}
                      >
                        <div 
                          className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
                          style={{ height: `${value}%` }}
                        ></div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Status Board */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiActivity className="mr-2" />
                Status Quick View
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/batch/manage?status=PENDING')}
                  className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <FiClock className="w-6 h-6 text-yellow-600" />
                    <span className="text-2xl font-bold text-yellow-700">{stats.pending}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">Pending</p>
                </button>
                
                <button
                  onClick={() => navigate('/batch/manage?status=IN_PROGRESS')}
                  className="p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <FiActivity className="w-6 h-6 text-blue-600" />
                    <span className="text-2xl font-bold text-blue-700">{stats.inProgress}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">In Progress</p>
                </button>
                
                <button
                  onClick={() => navigate('/batch/manage?status=COMPLETED')}
                  className="p-4 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <FiCheck className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">{stats.completed}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">Completed</p>
                </button>
                
                <button
                  onClick={() => navigate('/batch/manage?status=DELAYED')}
                  className="p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition"
                >
                  <div className="flex items-center justify-between">
                    <FiAlertTriangle className="w-6 h-6 text-red-600" />
                    <span className="text-2xl font-bold text-red-700">{stats.delayed}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mt-2">Delayed</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};