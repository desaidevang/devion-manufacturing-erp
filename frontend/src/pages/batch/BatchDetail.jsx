// src/pages/batch/BatchDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiArrowLeft, FiEdit2, FiCheck, FiClock, FiUser,
  FiPackage, FiLayers, FiActivity, FiAlertTriangle,
  FiRefreshCw, FiPlay, FiPause, FiX, FiSave,
  FiChevronRight, FiBarChart, FiCalendar, FiTarget,
  FiTrendingUp, FiGrid, FiBox, FiUsers, FiArchive
} from 'react-icons/fi';
import BatchService from '../../services/batchService';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const BatchDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [batch, setBatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [completing, setCompleting] = useState(false);
  
  // Edit form
  const [editForm, setEditForm] = useState({
    notes: '',
    priority: 'MEDIUM',
    assignedEmployeeId: '',
    status: ''
  });
  
  // Complete form
  const [completeForm, setCompleteForm] = useState({
    actualQuantity: '',
    notes: '',
    completionTime: new Date().toISOString().slice(0, 16)
  });

  // Load batch data
  useEffect(() => {
    loadBatch();
  }, [id]);

  const loadBatch = async () => {
    try {
      setLoading(true);
      const response = await BatchService.getBatchById(id);
      setBatch(response.data);
      
      // Initialize edit form
      setEditForm({
        notes: response.data.notes || '',
        priority: response.data.priority || 'MEDIUM',
        assignedEmployeeId: response.data.assignedEmployee?.id?.toString() || '',
        status: response.data.status || ''
      });
      
      // Initialize complete form
      setCompleteForm({
        actualQuantity: response.data.batchQuantity || '',
        notes: '',
        completionTime: new Date().toISOString().slice(0, 16)
      });
      
    } catch (error) {
      console.error('Error loading batch:', error);
      toast.error('Failed to load batch details');
      navigate('/batch/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Handle batch update
  const handleUpdate = async () => {
    if (!editForm.notes.trim() && !editForm.assignedEmployeeId) {
      toast.error('Please provide notes or select an employee');
      return;
    }

    setUpdating(true);
    try {
      const updateData = {
        notes: editForm.notes,
        priority: editForm.priority,
        assignedEmployeeId: editForm.assignedEmployeeId ? parseInt(editForm.assignedEmployeeId) : null,
        status: editForm.status || undefined
      };

      const response = await BatchService.updateBatch(id, updateData);
      setBatch(response.data);
      setEditing(false);
      toast.success('✅ Batch updated successfully!');
      
    } catch (error) {
      console.error('Error updating batch:', error);
      toast.error('Failed to update batch');
    } finally {
      setUpdating(false);
    }
  };

  // Handle batch completion
  const handleComplete = async () => {
    if (!completeForm.actualQuantity || completeForm.actualQuantity < 1) {
      toast.error('Please enter actual quantity produced');
      return;
    }

    setCompleting(true);
    try {
      const completeData = {
        actualQuantity: parseInt(completeForm.actualQuantity),
        notes: completeForm.notes,
        completionTime: new Date(completeForm.completionTime)
      };

      const response = await BatchService.completeBatch(id, completeData);
      setBatch(response.data);
      toast.success('✅ Batch completed successfully!');
      
    } catch (error) {
      console.error('Error completing batch:', error);
      toast.error('Failed to complete batch');
    } finally {
      setCompleting(false);
    }
  };

  // Handle batch cancellation
  const handleCancel = async () => {
    const reason = prompt('Please enter reason for cancellation:');
    if (!reason) return;

    if (!window.confirm('Are you sure you want to cancel this batch? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await BatchService.cancelBatch(id, reason);
      setBatch(response.data);
      toast.success('✅ Batch cancelled successfully!');
    } catch (error) {
      console.error('Error cancelling batch:', error);
      toast.error('Failed to cancel batch');
    }
  };

  // Calculate time status
  const calculateTimeStatus = () => {
    if (!batch || !batch.startTime || batch.status !== 'IN_PROGRESS') {
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
        critical: true
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

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FiClock };
      case 'IN_PROGRESS': return { bg: 'bg-blue-100', text: 'text-blue-800', icon: FiActivity };
      case 'COMPLETED': return { bg: 'bg-green-100', text: 'text-green-800', icon: FiCheck };
      case 'DELAYED': return { bg: 'bg-red-100', text: 'text-red-800', icon: FiAlertTriangle };
      case 'CANCELLED': return { bg: 'bg-gray-100', text: 'text-gray-800', icon: FiX };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', icon: FiClock };
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || !batch) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading batch details...</span>
      </div>
    );
  }

  const statusColor = getStatusColor(batch.status);
  const StatusIcon = statusColor.icon;
  const timeStatus = calculateTimeStatus();

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate('/batch/dashboard')}
            className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <FiLayers className="mr-3 text-blue-700" />
            Batch: {batch.batchCode}
          </h1>
          <p className="text-gray-600 mt-2">
            Production batch details and management
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={loadBatch}
            className="btn-secondary flex items-center"
            disabled={loading || updating || completing}
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {batch.status === 'PENDING' && (
            <button
              onClick={() => navigate(`/batch/${id}/assign`)}
              className="btn-primary flex items-center"
            >
              <FiPlay className="mr-2" />
              Start Batch
            </button>
          )}
        {(batch.status === 'IN_PROGRESS' || batch.status === 'DELAYED') && (
            <button
              onClick={() => setCompleting(true)}
              className="btn-primary flex items-center bg-green-600 hover:bg-green-700"
            >
              <FiCheck className="mr-2" />
              Complete
            </button>
          )}
        </div>
      </div>

      {/* Status Alert */}
      <div className={`mb-8 p-6 rounded-xl border ${
        batch.status === 'DELAYED' || (timeStatus && timeStatus.type === 'OVERDUE')
          ? 'bg-red-50 border-red-200 animate-pulse'
          : batch.status === 'IN_PROGRESS' && timeStatus && timeStatus.critical
          ? 'bg-orange-50 border-orange-200'
          : statusColor.bg.replace('100', '50') + ' border-' + statusColor.text.replace('800', '200')
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg ${statusColor.bg} mr-4`}>
              <StatusIcon className={`w-6 h-6 ${statusColor.text}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{batch.status.replace('_', ' ')}</h2>
              <p className="text-gray-600">
                {batch.status === 'IN_PROGRESS' && timeStatus
                  ? timeStatus.text
                  : `Created: ${formatDate(batch.createdAt)}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              batch.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
              batch.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
              batch.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {batch.priority} Priority
            </span>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <FiEdit2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Batch Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* Product Information Card */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiPackage className="mr-2" />
                Product Information
              </h2>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{batch.product?.productName}</h3>
                  <p className="text-gray-600 mb-4">{batch.product?.description}</p>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <FiTarget className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Product Code:</span>
                      <span className="ml-auto font-medium">{batch.product?.productCode}</span>
                    </div>
                    <div className="flex items-center">
                      <FiBox className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Unit of Measure:</span>
                      <span className="ml-auto font-medium">{batch.product?.uom || 'PCS'}</span>
                    </div>
                    <div className="flex items-center">
                      <FiGrid className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">BOM Available:</span>
                      <span className="ml-auto font-medium text-green-700">
                        {batch.product?.hasBom ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Batch Specifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Planned Quantity:</span>
                      <span className="font-bold text-gray-900">{batch.batchQuantity} units</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Parts Required:</span>
                      <span className="font-medium text-blue-700">{batch.totalPartsRequired || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Parts Used:</span>
                      <span className="font-medium text-green-700">{batch.totalPartsUsed || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Progress:</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              batch.status === 'COMPLETED' ? 'bg-green-500' :
                              batch.status === 'DELAYED' ? 'bg-red-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${batch.progressPercentage || (batch.status === 'COMPLETED' ? 100 : 0)}%` }}
                          ></div>
                        </div>
                        <span className="font-bold">{batch.progressPercentage || (batch.status === 'COMPLETED' ? 100 : 0)}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiCalendar className="mr-2" />
                Production Timeline
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-6">
                {/* Timeline Steps */}
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                  
                  {/* Steps */}
                  <div className="space-y-8 relative">
                    {/* Created Step */}
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-4 relative">
                        <FiCheck className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Batch Created</h4>
                        <p className="text-sm text-gray-600">{formatDate(batch.createdAt)}</p>
                        <p className="text-sm text-gray-600">By: {batch.createdBy}</p>
                      </div>
                    </div>
                    
                    {/* Started Step */}
                    {batch.startTime && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center mr-4 relative">
                          <FiPlay className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Production Started</h4>
                          <p className="text-sm text-gray-600">{formatDate(batch.startTime)}</p>
                          {batch.assignedEmployee && (
                            <p className="text-sm text-gray-600">
                              Assigned to: {batch.assignedEmployee.fullName}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Expected Completion */}
                    {batch.expectedCompletionTime && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full border-2 border-blue-300 bg-white flex items-center justify-center mr-4 relative">
                          <FiClock className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Expected Completion</h4>
                          <p className="text-sm text-gray-600">{formatDate(batch.expectedCompletionTime)}</p>
                          {timeStatus && (
                            <p className={`text-sm ${
                              timeStatus.type === 'OVERDUE' ? 'text-red-600 font-medium' :
                              timeStatus.critical ? 'text-orange-600' : 'text-gray-600'
                            }`}>
                              {timeStatus.text}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Completed Step */}
                    {batch.endTime && (
                      <div className="flex items-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-4 relative">
                          <FiCheck className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">Batch Completed</h4>
                          <p className="text-sm text-gray-600">{formatDate(batch.endTime)}</p>
                          <p className="text-sm text-gray-600">
                            Actual Quantity: {batch.batchQuantity} units
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Time Statistics */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {batch.startTime ? Math.floor((new Date() - new Date(batch.startTime)) / (1000 * 60 * 60)) : 0}
                    </div>
                    <div className="text-sm text-gray-600">Hours Elapsed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {batch.expectedCompletionTime 
                        ? Math.max(0, Math.floor((new Date(batch.expectedCompletionTime) - new Date()) / (1000 * 60 * 60)))
                        : batch.startTime ? 48 - Math.floor((new Date() - new Date(batch.startTime)) / (1000 * 60 * 60)) : 48
                      }
                    </div>
                    <div className="text-sm text-gray-600">Hours Remaining</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Quick Actions & Details */}
        <div className="space-y-8">
          {/* Employee Assignment Card */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiUser className="mr-2" />
                Assigned Employee
              </h2>
            </div>
            
            <div className="p-6">
              {batch.assignedEmployee ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                      <span className="text-blue-800 font-bold">
                        {batch.assignedEmployee.fullName?.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{batch.assignedEmployee.fullName}</div>
                      <div className="text-sm text-gray-500">@{batch.assignedEmployee.username}</div>
                      <div className="text-xs text-gray-500">{batch.assignedEmployee.role}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Assigned Since:</span>
                      <span className="font-medium">{formatDate(batch.startTime)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Workload:</span>
                      <span className="font-medium text-blue-700">3 active batches</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <FiUsers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No employee assigned</p>
                  <p className="text-sm text-gray-500 mb-4">Assign an employee to start production</p>
                  <button
                    onClick={() => navigate(`/batch/${id}/assign`)}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    Assign Employee
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <FiActivity className="mr-2" />
                Quick Actions
              </h2>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {batch.status === 'PENDING' && (
                  <button
                    onClick={() => navigate(`/batch/${id}/assign`)}
                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                  >
                    <FiPlay className="mr-2" />
                    Start Production
                  </button>
                )}
                
                {(batch.status === 'IN_PROGRESS' || batch.status === 'DELAYED') && (
                  <>
                    <button
                      onClick={() => setCompleting(true)}
                      className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center justify-center"
                    >
                      <FiCheck className="mr-2" />
                      Complete Batch
                    </button>
                    
                    <button
                      onClick={() => navigate(`/batch/${id}/assign`)}
                      className="w-full px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition flex items-center justify-center"
                    >
                      <FiEdit2 className="mr-2" />
                      Reassign Employee
                    </button>
                  </>
                )}
                
                {(batch.status === 'PENDING' || batch.status === 'IN_PROGRESS') && (
                  <button
                    onClick={handleCancel}
                    className="w-full px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition flex items-center justify-center"
                  >
                    <FiX className="mr-2" />
                    Cancel Batch
                  </button>
                )}
                
                <button
                  onClick={() => setEditing(true)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition flex items-center justify-center"
                >
                  <FiEdit2 className="mr-2" />
                  Edit Batch Details
                </button>
              </div>
            </div>
          </div>

          {/* Batch Items Card */}
          {batch.batchItems && batch.batchItems.length > 0 && (
            <div className="card">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <FiArchive className="mr-2" />
                  Batch Items ({batch.batchItems.length})
                </h2>
              </div>
              
              <div className="p-6">
                <div className="space-y-3">
                  {batch.batchItems.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div>
                        <div className="font-medium text-gray-900 text-sm">{item.part?.partNumber}</div>
                        <div className="text-xs text-gray-500">{item.part?.partName}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900 text-sm">
                          {item.quantityUsed}/{item.quantityRequired}
                        </div>
                        <div className={`text-xs ${item.isIssued ? 'text-green-600' : 'text-yellow-600'}`}>
                          {item.isIssued ? 'Issued' : 'Pending'}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {batch.batchItems.length > 3 && (
                    <button
                      onClick={() => navigate(`/batch/${id}/items`)}
                      className="w-full text-center text-blue-600 hover:text-blue-800 text-sm font-medium py-2"
                    >
                      View All {batch.batchItems.length} Items
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Edit Batch Details</h2>
              <button
                onClick={() => setEditing(false)}
                className="text-gray-400 hover:text-gray-500 p-1 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                  rows="3"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add notes about this batch..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  value={editForm.priority}
                  onChange={(e) => setEditForm({...editForm, priority: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center disabled:opacity-50"
                >
                  {updating ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiSave className="mr-2" />
                  )}
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {completing && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Complete Batch</h2>
              <button
                onClick={() => setCompleting(false)}
                className="text-gray-400 hover:text-gray-500 p-1 transition-colors"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Actual Quantity Produced *
                </label>
                <input
                  type="number"
                  value={completeForm.actualQuantity}
                  onChange={(e) => setCompleteForm({...completeForm, actualQuantity: e.target.value})}
                  min="1"
                  max={batch.batchQuantity * 2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter actual quantity"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Planned: {batch.batchQuantity} units
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Notes
                </label>
                <textarea
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm({...completeForm, notes: e.target.value})}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Add completion notes..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Completion Time
                </label>
                <input
                  type="datetime-local"
                  value={completeForm.completionTime}
                  onChange={(e) => setCompleteForm({...completeForm, completionTime: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCompleting(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completing || !completeForm.actualQuantity}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center disabled:opacity-50"
                >
                  {completing ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiCheck className="mr-2" />
                  )}
                  {completing ? 'Completing...' : 'Complete Batch'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};