// src/pages/ProductCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSave, FiX, FiCheck, FiAlertCircle, 
  FiPackage, FiGrid, FiList, FiLink,
  FiPlus, FiSearch, FiRefreshCw, FiBox,
  FiTrash2, FiEdit2
} from 'react-icons/fi';
import ProductService from '../../services/productService';
import PartService from '../../services/partService';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const ProductCreate = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Product data state
  const [productData, setProductData] = useState({
    productCode: '',
    productName: '',
    description: '',
    uom: 'PCS',
    bomItems: []
  });

  // BOM item state for form
  const [bomItem, setBomItem] = useState({
    partId: '',
    quantityRequired: 1,
    sequenceNumber: 0,
    isOptional: false,
    notes: ''
  });

  // State variables
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableParts, setAvailableParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingParts, setLoadingParts] = useState(false);

  // Fetch available parts on component mount
  useEffect(() => {
    fetchAvailableParts();
  }, []);

  const fetchAvailableParts = async () => {
    setLoadingParts(true);
    try {
      const response = await PartService.getActiveParts();
      setAvailableParts(response.data);
    } catch (error) {
      console.error('Error fetching parts:', error);
      toast.error('Failed to load parts');
    } finally {
      setLoadingParts(false);
    }
  };

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Handle BOM item changes
  const handleBomItemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBomItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Add BOM item to product
  const addBomItem = () => {
    if (!bomItem.partId) {
      toast.error('Please select a part');
      return;
    }

    const selectedPart = availableParts.find(p => p.id === parseInt(bomItem.partId));
    if (!selectedPart) {
      toast.error('Selected part not found');
      return;
    }

    // Check if part already exists in BOM
    const alreadyExists = productData.bomItems.some(item => item.partId === bomItem.partId);
    if (alreadyExists) {
      toast.error('This part is already in the BOM');
      return;
    }

    const newBomItem = {
      ...bomItem,
      partId: parseInt(bomItem.partId),
      quantityRequired: parseInt(bomItem.quantityRequired),
      sequenceNumber: parseInt(bomItem.sequenceNumber) || productData.bomItems.length
    };

    setProductData(prev => ({
      ...prev,
      bomItems: [...prev.bomItems, newBomItem]
    }));

    // Reset BOM item form
    setBomItem({
      partId: '',
      quantityRequired: 1,
      sequenceNumber: productData.bomItems.length + 1,
      isOptional: false,
      notes: ''
    });
  };

  // Remove BOM item
  const removeBomItem = (index) => {
    const newBomItems = [...productData.bomItems];
    newBomItems.splice(index, 1);
    setProductData(prev => ({
      ...prev,
      bomItems: newBomItems
    }));
  };

  // Update BOM item
  const updateBomItem = (index, updatedItem) => {
    const newBomItems = [...productData.bomItems];
    newBomItems[index] = updatedItem;
    setProductData(prev => ({
      ...prev,
      bomItems: newBomItems
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!productData.productCode.trim()) {
      newErrors.productCode = 'Product code is required';
    } else if (productData.productCode.length < 3) {
      newErrors.productCode = 'Product code must be at least 3 characters';
    }
    
    if (!productData.productName.trim()) {
      newErrors.productName = 'Product name is required';
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
  
  setLoading(true);
  try {
    // Prepare data for API
    const requestData = {
      productCode: productData.productCode.trim(),
      productName: productData.productName.trim(),
      description: productData.description?.trim() || '',
      uom: productData.uom || 'PCS',
      bomItems: productData.bomItems.length > 0 ? productData.bomItems : null
    };
    
    console.log('Creating product with data:', JSON.stringify(requestData, null, 2));
    
    const response = await ProductService.createProduct(requestData);
    console.log('Response:', response.data);
    
    toast.success('✅ Product created successfully!');
    navigate('/product/manage');
  } catch (error) {
  console.error('Full error object:', error);
  console.error('Error response:', error.response?.data);
  console.error('Error status:', error.response?.status);
  console.error('Error headers:', error.response?.headers);
  
  let errorMessage = 'Failed to create product';
  
  // Handle different types of error responses
  if (error.response?.data) {
    const errorData = error.response.data;
    
    // If error is an object with "error" property
    if (typeof errorData === 'object' && errorData.error) {
      errorMessage = errorData.error;
      
      // Check for duplicate constraint
      if (errorMessage.includes && errorMessage.includes('duplicate key')) {
        if (errorMessage.includes('product_bom_items')) {
          errorMessage = 'Cannot add the same part twice to BOM. Each part can only appear once in the Bill of Materials.';
        } else if (errorMessage.includes('products')) {
          errorMessage = 'Product code already exists. Please use a different code.';
        }
      }
    } 
    // If error is a string
    else if (typeof errorData === 'string') {
      errorMessage = errorData;
    }
    // If error is the entire object
    else if (typeof errorData === 'object') {
      // Try to get message from validation errors
      if (errorData.message) {
        errorMessage = errorData.message;
      } else {
        // Convert object to string for display
        errorMessage = JSON.stringify(errorData);
      }
    }
  } else if (error.message) {
    errorMessage = error.message;
  }
  
  toast.error(errorMessage);
  
  // Set form errors if validation failed
  if (error.response?.status === 400 && error.response?.data?.errors) {
    const validationErrors = {};
    error.response.data.errors.forEach(err => {
      if (err.field) {
        validationErrors[err.field] = err.defaultMessage;
      }
    });
    setErrors(validationErrors);
  }
} finally {
    setLoading(false);
  }
};


  // Handle cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/product/manage');
    }
  };

  // Filter parts based on search
  const filteredParts = availableParts.filter(part =>
    part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    part.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Unit of measurement options
  const uomOptions = [
    { value: 'PCS', label: 'Pieces (PCS)' },
    { value: 'EA', label: 'Each (EA)' },
    { value: 'SET', label: 'Set (SET)' },
    { value: 'KIT', label: 'Kit (KIT)' },
    { value: 'KG', label: 'Kilogram (KG)' },
    { value: 'M', label: 'Meter (M)' },
    { value: 'L', label: 'Liter (L)' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiPackage className="mr-3 text-blue-700" />
              Create New Product
            </h1>
            <p className="text-gray-600 mt-2">
              Define new product with optional Bill of Materials
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-green-50 rounded-lg">
            <FiPackage className="w-5 h-5 text-green-700" />
            <span className="text-sm font-medium text-green-800">Product Master</span>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-green-600 to-blue-400 rounded-full"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <FiPackage className="mr-2" />
            Product Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="productCode"
                value={productData.productCode}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.productCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., PROD-001"
              />
              {errors.productCode && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.productCode}
                </p>
              )}
            </div>

            {/* Product Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="productName"
                value={productData.productName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.productName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Final Assembly"
              />
              {errors.productName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.productName}
                </p>
              )}
            </div>

            {/* Unit of Measurement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit of Measurement
              </label>
              <select
                name="uom"
                value={productData.uom}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {uomOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={productData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Describe the product, its purpose, and specifications..."
              />
            </div>
          </div>
        </div>

        {/* Bill of Materials Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiBox className="mr-2" />
              Bill of Materials (Optional)
            </h2>
            <div className="text-sm text-gray-500">
              {productData.bomItems.length} item(s) added
            </div>
          </div>

          {/* Add BOM Item Form */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
              <FiPlus className="mr-2 text-blue-600" />
              Add Component to BOM
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Part Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Part <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search parts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Part Dropdown */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Part
                </label>
                <select
                  name="partId"
                  value={bomItem.partId}
                  onChange={handleBomItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a part...</option>
                  {filteredParts.map(part => (
                    <option key={part.id} value={part.id}>
                      {part.partNumber} - {part.partName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Quantity */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Quantity Required
                </label>
                <input
                  type="number"
                  name="quantityRequired"
                  value={bomItem.quantityRequired}
                  onChange={handleBomItemChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Sequence */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sequence
                </label>
                <input
                  type="number"
                  name="sequenceNumber"
                  value={bomItem.sequenceNumber}
                  onChange={handleBomItemChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  value={bomItem.notes}
                  onChange={handleBomItemChange}
                  placeholder="Optional notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              {/* Optional Checkbox */}
              <div className="flex items-center">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="isOptional"
                    checked={bomItem.isOptional}
                    onChange={handleBomItemChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Optional Component
                  </span>
                </label>
              </div>
            </div>
            
            {/* Add Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addBomItem}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center"
              >
                <FiPlus className="mr-2" />
                Add to BOM
              </button>
            </div>
          </div>

          {/* BOM Items List */}
          {productData.bomItems.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <h4 className="text-sm font-medium text-gray-800">
                  BOM Items ({productData.bomItems.length})
                </h4>
              </div>
              <div className="divide-y divide-gray-200">
                {productData.bomItems.map((item, index) => {
                  const part = availableParts.find(p => p.id === item.partId);
                  return (
                    <div key={index} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {item.isOptional ? (
                              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full mr-2">
                                Optional
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mr-2">
                                Required
                              </span>
                            )}
                            <span className="text-sm font-medium text-gray-900 mr-2">
                              Seq: {item.sequenceNumber}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="ml-2 text-sm font-medium text-gray-900">
                              Qty: {item.quantityRequired}
                            </span>
                          </div>
                          {part && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-900">
                                {part.partNumber} - {part.partName}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {part.description || 'No description'}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-blue-600 mt-1">
                                  📝 {item.notes}
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => removeBomItem(index)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                            title="Remove"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
              <FiBox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No BOM items added</p>
              <p className="text-sm text-gray-500 mt-1">
                BOM is optional. You can add components later.
              </p>
            </div>
          )}
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
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-blue-700 transition flex items-center shadow-lg disabled:opacity-50"
          >
            <FiSave className="mr-2" />
            {loading ? 'Creating...' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductCreate;