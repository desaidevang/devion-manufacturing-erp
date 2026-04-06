// src/pages/batch/BatchComplete.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  FiCheckCircle, FiClock, FiPackage, FiUser, 
  FiAlertTriangle, FiUpload, FiSave, FiArrowLeft,
  FiCalendar, FiCheckSquare, FiXCircle, FiFileText,
  FiBarChart2, FiPercent, FiHash, FiInfo
} from 'react-icons/fi';
import BatchService from '../../services/batchService';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const BatchComplete = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [batch, setBatch] = useState(null);
  const [formData, setFormData] = useState({
    completedQuantity: '',
    actualHours: '',
    qualityStatus: 'PASS',
    defects: '',
    notes: '',
    qualityCheck: {
      visualInspection: false,
      functionalTest: false,
      dimensionCheck: false,
      weightCheck: false,
      packagingCheck: false
    }
  });
  const [defectsList, setDefectsList] = useState([]);
  const [showDefectModal, setShowDefectModal] = useState(false);
  const [newDefect, setNewDefect] = useState({
    type: '',
    quantity: '',
    description: '',
    severity: 'LOW'
  });
  const [qualityStats, setQualityStats] = useState({
    totalProduced: 0,
    passed: 0,
    failed: 0,
    yieldRate: 100
  });

  // Load batch data
  useEffect(() => {
    const loadBatchData = async () => {
      try {
        setLoading(true);
        const response = await BatchService.getBatchById(id);
        const batchData = response.data;
        
        setBatch(batchData);
        
        // Initialize form with batch data
        setFormData(prev => ({
          ...prev,
          completedQuantity: batchData.batchQuantity || '',
          actualHours: '',
          qualityStatus: 'PASS',
          defects: '',
          notes: ''
        }));

        // Calculate default quality stats
        const total = parseInt(batchData.batchQuantity) || 0;
        setQualityStats({
          totalProduced: total,
          passed: total,
          failed: 0,
          yieldRate: 100
        });

      } catch (error) {
        console.error('Error loading batch:', error);
        toast.error('Failed to load batch data');
        navigate('/batch/status');
      } finally {
        setLoading(false);
      }
    };

    loadBatchData();
  }, [id, navigate]);

  // Handle form changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('qualityCheck.')) {
      const checkName = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        qualityCheck: {
          ...prev.qualityCheck,
          [checkName]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Update quality stats when completed quantity changes
    if (name === 'completedQuantity') {
      const total = parseInt(value) || 0;
      const passed = total - defectsList.reduce((sum, defect) => sum + parseInt(defect.quantity || 0), 0);
      const failed = total - passed;
      const yieldRate = total > 0 ? Math.round((passed / total) * 100) : 100;
      
      setQualityStats({
        totalProduced: total,
        passed,
        failed,
        yieldRate
      });
    }
  };

  // Handle defect management
  const handleAddDefect = () => {
    if (!newDefect.type || !newDefect.quantity || !newDefect.description) {
      toast.error('Please fill all defect fields');
      return;
    }

    const updatedDefects = [...defectsList, { ...newDefect, id: Date.now() }];
    setDefectsList(updatedDefects);
    
    // Update form data
    const totalDefects = updatedDefects.reduce((sum, defect) => sum + parseInt(defect.quantity || 0), 0);
    setFormData(prev => ({
      ...prev,
      defects: totalDefects
    }));

    // Update quality stats
    const total = parseInt(formData.completedQuantity) || 0;
    const passed = Math.max(0, total - totalDefects);
    const failed = total - passed;
    const yieldRate = total > 0 ? Math.round((passed / total) * 100) : 100;
    
    setQualityStats({
      totalProduced: total,
      passed,
      failed,
      yieldRate
    });

    // Update quality status if defects exceed threshold
    if (totalDefects > 0 && formData.qualityStatus === 'PASS') {
      setFormData(prev => ({
        ...prev,
        qualityStatus: 'PASS_WITH_DEFECTS'
      }));
    }

    // Clear defect form and close modal
    setNewDefect({
      type: '',
      quantity: '',
      description: '',
      severity: 'LOW'
    });
    setShowDefectModal(false);
  };

  const handleRemoveDefect = (defectId) => {
    const updatedDefects = defectsList.filter(defect => defect.id !== defectId);
    setDefectsList(updatedDefects);
    
    const totalDefects = updatedDefects.reduce((sum, defect) => sum + parseInt(defect.quantity || 0), 0);
    setFormData(prev => ({
      ...prev,
      defects: totalDefects
    }));

    // Update quality stats
    const total = parseInt(formData.completedQuantity) || 0;
    const passed = total - totalDefects;
    const failed = total - passed;
    const yieldRate = total > 0 ? Math.round((passed / total) * 100) : 100;
    
    setQualityStats({
      totalProduced: total,
      passed,
      failed,
      yieldRate
    });
  };

  // Validate form
  const validateForm = () => {
    if (!formData.completedQuantity || parseInt(formData.completedQuantity) <= 0) {
      toast.error('Please enter a valid completed quantity');
      return false;
    }

    if (parseInt(formData.completedQuantity) > (batch?.batchQuantity || 0)) {
      toast.error('Completed quantity cannot exceed batch quantity');
      return false;
    }

    if (!formData.actualHours || parseInt(formData.actualHours) <= 0) {
      toast.error('Please enter actual hours worked');
      return false;
    }

    // Check if all quality checks are completed
    const qualityChecks = Object.values(formData.qualityCheck);
    const completedChecks = qualityChecks.filter(check => check).length;
    if (completedChecks < 3) {
      toast.error('Please complete at least 3 quality checks');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setSubmitting(true);
      
      // Prepare complete data
      const completeData = {
        completedQuantity: parseInt(formData.completedQuantity),
        actualHours: parseInt(formData.actualHours),
        qualityStatus: formData.qualityStatus,
        defects: defectsList.map(defect => ({
          defectType: defect.type,
          quantity: parseInt(defect.quantity),
          description: defect.description,
          severity: defect.severity
        })),
        qualityChecks: formData.qualityCheck,
        notes: formData.notes,
        qualityMetrics: {
          totalProduced: qualityStats.totalProduced,
          passed: qualityStats.passed,
          failed: qualityStats.failed,
          yieldRate: qualityStats.yieldRate
        }
      };

      // Call batch complete API
      const response = await BatchService.completeBatch(id, completeData);
      
      toast.success('Batch completed successfully!');
      
      // Navigate to batch detail page
      navigate(`/batch/${id}`);
      
    } catch (error) {
      console.error('Error completing batch:', error);
      toast.error(error.response?.data?.message || 'Failed to complete batch');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate time efficiency
  const calculateEfficiency = () => {
    if (!batch?.estimatedHours || !formData.actualHours) return null;
    
    const estimated = parseFloat(batch.estimatedHours);
    const actual = parseFloat(formData.actualHours);
    
    if (actual <= 0) return null;
    
    const efficiency = ((estimated / actual) * 100).toFixed(1);
    return {
      efficiency,
      status: efficiency >= 100 ? 'Above Target' : efficiency >= 90 ? 'On Target' : 'Below Target',
      color: efficiency >= 100 ? 'text-green-600' : efficiency >= 90 ? 'text-yellow-600' : 'text-red-600',
      bgColor: efficiency >= 100 ? 'bg-green-100' : efficiency >= 90 ? 'bg-yellow-100' : 'bg-red-100'
    };
  };

  const efficiency = calculateEfficiency();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading batch data...</span>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="card text-center py-8">
          <FiAlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Batch Not Found</h2>
          <p className="text-gray-600 mb-6">The batch you're trying to complete doesn't exist or has been removed.</p>
          <Link
            to="/batch/status"
            className="btn-primary inline-flex items-center"
          >
            <FiArrowLeft className="mr-2" />
            Back to Status Board
          </Link>
        </div>
      </div>
    );
  }

if (batch.status !== 'IN_PROGRESS' && batch.status !== 'DELAYED') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="card text-center py-8">
          <FiAlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cannot Complete Batch</h2>
          <p className="text-gray-600 mb-4">
            This batch is {batch.status.toLowerCase()} and cannot be completed.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Only batches in "IN_PROGRESS" status can be completed.
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to={`/batch/${id}`}
              className="btn-secondary inline-flex items-center"
            >
              <FiArrowLeft className="mr-2" />
              View Batch
            </Link>
            <Link
              to="/batch/status"
              className="btn-primary inline-flex items-center"
            >
              <FiCheckCircle className="mr-2" />
              Status Board
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center mb-2">
            <Link
              to={`/batch/${id}`}
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <FiArrowLeft className="w-5 h-5 mr-1" />
              Back to Batch
            </Link>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 flex items-center">
            <FiCheckCircle className="mr-3 text-green-600" />
            Complete Batch Production
          </h1>
          <p className="text-gray-600 mt-2">
            Finalize production and record quality metrics for Batch #{batch.batchCode}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {batch.batchCode}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            batch.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
            batch.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
            batch.priority === 'MEDIUM' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {batch.priority} Priority
          </span>
        </div>
      </div>

      {/* Batch Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mr-3">
              <FiPackage className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{batch.product?.productName}</h3>
              <p className="text-sm text-gray-500">{batch.product?.productCode}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Batch Quantity:</span>
              <span className="font-bold text-gray-900">{batch.batchQuantity} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Started:</span>
              <span className="text-gray-900">
                {new Date(batch.startTime).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Assigned To:</span>
              <span className="font-medium text-gray-900">
                {batch.assignedEmployee?.fullName || 'Not assigned'}
              </span>
            </div>
          </div>
        </div>

        {/* Quality Stats */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <FiPercent className="mr-2 text-green-600" />
            Quality Metrics
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm text-gray-600">Yield Rate</span>
                <span className="text-sm font-bold text-green-600">
                  {qualityStats.yieldRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-500"
                  style={{ width: `${qualityStats.yieldRate}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {qualityStats.totalProduced}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {qualityStats.passed}
                </div>
                <div className="text-xs text-gray-500">Passed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {qualityStats.failed}
                </div>
                <div className="text-xs text-gray-500">Defects</div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Efficiency */}
        <div className="card p-6">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center">
            <FiClock className="mr-2 text-blue-600" />
            Time Efficiency
          </h3>
          {efficiency && (
            <div className="space-y-4">
              <div className="text-center">
                <div className={`text-3xl font-bold mb-1 ${efficiency.color}`}>
                  {efficiency.efficiency}%
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${efficiency.bgColor} ${efficiency.color}`}>
                  {efficiency.status}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated:</span>
                  <span className="font-medium">{batch.estimatedHours || 'N/A'} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual:</span>
                  <span className="font-medium">
                    {formData.actualHours || '--'} hours
                  </span>
                </div>
              </div>
            </div>
          )}
          {!efficiency && (
            <div className="text-center py-4">
              <p className="text-gray-500">Enter actual hours to calculate efficiency</p>
            </div>
          )}
        </div>
      </div>

      {/* Completion Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Production Data */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <FiHash className="mr-2" />
                Production Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completed Quantity *
                  </label>
                  <input
                    type="number"
                    name="completedQuantity"
                    value={formData.completedQuantity}
                    onChange={handleInputChange}
                    min="1"
                    max={batch.batchQuantity}
                    className="input-field"
                    placeholder="Enter completed quantity"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Maximum: {batch.batchQuantity} units
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Hours Worked *
                  </label>
                  <input
                    type="number"
                    name="actualHours"
                    value={formData.actualHours}
                    onChange={handleInputChange}
                    min="0.1"
                    step="0.5"
                    className="input-field"
                    placeholder="Enter actual hours"
                    required
                  />
                  {batch.estimatedHours && (
                    <p className="text-sm text-gray-500 mt-1">
                      Estimated: {batch.estimatedHours} hours
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quality Status
                  </label>
                  <select
                    name="qualityStatus"
                    value={formData.qualityStatus}
                    onChange={handleInputChange}
                    className="input-field"
                  >
                    <option value="PASS">Pass - All Units Good</option>
                    <option value="PASS_WITH_DEFECTS">Pass With Minor Defects</option>
                    <option value="FAIL_MAJOR">Fail - Major Defects</option>
                    <option value="FAIL_REWORK">Fail - Requires Rework</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Quality Checks */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <FiCheckSquare className="mr-2" />
                Quality Control Checks *
              </h3>
              
              <div className="space-y-3">
                {Object.entries(formData.qualityCheck).map(([key, value]) => (
                  <div key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`quality-${key}`}
                      name={`qualityCheck.${key}`}
                      checked={value}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor={`quality-${key}`}
                      className="ml-3 text-gray-700 capitalize"
                    >
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                * At least 3 checks must be completed
              </p>
            </div>
          </div>

          {/* Right Column - Defects & Notes */}
          <div className="space-y-6">
            {/* Defects Management */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <FiAlertTriangle className="mr-2 text-yellow-600" />
                  Defects Record
                </h3>
                <button
                  type="button"
                  onClick={() => setShowDefectModal(true)}
                  className="px-4 py-2 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded-lg text-sm font-medium transition"
                >
                  + Add Defect
                </button>
              </div>

              {defectsList.length > 0 ? (
                <div className="space-y-3">
                  {defectsList.map(defect => (
                    <div key={defect.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className={`px-2 py-1 text-xs font-medium rounded ${
                            defect.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                            defect.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {defect.severity}
                          </span>
                          <span className="ml-2 font-medium text-gray-900">
                            {defect.type}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDefect(defect.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <FiXCircle className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{defect.description}</p>
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>Quantity: {defect.quantity}</span>
                        <span>Affects {defect.quantity} units</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <FiCheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-500">No defects recorded</p>
                  <p className="text-sm text-gray-400 mt-1">Click "Add Defect" to record any issues</p>
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="card p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FiFileText className="mr-2" />
                Additional Notes
              </h3>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows="4"
                className="input-field"
                placeholder="Any additional comments, observations, or special instructions..."
              />
              <p className="text-sm text-gray-500 mt-2">
                Optional: Document any production challenges, special handling requirements, or follow-up actions.
              </p>
            </div>

            {/* Completion Summary */}
            <div className="card p-6 bg-green-50 border-green-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <FiCheckCircle className="mr-2 text-green-600" />
                Completion Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-700">Status:</span>
                  <span className="font-bold text-green-700">Ready to Complete</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Quality Yield:</span>
                  <span className="font-bold text-green-700">{qualityStats.yieldRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Defects:</span>
                  <span className={`font-bold ${defectsList.length > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                    {defectsList.length} type(s)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Quality Checks:</span>
                  <span className="font-bold text-blue-700">
                    {Object.values(formData.qualityCheck).filter(Boolean).length}/5 completed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex space-x-4">
            <Link
              to={`/batch/${id}`}
              className="btn-secondary flex items-center"
            >
              <FiArrowLeft className="mr-2" />
              Cancel
            </Link>
            <button
              type="button"
              onClick={() => {
                // Save as draft functionality (if needed)
                toast.success('Progress saved as draft');
              }}
              className="px-6 py-3 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition flex items-center"
            >
              <FiSave className="mr-2" />
              Save Draft
            </button>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary bg-green-600 hover:bg-green-700 flex items-center px-8 py-3"
          >
            {submitting ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Completing...
              </>
            ) : (
              <>
                <FiCheckCircle className="mr-2" />
                Complete Batch
              </>
            )}
          </button>
        </div>
      </form>

      {/* Defect Modal */}
      {showDefectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Add Defect</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Defect Type *
                  </label>
                  <input
                    type="text"
                    value={newDefect.type}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, type: e.target.value }))}
                    className="input-field"
                    placeholder="e.g., Scratch, Crack, Misalignment"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    value={newDefect.quantity}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, quantity: e.target.value }))}
                    className="input-field"
                    min="1"
                    max={formData.completedQuantity || batch.batchQuantity}
                    placeholder="Number of affected units"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={newDefect.description}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, description: e.target.value }))}
                    className="input-field"
                    rows="3"
                    placeholder="Describe the defect..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Severity
                  </label>
                  <select
                    value={newDefect.severity}
                    onChange={(e) => setNewDefect(prev => ({ ...prev, severity: e.target.value }))}
                    className="input-field"
                  >
                    <option value="LOW">Low - Cosmetic only</option>
                    <option value="MEDIUM">Medium - Minor functional issue</option>
                    <option value="HIGH">High - Major functional issue</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowDefectModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddDefect}
                  className="px-4 py-2 bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg"
                >
                  Add Defect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};