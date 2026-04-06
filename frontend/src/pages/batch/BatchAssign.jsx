// src/pages/batch/BatchAssign.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiUsers, FiCheck, FiX, FiRefreshCw, FiSearch,
  FiUser, FiClock, FiPackage, FiActivity, FiAlertCircle,
  FiEdit2, FiEye, FiPlay, FiChevronRight, FiLayers,
  FiTarget, FiTrendingUp, FiCalendar, FiBarChart
} from 'react-icons/fi';
import BatchService from '../../services/batchService';
import UserService from '../../services/userService';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const BatchAssign = () => {
  const navigate = useNavigate();
  
  // State Management
  const [unassignedBatches, setUnassignedBatches] = useState([]);
  const [availableEmployees, setAvailableEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Selection state
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [expectedCompletionTime, setExpectedCompletionTime] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load unassigned batches
      const batchesResponse = await BatchService.getBatchesByStatus('PENDING');
      setUnassignedBatches(batchesResponse.data || []);
      
      // Load available employees
      const employeesResponse = await BatchService.getAvailableEmployees();
      setAvailableEmployees(employeesResponse.data || []);
      
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Handle batch selection
  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setSelectedEmployee('');
    setExpectedCompletionTime('');
  };

  // Handle assignment
  const handleAssign = async () => {
    if (!selectedBatch || !selectedEmployee) {
      toast.error('Please select both a batch and an employee');
      return;
    }

    setAssigning(true);
    try {
      const startData = {
        employeeId: parseInt(selectedEmployee),
        expectedCompletionTime: expectedCompletionTime || null,
        notes: `Assigned to employee ID: ${selectedEmployee}`
      };

      await BatchService.startBatch(selectedBatch.id, startData);
      
      toast.success('✅ Batch assigned successfully!');
      
      // Refresh data
      await loadData();
      
      // Clear selection
      setSelectedBatch(null);
      setSelectedEmployee('');
      setExpectedCompletionTime('');
      
    } catch (error) {
      console.error('Error assigning batch:', error);
      
      let errorMessage = 'Failed to assign batch';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  // Quick assign (single click)
  const handleQuickAssign = async (batchId, employeeId) => {
    setAssigning(true);
    try {
      const startData = {
        employeeId: parseInt(employeeId),
        expectedCompletionTime: null,
        notes: 'Quick assigned'
      };

      await BatchService.startBatch(batchId, startData);
      
      toast.success('✅ Batch assigned!');
      await loadData();
      
    } catch (error) {
      console.error('Error quick assigning:', error);
      toast.error('Failed to assign batch');
    } finally {
      setAssigning(false);
    }
  };

  // Format date for input
  const formatDateForInput = (date) => {
    if (!date) return '';
    const d = new Date(date);
    d.setHours(23, 59, 0); // Set to end of day
    return d.toISOString().slice(0, 16);
  };

  // Calculate default expected completion (48 hours from now)
  const getDefaultExpectedTime = () => {
    const now = new Date();
    const expected = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
    return formatDateForInput(expected);
  };

  // Filter batches
  const filteredBatches = unassignedBatches.filter(batch =>
    batch.batchCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.product?.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get employee workload
  const getEmployeeWorkload = (employeeId) => {
    // This would ideally come from backend
    return Math.floor(Math.random() * 5); // Mock data
  };

  if (loading && unassignedBatches.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading assignment data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiUsers className="mr-3 text-purple-700" />
              Batch Assignment
            </h1>
            <p className="text-gray-600 mt-2">
              Assign pending batches to available employees
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              className="btn-secondary flex items-center"
              disabled={loading || assigning}
            >
              <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/batch/dashboard')}
              className="btn-primary flex items-center"
            >
              <FiLayers className="mr-2" />
              Dashboard
            </button>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-purple-600 to-blue-400 rounded-full"></div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Batches</p>
              <p className="text-2xl font-bold text-yellow-700 mt-1">{unassignedBatches.length}</p>
            </div>
            <FiClock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available Employees</p>
              <p className="text-2xl font-bold text-green-700 mt-1">{availableEmployees.length}</p>
            </div>
            <FiUser className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg Workload</p>
              <p className="text-2xl font-bold text-blue-700 mt-1">
                {availableEmployees.length > 0 
                  ? Math.round(unassignedBatches.length / availableEmployees.length) 
                  : 0}
              </p>
            </div>
            <FiTrendingUp className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Unassigned Batches */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiPackage className="mr-2" />
                  Unassigned Batches ({unassignedBatches.length})
                </h2>
                <div className="relative w-64">
                  <FiSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search batches..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {unassignedBatches.length === 0 ? (
                <div className="text-center py-8">
                  <FiCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-green-700 font-medium">All batches assigned!</p>
                  <p className="text-sm text-gray-500">No pending batches available for assignment</p>
                  <button
                    onClick={() => navigate('/batch/create')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Create New Batch
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredBatches.map((batch) => {
                    const isSelected = selectedBatch?.id === batch.id;
                    
                    return (
                      <div
                        key={batch.id}
                        className={`border rounded-xl p-4 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => handleBatchSelect(batch)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="font-bold text-gray-900">{batch.batchCode}</div>
                            <span className={`px-2 py-1 text-xs font-bold rounded ${
                              batch.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                              batch.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              batch.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {batch.priority}
                            </span>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <FiCheck className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="mb-2">
                          <h4 className="font-medium text-gray-900">{batch.product?.productName}</h4>
                          <p className="text-sm text-gray-500">Quantity: {batch.batchQuantity}</p>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-600">
                            Created: {new Date(batch.createdAt).toLocaleDateString()}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/batch/${batch.id}`);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <FiEye className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Assignment Panel */}
        <div className="space-y-8">
          {/* Selected Batch Details */}
          {selectedBatch && (
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiTarget className="mr-2" />
                  Selected Batch
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="font-bold text-gray-900 text-lg mb-1">{selectedBatch.batchCode}</div>
                    <div className="text-gray-700">{selectedBatch.product?.productName}</div>
                    <div className="text-sm text-gray-500">Quantity: {selectedBatch.batchQuantity}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FiPackage className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Product Code:</span>
                      <span className="ml-auto text-sm font-medium">{selectedBatch.product?.productCode}</span>
                    </div>
                    <div className="flex items-center">
                      <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Created:</span>
                      <span className="ml-auto text-sm">
                        {new Date(selectedBatch.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <FiBarChart className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Priority:</span>
                      <span className={`ml-auto px-2 py-1 text-xs font-bold rounded ${
                        selectedBatch.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                        selectedBatch.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        selectedBatch.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {selectedBatch.priority}
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedBatch(null)}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Employee Selection */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiUsers className="mr-2" />
                Available Employees ({availableEmployees.length})
              </h2>
            </div>
            
            <div className="p-6">
              {availableEmployees.length === 0 ? (
                <div className="text-center py-4">
                  <FiAlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  <p className="text-yellow-700">No employees available</p>
                  <p className="text-sm text-gray-500">All employees are currently assigned</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {availableEmployees.map((employee) => {
                    const workload = getEmployeeWorkload(employee.id);
                    const isSelected = selectedEmployee === employee.id.toString();
                    
                    return (
                      <div
                        key={employee.id}
                        className={`border rounded-lg p-3 transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedEmployee(employee.id.toString())}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                              <span className="text-blue-800 font-medium">
                                {employee.fullName?.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{employee.fullName}</div>
                              <div className="text-xs text-gray-500">@{employee.username}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <FiCheck className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <div className="text-gray-600">
                            Workload: <span className="font-medium">{workload} batches</span>
                          </div>
                          {selectedBatch && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickAssign(selectedBatch.id, employee.id);
                              }}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition"
                            >
                              Quick Assign
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

          {/* Assignment Form */}
          {selectedBatch && (
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiEdit2 className="mr-2" />
                  Assignment Details
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  {/* Expected Completion Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expected Completion Time
                    </label>
                    <input
                      type="datetime-local"
                      value={expectedCompletionTime || getDefaultExpectedTime()}
                      onChange={(e) => setExpectedCompletionTime(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={formatDateForInput(new Date())}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Default: 48 hours from now
                    </p>
                  </div>
                  
                  {/* Summary */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Assignment Summary</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Batch:</span>
                        <span className="font-medium">{selectedBatch.batchCode}</span>
                      </div>
                      {selectedEmployee && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Employee:</span>
                          <span className="font-medium">
                            {availableEmployees.find(e => e.id.toString() === selectedEmployee)?.fullName}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Time Limit:</span>
                        <span className="font-medium text-blue-700">48 hours</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-2">
                    <button
                      onClick={handleAssign}
                      disabled={!selectedEmployee || assigning}
                      className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {assigning ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Assigning...
                        </>
                      ) : (
                        <>
                          <FiCheck className="mr-2" />
                          Assign Batch
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => {
                        setSelectedBatch(null);
                        setSelectedEmployee('');
                        setExpectedCompletionTime('');
                      }}
                      className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                    >
                      <FiX className="inline mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};