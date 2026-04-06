// src/pages/batch/BatchStatusBoard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiGrid, FiRefreshCw, FiSearch, FiFilter, FiUsers,
  FiClock, FiAlertTriangle, FiActivity, FiCheckCircle,
  FiPlay, FiPause, FiEye, FiEdit2, FiChevronRight,
  FiLayers, FiPackage, FiUser, FiCalendar, FiTrendingUp,
  FiPieChart, FiBarChart2, FiTarget, FiBell, FiSettings
} from 'react-icons/fi';
import BatchService from '../../services/batchService';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const BatchStatusBoard = () => {
  const navigate = useNavigate();
  
  // State Management
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedPriority, setSelectedPriority] = useState('ALL');
  
  // Time and refresh
  const [currentTime, setCurrentTime] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [blinkingDelay, setBlinkingDelay] = useState(false);

  // Status options
  const statusOptions = [
    { value: 'ALL', label: 'All Status', color: 'text-gray-600', icon: FiGrid },
    { value: 'PENDING', label: 'Pending', color: 'text-yellow-600', icon: FiClock },
    { value: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-600', icon: FiActivity },
    { value: 'COMPLETED', label: 'Completed', color: 'text-green-600', icon: FiCheckCircle },
    { value: 'DELAYED', label: 'Delayed', color: 'text-red-600', icon: FiAlertTriangle },
    { value: 'CANCELLED', label: 'Cancelled', color: 'text-gray-600', icon: FiPause }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'ALL', label: 'All Priority' },
    { value: 'LOW', label: 'Low', color: 'text-gray-600', bg: 'bg-gray-100' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'HIGH', label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' }
  ];

  // Load batches
  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await BatchService.getAllBatches();
      const data = response.data || [];
      
      // Sort batches: delayed first, then by priority and start time
      const sortedBatches = data.sort((a, b) => {
        if (a.status === 'DELAYED' && b.status !== 'DELAYED') return -1;
        if (a.status !== 'DELAYED' && b.status === 'DELAYED') return 1;
        
        // Sort by priority
        const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        
        // Sort by start time (newest first for in-progress)
        if (a.startTime && b.startTime) {
          return new Date(b.startTime) - new Date(a.startTime);
        }
        
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setBatches(sortedBatches);
      
      // Trigger blinking effect if there are delayed batches
      if (data.some(b => b.status === 'DELAYED')) {
        setBlinkingDelay(true);
        setTimeout(() => setBlinkingDelay(false), 1000);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      loadBatches();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, loadBatches]);

  // Filter batches
  useEffect(() => {
    let filtered = [...batches];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.product?.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.product?.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.assignedEmployee?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Status filter
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter(batch => batch.status === selectedStatus);
    }
    
    // Priority filter
    if (selectedPriority !== 'ALL') {
      filtered = filtered.filter(batch => batch.priority === selectedPriority);
    }
    
    setFilteredBatches(filtered);
  }, [batches, searchTerm, selectedStatus, selectedPriority]);

  // Calculate time status
  const calculateTimeStatus = (batch) => {
  if (!batch.startTime || batch.status !== 'IN_PROGRESS') {
    return null;
  }
  
  const start = new Date(batch.startTime);
  const now = new Date();
  const elapsedHours = Math.floor((now - start) / (1000 * 60 * 60));
  const remainingHours = Math.max(0, 48 - elapsedHours);
  
  if (elapsedHours > 48) {
    return { 
      type: 'OVERDUE', 
      hours: elapsedHours - 48, 
      text: `${elapsedHours - 48}h overdue`,
      critical: elapsedHours - 48 > 12
    };
  }

    
    if (remainingHours < 8) {
      return { 
        type: 'CRITICAL', 
        hours: remainingHours, 
        text: `${remainingHours}h left`,
        critical: true
      };
    }
    
    if (remainingHours < 24) {
      return { 
        type: 'WARNING', 
        hours: remainingHours, 
        text: `${remainingHours}h left`,
        critical: false
      };
    }
    
    return { 
      type: 'NORMAL', 
      hours: remainingHours, 
      text: `${remainingHours}h left`,
      critical: false
    };
  };

  // Get status card color
  const getStatusCardColor = (status, timeStatus) => {
    if (status === 'DELAYED' || (timeStatus && timeStatus.type === 'OVERDUE')) {
      return 'bg-gradient-to-br from-red-50 to-white border-red-200';
    }
    
    if (status === 'IN_PROGRESS' && timeStatus && timeStatus.critical) {
      return 'bg-gradient-to-br from-orange-50 to-white border-orange-200';
    }
    
    switch (status) {
      case 'PENDING':
        return 'bg-gradient-to-br from-yellow-50 to-white border-yellow-200';
      case 'IN_PROGRESS':
        return 'bg-gradient-to-br from-blue-50 to-white border-blue-200';
      case 'COMPLETED':
        return 'bg-gradient-to-br from-green-50 to-white border-green-200';
      case 'CANCELLED':
        return 'bg-gradient-to-br from-gray-50 to-white border-gray-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const icons = {
      PENDING: FiClock,
      IN_PROGRESS: FiActivity,
      COMPLETED: FiCheckCircle,
      DELAYED: FiAlertTriangle,
      CANCELLED: FiPause
    };
    return icons[status] || FiClock;
  };

  // Format duration
  const formatDuration = (hours) => {
    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      const remainingHours = hours % 24;
      return `${days}d ${remainingHours}h`;
    }
    return `${hours}h`;
  };

  // Handle quick actions
  const handleQuickAction = (batch, action) => {
    switch (action) {
      case 'view':
        navigate(`/batch/${batch.id}`);
        break;
      case 'assign':
        if (batch.status === 'PENDING') {
          navigate(`/batch/${batch.id}/assign`);
        }
        break;
      case 'start':
        if (batch.status === 'PENDING') {
          navigate(`/batch/${batch.id}/start`);
        }
        break;
      case 'complete':
        if (batch.status === 'IN_PROGRESS') {
          navigate(`/batch/${batch.id}/complete`);
        }
        break;
      default:
        break;
    }
  };

  // Calculate statistics
  const stats = {
    total: batches.length,
    pending: batches.filter(b => b.status === 'PENDING').length,
    inProgress: batches.filter(b => b.status === 'IN_PROGRESS').length,
    completed: batches.filter(b => b.status === 'COMPLETED').length,
    delayed: batches.filter(b => b.status === 'DELAYED').length,
    cancelled: batches.filter(b => b.status === 'CANCELLED').length
  };

  // Group batches by status for the board view
  const groupedBatches = {
    PENDING: filteredBatches.filter(b => b.status === 'PENDING'),
    IN_PROGRESS: filteredBatches.filter(b => b.status === 'IN_PROGRESS'),
    COMPLETED: filteredBatches.filter(b => b.status === 'COMPLETED'),
    DELAYED: filteredBatches.filter(b => b.status === 'DELAYED')
  };

  if (loading && batches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading status board...</span>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <FiGrid className="mr-3 text-blue-700" />
            Batch Status Board
          </h1>
          <p className="text-gray-600 mt-2">
            Live production tracking with real-time status updates
          </p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <FiClock className="mr-2" />
            {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
            {autoRefresh && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center">
                <FiRefreshCw className="mr-1 animate-spin" />
                Live
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
            {autoRefresh ? 'Live ON' : 'Live OFF'}
          </button>
          <button
            onClick={loadBatches}
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
            <FiLayers className="mr-2" />
            New Batch
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
            </div>
            <FiLayers className="w-6 h-6 text-gray-400" />
          </div>
        </div>
        
        <div className="card p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{stats.pending}</p>
            </div>
            <FiClock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        
        <div className="card p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">{stats.inProgress}</p>
            </div>
            <FiActivity className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="card p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{stats.completed}</p>
            </div>
            <FiCheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className={`card p-4 bg-red-50 border-red-200 ${blinkingDelay ? 'animate-pulse' : ''}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delayed</p>
              <p className="text-2xl font-bold text-red-700 mt-1">{stats.delayed}</p>
            </div>
            <FiAlertTriangle className="w-6 h-6 text-red-600" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.cancelled}</p>
            </div>
            <FiPause className="w-6 h-6 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Batches
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code, product, or employee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
              disabled={loading}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="input-field"
              disabled={loading}
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* View Options */}
          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedStatus('ALL');
                setSelectedPriority('ALL');
              }}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition w-full"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Kanban Style Board View */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        {Object.entries(groupedBatches).map(([status, statusBatches]) => {
          const StatusIcon = getStatusIcon(status);
          const statusConfig = statusOptions.find(s => s.value === status);
          
          return (
            <div key={status} className="space-y-4">
              {/* Column Header */}
              <div className="flex items-center justify-between p-4 bg-white rounded-xl shadow border border-gray-200">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${statusConfig?.color.replace('text-', 'bg-')} bg-opacity-10 mr-3`}>
                    <StatusIcon className={`w-5 h-5 ${statusConfig?.color || 'text-gray-600'}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{statusConfig?.label || status}</h3>
                    <p className="text-sm text-gray-500">{statusBatches.length} batches</p>
                  </div>
                </div>
                {statusBatches.length > 0 && (
                  <div className="text-2xl font-bold text-gray-300">
                    {statusBatches.length}
                  </div>
                )}
              </div>

              {/* Batch Cards */}
              <div className="space-y-4">
                {statusBatches.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <StatusIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No {status.toLowerCase()} batches</p>
                  </div>
                ) : (
                  statusBatches.map((batch) => {
                    const timeStatus = calculateTimeStatus(batch);
                    const PriorityIcon = priorityOptions.find(p => p.value === batch.priority);
                    
                    return (
                      <div 
                        key={batch.id}
                        className={`rounded-xl border shadow-sm transition-all hover:shadow-md ${getStatusCardColor(batch.status, timeStatus)}`}
                      >
                        {/* Batch Header */}
                        <div className="p-4 border-b border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="font-bold text-gray-900">{batch.batchCode}</div>
                              <span className={`px-2 py-1 text-xs font-bold rounded ${PriorityIcon?.bg || 'bg-blue-100'} ${PriorityIcon?.color || 'text-blue-800'}`}>
                                {batch.priority}
                              </span>
                            </div>
                            <button
                              onClick={() => handleQuickAction(batch, 'view')}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="text-sm font-medium text-gray-900 mb-1">
                            {batch.product?.productName}
                          </div>
                          <div className="text-xs text-gray-500">
                            Qty: {batch.batchQuantity} • Created: {new Date(batch.createdAt).toLocaleDateString()}
                          </div>
                        </div>

                        {/* Batch Details */}
                        <div className="p-4">
                          {/* Time Status */}
                          {timeStatus && (
                            <div className={`mb-3 p-2 rounded-lg text-center font-medium text-sm ${
                              timeStatus.type === 'OVERDUE' 
                                ? 'bg-red-100 text-red-800 animate-pulse' 
                                : timeStatus.critical
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {timeStatus.text}
                            </div>
                          )}

                          {/* Assigned Employee */}
                          {batch.assignedEmployee && (
                            <div className="flex items-center mb-3">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <FiUser className="w-4 h-4 text-blue-700" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">
                                  {batch.assignedEmployee.fullName}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Assigned
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Progress Bar */}
                          {(batch.status === 'IN_PROGRESS' || batch.status === 'COMPLETED') && (
                            <div className="mb-3">
                              <div className="flex items-center justify-between mb-1 text-xs">
                                <span className="text-gray-600">Progress</span>
                                <span className="font-medium">
                                  {batch.progressPercentage || (batch.status === 'COMPLETED' ? 100 : 0)}%
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    batch.status === 'COMPLETED' ? 'bg-green-500' :
                                    timeStatus?.type === 'OVERDUE' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  }`}
                                  style={{ 
                                    width: `${batch.progressPercentage || (batch.status === 'COMPLETED' ? 100 : 0)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Quick Actions */}
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleQuickAction(batch, 'view')}
                              className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-sm font-medium transition"
                            >
                              View
                            </button>
                            
                            {batch.status === 'PENDING' && (
                              <button
                                onClick={() => handleQuickAction(batch, 'start')}
                                className="flex-1 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition"
                              >
                                Start
                              </button>
                            )}
                            
                          {(batch.status === 'IN_PROGRESS' || batch.status === 'DELAYED') && (
                              <button
                                onClick={() => handleQuickAction(batch, 'complete')}
                                className="flex-1 px-3 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg text-sm font-medium transition"
                              >
                                Complete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Table View (Toggle) */}
      <div className="card">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <FiGrid className="mr-2" />
            All Batches ({filteredBatches.length})
          </h2>
        </div>
        
        <div className="p-6">
          {filteredBatches.length === 0 ? (
            <div className="text-center py-8">
              <FiLayers className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No batches found matching your filters</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStatus('ALL');
                  setSelectedPriority('ALL');
                }}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBatches.map((batch) => {
                    const timeStatus = calculateTimeStatus(batch);
                    const StatusIcon = getStatusIcon(batch.status);
                    const priorityConfig = priorityOptions.find(p => p.value === batch.priority);
                    
                    return (
                      <tr key={batch.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-bold text-gray-900">{batch.batchCode}</div>
                          <div className="text-xs text-gray-500">
                            Qty: {batch.batchQuantity}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{batch.product?.productName}</div>
                          <div className="text-xs text-gray-500">{batch.product?.productCode}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className={`p-1.5 rounded-lg mr-2 ${statusOptions.find(s => s.value === batch.status)?.color.replace('text-', 'bg-')} bg-opacity-10`}>
                              <StatusIcon className={`w-4 h-4 ${statusOptions.find(s => s.value === batch.status)?.color || 'text-gray-600'}`} />
                            </div>
                            <span className="font-medium text-gray-900">
                              {statusOptions.find(s => s.value === batch.status)?.label || batch.status}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${priorityConfig?.bg || 'bg-blue-100'} ${priorityConfig?.color || 'text-blue-800'}`}>
                            {batch.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {batch.assignedEmployee ? (
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                                <span className="text-blue-800 font-medium text-xs">
                                  {batch.assignedEmployee.fullName?.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div className="text-sm text-gray-900">{batch.assignedEmployee.fullName}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not assigned</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {timeStatus ? (
                            <div className={`px-3 py-1 rounded-full text-xs font-medium text-center ${
                              timeStatus.type === 'OVERDUE' 
                                ? 'bg-red-100 text-red-800 animate-pulse' 
                                : timeStatus.critical
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {timeStatus.text}
                            </div>
                          ) : batch.startTime ? (
                            <div className="text-xs text-gray-500">
                              Started: {new Date(batch.startTime).toLocaleDateString()}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not started</span>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className={`h-2 rounded-full ${
                                  batch.status === 'COMPLETED' ? 'bg-green-500' :
                                  batch.status === 'DELAYED' ? 'bg-red-500' :
                                  'bg-blue-500'
                                }`}
                                style={{ width: `${batch.progressPercentage || (batch.status === 'COMPLETED' ? 100 : 0)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{batch.progressPercentage || (batch.status === 'COMPLETED' ? 100 : 0)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleQuickAction(batch, 'view')}
                              className="px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition"
                            >
                              View
                            </button>
                            {batch.status === 'PENDING' && (
                              <button
                                onClick={() => handleQuickAction(batch, 'start')}
                                className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition"
                              >
                                Start
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};