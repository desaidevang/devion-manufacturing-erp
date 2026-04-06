// src/pages/batch/BatchCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSave, FiX, FiCheck, FiAlertCircle, FiPackage,
  FiLayers, FiGrid, FiSearch, FiRefreshCw, FiBox,
  FiUsers, FiClock, FiTarget, FiCheckCircle, FiTrendingUp
} from 'react-icons/fi';
import BatchService from '../../services/batchService';
import ProductService from '../../services/productService';
import { toast } from 'react-hot-toast';
import { LoadingSpinner } from '../../components/LoadingSpinner';

export const BatchCreate = () => {
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState({
    batchCode: '',
    productId: '',
    batchQuantity: 1,
    priority: 'MEDIUM',
    notes: '',
    manualBatchName: ''
  });

  // Available data
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [stockCheck, setStockCheck] = useState(null);
  const [checkingStock, setCheckingStock] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Priority options
  const priorityOptions = [
    { value: 'LOW', label: 'Low Priority', color: 'text-gray-600', bg: 'bg-gray-100' },
    { value: 'MEDIUM', label: 'Medium Priority', color: 'text-blue-600', bg: 'bg-blue-100' },
    { value: 'HIGH', label: 'High Priority', color: 'text-orange-600', bg: 'bg-orange-100' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' }
  ];

  // Auto-generate batch code if manual name provided
  useEffect(() => {
    if (formData.manualBatchName) {
      const code = generateBatchCode(formData.manualBatchName);
      setFormData(prev => ({ ...prev, batchCode: code }));
    }
  }, [formData.manualBatchName]);

  // Generate batch code
  const generateBatchCode = (name) => {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const nameCode = name.substring(0, 3).toUpperCase();
    
    return `${year}${month}${day}-${nameCode}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
  };

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await ProductService.getActiveProducts();
      setProducts(response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors and stock check
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
    
    // Clear stock check if product or quantity changes
    if (name === 'productId' || name === 'batchQuantity') {
      setStockCheck(null);
    }
  };

  // Handle priority selection
  const handlePrioritySelect = (priority) => {
    setFormData(prev => ({ ...prev, priority }));
  };

  // Check stock availability
  const checkStock = async () => {
    if (!formData.productId || !formData.batchQuantity || formData.batchQuantity < 1) {
      toast.error('Please select a product and quantity first');
      return;
    }

    setCheckingStock(true);
    try {
      const response = await BatchService.preCheckStock(
        formData.productId,
        formData.batchQuantity
      );
      setStockCheck(response.data);
      
      if (!response.data.hasSufficientStock) {
        toast.error('Insufficient stock available');
      } else {
        toast.success('Sufficient stock available');
      }
    } catch (error) {
      console.error('Error checking stock:', error);
      toast.error('Failed to check stock availability');
    } finally {
      setCheckingStock(false);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.batchCode.trim()) {
      newErrors.batchCode = 'Batch code is required';
    }
    
    if (!formData.productId) {
      newErrors.productId = 'Please select a product';
    }
    
    if (!formData.batchQuantity || formData.batchQuantity < 1) {
      newErrors.batchQuantity = 'Quantity must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    // Check stock if not already checked
    if (!stockCheck || !stockCheck.hasSufficientStock) {
      const proceed = window.confirm(
        'Stock availability not verified. Do you want to check stock before creating batch?'
      );
      if (proceed) {
        await checkStock();
        return;
      }
    }

    setLoading(true);
    try {
      const batchData = {
        batchCode: formData.batchCode,
   productId: formData.productId ? Number(formData.productId) : null,
        batchQuantity: parseInt(formData.batchQuantity),
        priority: formData.priority,
        notes: formData.notes,
        manualBatchName: formData.manualBatchName || null
      };

      const response = await BatchService.createBatch(batchData);
      
      toast.success('✅ Batch created successfully!');
      navigate(`/batch/${response.data.id}`);
    } catch (error) {
      console.error('Error creating batch:', error);
      
      let errorMessage = 'Failed to create batch';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/batch/dashboard');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product =>
    product.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected product
  const selectedProduct = products.find(p => p.id === parseInt(formData.productId));

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiLayers className="mr-3 text-blue-700" />
              Create New Production Batch
            </h1>
            <p className="text-gray-600 mt-2">
              Create a new production batch with automatic stock validation
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
            <FiPackage className="w-5 h-5 text-blue-700" />
            <span className="text-sm font-medium text-blue-800">Batch Production</span>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 to-green-400 rounded-full"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <FiBox className="mr-2" />
            Batch Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Manual Batch Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Name (Optional)
              </label>
              <input
                type="text"
                name="manualBatchName"
                value={formData.manualBatchName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., A1, A2, BATCH-001"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave empty for auto-generated name
              </p>
            </div>

            {/* Batch Code (Auto-generated) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Batch Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="batchCode"
                value={formData.batchCode}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.batchCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Auto-generated batch code"
              />
              {errors.batchCode && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.batchCode}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Unique identifier for this batch
              </p>
            </div>

            {/* Product Search */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product <span className="text-red-500">*</span>
              </label>
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              
              <select
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.productId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a product...</option>
                {filteredProducts.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.productCode} - {product.productName}
                  </option>
                ))}
              </select>
              {errors.productId && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.productId}
                </p>
              )}
            </div>

            {/* Product Details */}
            {selectedProduct && (
              <div className="md:col-span-2 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{selectedProduct.productName}</h3>
                  <span className="text-sm text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    {selectedProduct.productCode}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{selectedProduct.description}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-gray-700">
                    <FiPackage className="inline mr-1" />
                    UOM: {selectedProduct.uom}
                  </span>
                  {selectedProduct.hasBom && (
                    <span className="text-green-700">
                      <FiGrid className="inline mr-1" />
                      BOM Available
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Batch Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="batchQuantity"
                value={formData.batchQuantity}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.batchQuantity ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.batchQuantity && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.batchQuantity}
                </p>
              )}
            </div>

            {/* Priority Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handlePrioritySelect(option.value)}
                    className={`p-3 rounded-lg border transition-all ${
                      formData.priority === option.value
                        ? `${option.bg} border-blue-500 ring-2 ring-blue-200`
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-center">
                      <div className={`text-lg font-bold ${option.color} mb-1`}>
                        {option.value.charAt(0)}
                      </div>
                      <div className="text-xs text-gray-700">{option.label.split(' ')[0]}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Add any special instructions or notes for this batch..."
              />
            </div>
          </div>
        </div>

        {/* Stock Validation Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiCheckCircle className="mr-2 text-green-600" />
              Stock Availability Check
            </h2>
            <button
              type="button"
              onClick={checkStock}
              disabled={!formData.productId || !formData.batchQuantity || checkingStock}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingStock ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Checking...
                </>
              ) : (
                <>
                  <FiRefreshCw className="mr-2" />
                  Check Stock
                </>
              )}
            </button>
          </div>

          {stockCheck ? (
            <div className={`p-4 rounded-lg ${
              stockCheck.hasSufficientStock 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center mb-3">
                {stockCheck.hasSufficientStock ? (
                  <FiCheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <FiAlertCircle className="w-5 h-5 text-red-600 mr-2" />
                )}
                <h3 className="font-medium text-gray-900">
                  {stockCheck.hasSufficientStock ? 'Sufficient Stock Available' : 'Insufficient Stock'}
                </h3>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">{stockCheck.message}</p>
              
              {stockCheck.partStockStatus && stockCheck.partStockStatus.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-gray-900">Stock Details:</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Part</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Required</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Available</th>
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {stockCheck.partStockStatus.map((part) => (
                          <tr key={part.partId}>
                            <td className="px-3 py-2 text-sm text-gray-900">
                              <div className="font-medium">{part.partNumber}</div>
                              <div className="text-xs text-gray-500">{part.partName}</div>
                            </td>
                            <td className="px-3 py-2 text-sm text-gray-900">{part.requiredQuantity}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{part.availableStock}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                part.hasSufficientStock
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {part.hasSufficientStock ? '✓ OK' : `Short: ${part.shortage}`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <FiPackage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">Stock check not performed yet</p>
              <p className="text-sm text-gray-500 mt-1">
                Click "Check Stock" to verify availability before creating batch
              </p>
            </div>
          )}
          
          {stockCheck && !stockCheck.hasSufficientStock && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-700">
                <FiAlertCircle className="inline mr-1" />
                Warning: Insufficient stock. You cannot create batch until stock is available.
              </p>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <FiTarget className="mr-2" />
            Batch Summary
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Batch Code:</span>
                <span className="font-medium text-gray-900">{formData.batchCode || 'Auto-generated'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Product:</span>
                <span className="font-medium text-gray-900">
                  {selectedProduct ? selectedProduct.productName : 'Not selected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span className="font-medium text-gray-900">{formData.batchQuantity} units</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Priority:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  priorityOptions.find(p => p.value === formData.priority)?.bg || 'bg-blue-100'
                } ${priorityOptions.find(p => p.value === formData.priority)?.color || 'text-blue-800'}`}>
                  {formData.priority}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Stock Status:</span>
                <span className={`font-medium ${
                  stockCheck?.hasSufficientStock 
                    ? 'text-green-700' 
                    : stockCheck === null 
                    ? 'text-gray-700' 
                    : 'text-red-700'
                }`}>
                  {stockCheck?.hasSufficientStock 
                    ? '✓ Available' 
                    : stockCheck === null 
                    ? 'Not checked' 
                    : '✗ Insufficient'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Auto Stock Deduction:</span>
                <span className="font-medium text-green-700">✓ Enabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status After Creation:</span>
                <span className="font-medium text-yellow-700">PENDING</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Time Limit:</span>
                <span className="font-medium text-blue-700">48 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center"
            disabled={loading}
          >
            <FiX className="mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || (stockCheck && !stockCheck.hasSufficientStock)}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-green-700 transition flex items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Creating...
              </>
            ) : (
              <>
                <FiSave className="mr-2" />
                Create Batch
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};