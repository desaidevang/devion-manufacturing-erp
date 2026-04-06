// src/pages/ProductEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FiSave, FiX, FiCheck, FiAlertCircle, 
  FiPackage, FiGrid, FiList, FiBox,
  FiPlus, FiSearch, FiRefreshCw, FiTrash2,
  FiEdit2, FiArrowLeft
} from 'react-icons/fi';
import ProductService from '../../services/productService';
import PartService from '../../services/partService';
import { toast } from 'react-toastify';

const ProductEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Product data state
  const [productData, setProductData] = useState({
    productCode: '',
    productName: '',
    description: '',
    uom: 'PCS',
    isActive: true,
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [availableParts, setAvailableParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingParts, setLoadingParts] = useState(false);

  // Fetch product details and available parts
  useEffect(() => {
    fetchProductAndParts();
  }, [id]);

  const fetchProductAndParts = async () => {
    setLoading(true);
    try {
      // Fetch product details
      const productResponse = await ProductService.getProductById(id);
      const product = productResponse.data;
      
      setProductData({
        productCode: product.productCode,
        productName: product.productName,
        description: product.description || '',
        uom: product.uom || 'PCS',
        isActive: product.isActive,
        bomItems: product.bomItems || []
      });

      // Fetch BOM details
      const bomResponse = await ProductService.getProductBom(id);
      if (bomResponse.data) {
        setProductData(prev => ({
          ...prev,
          bomItems: bomResponse.data
        }));
      }

      // Fetch available parts
      await fetchAvailableParts();
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
      navigate('/product/manage');
    } finally {
      setLoading(false);
    }
  };

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
    const alreadyExists = productData.bomItems.some(item => item.partId === parseInt(bomItem.partId));
    if (alreadyExists) {
      toast.error('This part is already in the BOM');
      return;
    }

    const newBomItem = {
      ...bomItem,
      partId: parseInt(bomItem.partId),
      quantityRequired: parseInt(bomItem.quantityRequired),
      sequenceNumber: parseInt(bomItem.sequenceNumber) || productData.bomItems.length,
      // Remove id for new items
      id: undefined
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
    const itemToRemove = newBomItems[index];
    
    // Mark for deletion if it has an ID (existing item)
    if (itemToRemove.id) {
      newBomItems[index] = { ...itemToRemove, delete: true };
    } else {
      newBomItems.splice(index, 1);
    }
    
    setProductData(prev => ({
      ...prev,
      bomItems: newBomItems
    }));
  };

  // Update BOM item
  const updateBomItem = (index, field, value) => {
    const newBomItems = [...productData.bomItems];
    newBomItems[index] = {
      ...newBomItems[index],
      [field]: field === 'quantityRequired' || field === 'sequenceNumber' 
        ? parseInt(value) || 0 
        : value
    };
    
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
    
    setSaving(true);
    try {
      // Prepare data for API - separate update and BOM data
      const updateData = {
        productName: productData.productName,
        description: productData.description || '',
        uom: productData.uom || 'PCS',
        isActive: productData.isActive,
        bomItems: productData.bomItems.map(item => ({
          id: item.id,
          partId: item.partId,
          quantityRequired: item.quantityRequired,
          sequenceNumber: item.sequenceNumber,
          isOptional: item.isOptional,
          notes: item.notes,
          delete: item.delete || false
        }))
      };
      
      console.log('Updating product:', updateData);
      await ProductService.updateProduct(id, updateData);
      
      toast.success('✅ Product updated successfully!');
      navigate(`/product/view/${id}`);
    } catch (error) {
      console.error('Error updating product:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data ||
                          error.message ||
                          'Failed to update product';
      
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate(`/product/view/${id}`);
    }
  };

  // Handle BOM management separately
  const handleBomUpdate = async () => {
    try {
      // Prepare BOM items for API
      const bomItemsForApi = productData.bomItems
        .filter(item => !item.delete)
        .map(item => ({
          partId: item.partId,
          quantityRequired: item.quantityRequired,
          sequenceNumber: item.sequenceNumber,
          isOptional: item.isOptional,
          notes: item.notes
        }));
      
      await ProductService.manageBom(id, bomItemsForApi);
      toast.success('✅ BOM updated successfully!');
      fetchProductAndParts(); // Refresh data
    } catch (error) {
      console.error('Error updating BOM:', error);
      toast.error('Failed to update BOM');
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/product/view/${id}`)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg mr-4 transition"
            >
              <FiArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <FiEdit2 className="mr-3 text-blue-700" />
                Edit Product: {productData.productCode}
              </h1>
              <p className="text-gray-600 mt-2">
                Update product information and BOM
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-yellow-50 rounded-lg">
            <FiEdit2 className="w-5 h-5 text-yellow-700" />
            <span className="text-sm font-medium text-yellow-800">Edit Mode</span>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-yellow-600 to-blue-400 rounded-full"></div>
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
            {/* Product Code (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Code
              </label>
              <input
                type="text"
                value={productData.productCode}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">Product code cannot be changed</p>
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

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isActive"
                    checked={productData.isActive}
                    onChange={() => setProductData(prev => ({ ...prev, isActive: true }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isActive"
                    checked={!productData.isActive}
                    onChange={() => setProductData(prev => ({ ...prev, isActive: false }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inactive</span>
                </label>
              </div>
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
              Bill of Materials
            </h2>
            <div className="text-sm text-gray-500">
              {productData.bomItems.filter(item => !item.delete).length} item(s)
            </div>
          </div>

          {/* Add BOM Item Form */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-md font-medium text-gray-800 mb-4 flex items-center">
              <FiPlus className="mr-2 text-blue-600" />
              Add New Component
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              {/* Part Search */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Search Parts
                </label>
                <div className="relative">
                  <FiSearch className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* Part Selection */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Select Part <span className="text-red-500">*</span>
                </label>
                <select
                  name="partId"
                  value={bomItem.partId}
                  onChange={handleBomItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Choose part...</option>
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
                  Quantity
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
                disabled={!bomItem.partId}
              >
                <FiPlus className="mr-2" />
                Add to BOM
              </button>
            </div>
          </div>

          {/* BOM Items List */}
          {productData.bomItems.filter(item => !item.delete).length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-800">
                    Current BOM Items
                  </h4>
                  <button
                    type="button"
                    onClick={handleBomUpdate}
                    className="px-3 py-1 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition"
                  >
                    Save BOM Changes
                  </button>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {productData.bomItems
                  .filter(item => !item.delete)
                  .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0))
                  .map((item, index) => {
                    const part = availableParts.find(p => p.id === item.partId);
                    return (
                      <div key={index} className="px-4 py-3 hover:bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center mb-2">
                              {item.isOptional ? (
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full mr-2">
                                  Optional
                                </span>
                              ) : (
                                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full mr-2">
                                  Required
                                </span>
                              )}
                              
                              <div className="flex items-center space-x-4">
                                <div>
                                  <label className="text-xs text-gray-600 mr-2">Sequence:</label>
                                  <input
                                    type="number"
                                    value={item.sequenceNumber || 0}
                                    onChange={(e) => updateBomItem(index, 'sequenceNumber', e.target.value)}
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                                
                                <div>
                                  <label className="text-xs text-gray-600 mr-2">Quantity:</label>
                                  <input
                                    type="number"
                                    value={item.quantityRequired || 1}
                                    onChange={(e) => updateBomItem(index, 'quantityRequired', e.target.value)}
                                    min="1"
                                    className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {part && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-gray-900">
                                  {part.partNumber} - {part.partName}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {part.description || 'No description'}
                                </p>
                                <div className="mt-2">
                                  <label className="text-xs text-gray-600 mr-2">Notes:</label>
                                  <input
                                    type="text"
                                    value={item.notes || ''}
                                    onChange={(e) => updateBomItem(index, 'notes', e.target.value)}
                                    placeholder="Add notes..."
                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm mt-1"
                                  />
                                </div>
                                <div className="mt-2 flex items-center">
                                  <label className="flex items-center text-xs text-gray-700">
                                    <input
                                      type="checkbox"
                                      checked={item.isOptional || false}
                                      onChange={(e) => updateBomItem(index, 'isOptional', e.target.checked)}
                                      className="h-3 w-3 text-blue-600 mr-1"
                                    />
                                    Optional Component
                                  </label>
                                </div>
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
            <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200 mb-4">
              <FiBox className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No BOM items defined</p>
              <p className="text-sm text-gray-500 mt-1">
                Add components to create a Bill of Materials
              </p>
            </div>
          )}

          {/* Deleted Items (if any) */}
          {productData.bomItems.filter(item => item.delete).length > 0 && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="text-sm font-medium text-red-800 mb-2">
                Items marked for removal ({productData.bomItems.filter(item => item.delete).length})
              </h4>
              <p className="text-xs text-red-600">
                These items will be removed when you save the BOM changes.
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
            disabled={saving}
          >
            <FiX className="mr-2" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center shadow-lg disabled:opacity-50"
          >
            <FiSave className="mr-2" />
            {saving ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductEdit;