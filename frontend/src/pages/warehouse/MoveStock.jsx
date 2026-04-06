// src/pages/warehouse/MoveStock.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiMove, FiMapPin, FiPackage,
   FiCalendar, FiCheckCircle, FiAlertCircle,
  FiCornerDownRight, FiShield, FiLock, FiUnlock,
  FiAlertTriangle, FiArchive, FiRotateCcw, FiTruck
} from 'react-icons/fi';
import WarehouseStockService from '../../services/WarehouseStockService';
import WarehouseLocationService from '../../services/warehouseLocationService';
import { toast } from 'react-toastify';

const MoveStock = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(false);
  const [stock, setStock] = useState(null);
  const [locations, setLocations] = useState([]);
  const [availableQuantity, setAvailableQuantity] = useState(0);
  const [movementType, setMovementType] = useState('TRANSFER');
  const [formData, setFormData] = useState({
    quantity: '',
    toLocationId: '',
    remarks: '',
    reason: ''
  });

  // Define valid statuses based on database constraint
  const validStatuses = {
    ACTIVE: 'ACTIVE',
    QUARANTINE: 'QUARANTINE',
    RESERVED: 'RESERVED',
    BLOCKED: 'BLOCKED',
    EXPIRED: 'EXPIRED',
    SCRAP: 'SCRAP',
    RETURNED: 'RETURNED',
    IN_TRANSIT: 'IN_TRANSIT'
  };

  // Get status display configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case validStatuses.ACTIVE:
        return { color: 'bg-green-100 text-green-800', icon: '✓' };
      case validStatuses.QUARANTINE:
        return { color: 'bg-red-100 text-red-800', icon: '🛡️' };
      case validStatuses.RESERVED:
        return { color: 'bg-yellow-100 text-yellow-800', icon: '🔒' };
      case validStatuses.BLOCKED:
        return { color: 'bg-orange-100 text-orange-800', icon: '⛔' };
      case validStatuses.EXPIRED:
        return { color: 'bg-gray-100 text-gray-800', icon: '📅' };
      case validStatuses.SCRAP:
        return { color: 'bg-gray-200 text-gray-800', icon: '🗑️' };
      case validStatuses.RETURNED:
        return { color: 'bg-blue-100 text-blue-800', icon: '↩️' };
      case validStatuses.IN_TRANSIT:
        return { color: 'bg-purple-100 text-purple-800', icon: '🚚' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: '?' };
    }
  };

  const movementTypes = {
    TRANSFER: {
      label: 'Transfer',
      description: 'Move stock from one location to another',
      icon: <FiCornerDownRight className="w-5 h-5" />,
      color: 'text-blue-600 bg-blue-50',
      requiresDestination: true,
      allowedSourceStatuses: [validStatuses.ACTIVE, validStatuses.RESERVED]
    },
    RESERVE: {
      label: 'Reserve',
      description: 'Reserve stock for specific use',
      icon: <FiLock className="w-5 h-5" />,
      color: 'text-yellow-600 bg-yellow-50',
      requiresDestination: false,
      allowedSourceStatuses: [validStatuses.ACTIVE]
    },
    UNRESERVE: {
      label: 'Unreserve',
      description: 'Remove reservation from stock',
      icon: <FiUnlock className="w-5 h-5" />,
      color: 'text-green-600 bg-green-50',
      requiresDestination: false,
      allowedSourceStatuses: [validStatuses.RESERVED]
    },
    QUARANTINE: {
      label: 'Quarantine',
      description: 'Move stock to quarantine location',
      icon: <FiShield className="w-5 h-5" />,
      color: 'text-red-600 bg-red-50',
      requiresDestination: true,
      allowedSourceStatuses: [validStatuses.ACTIVE, validStatuses.RESERVED]
    },
    RELEASE: {
      label: 'Release from Quarantine',
      description: 'Release stock from quarantine',
      icon: <FiCheckCircle className="w-5 h-5" />,
      color: 'text-purple-600 bg-purple-50',
      requiresDestination: true,
      allowedSourceStatuses: [validStatuses.QUARANTINE],
      // Validate that release destination is not quarantine
      validateDestination: (location) => !location.isQuarantine
    },
    ADJUSTMENT: {
      label: 'Adjustment',
      description: 'Adjust stock quantity',
      icon: <FiPackage className="w-5 h-5" />,
      color: 'text-orange-600 bg-orange-50',
      requiresDestination: false,
      allowedSourceStatuses: Object.values(validStatuses)
    },
    BLOCK: {
      label: 'Block',
      description: 'Block stock for quality issues',
      icon: <FiAlertTriangle className="w-5 h-5" />,
      color: 'text-orange-600 bg-orange-50',
      requiresDestination: false,
      allowedSourceStatuses: [validStatuses.ACTIVE, validStatuses.RESERVED]
    },
    UNBLOCK: {
      label: 'Unblock',
      description: 'Unblock previously blocked stock',
      icon: <FiCheckCircle className="w-5 h-5" />,
      color: 'text-green-600 bg-green-50',
      requiresDestination: false,
      allowedSourceStatuses: [validStatuses.BLOCKED]
    }
  };

  useEffect(() => {
    fetchStockDetails();
    fetchLocations();
  }, [id]);

  const fetchStockDetails = async () => {
    setLoading(true);
    try {
      const response = await WarehouseStockService.getStockById(id);
      const stockData = response.data;
      setStock(stockData);
      
      // Calculate available quantity (total - reserved)
      const totalQty = stockData.quantity || 0;
      const reservedQty = stockData.reservedQuantity || 0;
      const availableQty = totalQty - reservedQty;
      
      setAvailableQuantity(availableQty);
      
      // Set initial quantity based on movement type
      let initialQuantity = availableQty;
      if (availableQty > 0) {
        initialQuantity = Math.min(availableQty, 1);
      }
      
      setFormData(prev => ({
        ...prev,
        quantity: initialQuantity.toString()
      }));
      
      console.log('Stock loaded:', stockData);
      
      // Validate if stock status is valid
      if (stockData.stockStatus && !Object.values(validStatuses).includes(stockData.stockStatus)) {
        console.warn(`Invalid stock status received: ${stockData.stockStatus}`);
      }
      
    } catch (error) {
      console.error('Error fetching stock:', error);
      toast.error('Failed to load stock details');
      navigate('/warehouse/stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await WarehouseLocationService.getAvailableLocations();
      const currentLocationId = stock?.warehouseLocation?.id;
      
      // Filter out current location and quarantine locations based on movement type
      let filteredLocations = response.data || [];
      
      const selectedMovement = movementTypes[movementType];
      
      if (movementType === 'RELEASE') {
        // For release, show only non-quarantine locations
        filteredLocations = filteredLocations.filter(loc => !loc.isQuarantine);
      } else if (movementType === 'QUARANTINE') {
        // For quarantine, show only quarantine locations
        filteredLocations = filteredLocations.filter(loc => loc.isQuarantine);
      } else {
        // For other movements, exclude current location
        filteredLocations = filteredLocations.filter(loc => loc.id !== currentLocationId);
      }
      
      // Apply additional validation if defined
      if (selectedMovement?.validateDestination) {
        filteredLocations = filteredLocations.filter(selectedMovement.validateDestination);
      }
      
      setLocations(filteredLocations);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    }
  };

  useEffect(() => {
    if (stock) {
      fetchLocations();
    }
  }, [movementType, stock]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuantityChange = (value) => {
    const quantity = Math.min(Math.max(1, parseInt(value) || 0), availableQuantity);
    setFormData(prev => ({
      ...prev,
      quantity: quantity.toString()
    }));
  };

  const validateForm = () => {
    const quantity = parseInt(formData.quantity) || 0;
    
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return false;
    }
    
    if (quantity > availableQuantity) {
      toast.error(`Cannot move more than available quantity (${availableQuantity})`);
      return false;
    }
    
    const selectedMovement = movementTypes[movementType];
    
    // Validate source stock status
    const currentStatus = stock?.stockStatus;
    if (currentStatus && selectedMovement.allowedSourceStatuses) {
      if (!selectedMovement.allowedSourceStatuses.includes(currentStatus)) {
        const allowedStatuses = selectedMovement.allowedSourceStatuses.join(', ');
        toast.error(`Cannot ${selectedMovement.label.toLowerCase()} stock with status "${currentStatus}". Allowed statuses: ${allowedStatuses}`);
        return false;
      }
    }
    
    // Validate RELEASE movement - stock must be in quarantine
    if (movementType === 'RELEASE' && currentStatus !== validStatuses.QUARANTINE) {
      toast.error('Only quarantine stock can be released');
      return false;
    }
    
    // Validate UNRESERVE movement - stock must be reserved
    if (movementType === 'UNRESERVE' && currentStatus !== validStatuses.RESERVED) {
      toast.error('Only reserved stock can be unreserved');
      return false;
    }
    
    // Validate destination location
    if (selectedMovement?.requiresDestination && !formData.toLocationId) {
      toast.error('Please select a destination location');
      return false;
    }
    
    // Check if moving to same location
    if (formData.toLocationId && formData.toLocationId === stock?.warehouseLocation?.id) {
      toast.error('Cannot move to the same location');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setMoving(true);
    try {
      // Prepare movement data based on backend requirements
      const movementData = {
        stockId: id,
        movementType: movementType,
        quantity: parseInt(formData.quantity),
        remarks: formData.remarks || `Movement: ${movementTypes[movementType]?.label}`,
        ...(formData.toLocationId && { toLocationId: parseInt(formData.toLocationId) }),
        ...(formData.reason && { reason: formData.reason })
      };
      
      console.log('Submitting movement:', movementData);
      
      await WarehouseStockService.moveStock(movementData);
      
      toast.success(`Stock ${movementTypes[movementType]?.label.toLowerCase()} successful!`);
      navigate('/warehouse/stock');
      
    } catch (error) {
      console.error('Error moving stock:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to move stock. Please try again.';
      
      if (error.response?.status === 400) {
        if (error.response?.data?.error?.includes('warehouse_stocks_stock_status_check')) {
          errorMessage = 'Invalid stock status. Please check the stock status and try again.';
        } else {
          errorMessage = error.response?.data?.message || error.response?.data?.error || errorMessage;
        }
      } else if (error.response?.status === 404) {
        errorMessage = 'Stock or location not found. Please refresh and try again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to perform this action.';
      }
      
      toast.error(errorMessage);
    } finally {
      setMoving(false);
    }
  };

  const handleMovementTypeChange = (type) => {
    setMovementType(type);
    // Reset destination when changing movement type
    setFormData(prev => ({
      ...prev,
      toLocationId: ''
    }));
    
    // Show info about allowed statuses
    const selectedMovement = movementTypes[type];
    if (selectedMovement?.allowedSourceStatuses) {
      console.log(`Movement ${type} requires stock status:`, selectedMovement.allowedSourceStatuses);
    }
  };

  const getLocationLabel = (location) => {
    let label = `${location.locationCode} - ${location.locationName}`;
    
    if (location.isQuarantine) {
      label += ' (Quarantine)';
    }
    
    if (location.zone || location.rack || location.shelf) {
      label += ` [${[location.zone, location.rack, location.shelf].filter(Boolean).join('/')}]`;
    }
    
    // Add capacity info
    if (location.capacity) {
      label += ` - Capacity: ${location.currentOccupancy || 0}/${location.capacity}`;
    }
    
    return label;
  };

  // Check if movement type is allowed for current stock status
  const isMovementAllowed = (movementTypeKey) => {
    const movement = movementTypes[movementTypeKey];
    const currentStatus = stock?.stockStatus;
    
    if (!movement.allowedSourceStatuses) return true;
    if (!currentStatus) return true;
    
    return movement.allowedSourceStatuses.includes(currentStatus);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Stock Details</p>
          <p className="mt-2 text-gray-500">Preparing movement form...</p>
        </div>
      </div>
    );
  }

  const selectedMovement = movementTypes[movementType];
  const requiresDestination = selectedMovement?.requiresDestination;
  const statusConfig = getStatusConfig(stock?.stockStatus);

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <Link
              to="/warehouse/stock"
              className="p-2 mr-4 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                <FiMove className="mr-3 text-green-700" />
                Move Stock
              </h1>
              <p className="text-gray-600 mt-2">
                Transfer, reserve, or adjust warehouse stock
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              Stock ID: <span className="font-mono font-medium">{id}</span>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
              {stock?.stockStatus || 'UNKNOWN'}
            </div>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-green-600 via-blue-500 to-green-400 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Movement Type Selection */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Movement Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(movementTypes).map(([type, info]) => {
                const isAllowed = isMovementAllowed(type);
                const isCurrent = movementType === type;
                
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleMovementTypeChange(type)}
                    disabled={!isAllowed}
                    className={`p-4 rounded-lg border transition-all duration-200 ${
                      isCurrent 
                        ? 'border-blue-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-blue-300'
                    } ${!isAllowed ? 'opacity-50 cursor-not-allowed' : ''}`}
                    title={!isAllowed ? `Not allowed for stock status: ${stock?.stockStatus}` : ''}
                  >
                    <div className="flex items-center mb-2">
                      <div className={`p-2 rounded-lg ${info.color}`}>
                        {info.icon}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-gray-900">{info.label}</div>
                      <div className="text-xs text-gray-500 mt-1">{info.description}</div>
                      {!isAllowed && (
                        <div className="text-xs text-red-500 mt-1">
                          Requires: {info.allowedSourceStatuses?.join(', ')}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Stock Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Part Details</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-semibold text-blue-900">{stock?.part?.partNumber}</div>
                    <div className="text-sm text-gray-900">{stock?.part?.partName}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Type: {stock?.part?.partType} • Class: {stock?.part?.classCode}
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center">
                      <FiMapPin className="w-5 h-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium">{stock?.warehouseLocation?.locationCode}</div>
                        <div className="text-sm text-gray-600">
                          {stock?.warehouseLocation?.locationName}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {stock?.warehouseLocation?.zone}/{stock?.warehouseLocation?.rack}/{stock?.warehouseLocation?.shelf}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stock Quantities</label>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="text-xl font-bold text-gray-900">{stock?.quantity || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Available</div>
                        <div className="text-xl font-bold text-green-900">{availableQuantity}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Reserved</div>
                        <div className="text-xl font-bold text-yellow-900">{stock?.reservedQuantity || 0}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-gray-500">Reorder Level</div>
                        <div className="text-lg font-bold text-red-900">{stock?.reorderLevel || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Batch Information</label>
                  <div className="text-sm text-gray-700">
                    <div>Batch: {stock?.batchNumber || 'N/A'}</div>
                    {stock?.expiryDate && (
                      <div className={`mt-1 flex items-center ${
                        new Date(stock.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-900'
                      }`}>
                        <FiCalendar className="w-4 h-4 mr-1" />
                        Expires: {new Date(stock.expiryDate).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Movement Form */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <form onSubmit={handleSubmit}>
              <h3 className="text-lg font-medium text-gray-900 mb-6">{selectedMovement?.label} Details</h3>
              
              <div className="space-y-6">
                {/* Quantity to Move */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity *
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={(e) => handleQuantityChange(e.target.value)}
                      className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      required
                      min="1"
                      max={availableQuantity}
                      disabled={availableQuantity <= 0}
                    />
                    <div className="text-sm text-gray-600">
                      Max available: <span className="font-medium">{availableQuantity}</span>
                    </div>
                    {availableQuantity > 0 && (
                      <div className="flex-1">
                        <input
                          type="range"
                          min="1"
                          max={availableQuantity}
                          value={formData.quantity}
                          onChange={(e) => handleQuantityChange(e.target.value)}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    )}
                  </div>
                  {availableQuantity <= 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      No available quantity to move
                    </div>
                  )}
                </div>

                {/* Destination Location (if required) */}
                {requiresDestination && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Destination Location *
                    </label>
                    <select
                      name="toLocationId"
                      value={formData.toLocationId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      required
                      disabled={locations.length === 0}
                    >
                      <option value="">Select destination location</option>
                      {locations.map(location => (
                        <option key={location.id} value={location.id}>
                          {getLocationLabel(location)}
                        </option>
                      ))}
                    </select>
                    {locations.length === 0 && (
                      <div className="mt-2 text-sm text-red-600">
                        No suitable destination locations available for this movement type
                      </div>
                    )}
                  </div>
                )}

                {/* Movement Reason */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <select
                    name="reason"
                    value={formData.reason}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="">Select reason (optional)</option>
                    <option value="REORGANIZATION">Warehouse Reorganization</option>
                    <option value="PICKING">Order Picking Location</option>
                    <option value="STORAGE_OPTIMIZATION">Storage Optimization</option>
                    <option value="DAMAGE_PREVENTION">Damage Prevention</option>
                    <option value="EXPIRY_MANAGEMENT">Expiry Management</option>
                    <option value="QUALITY_ISSUE">Quality Issue</option>
                    <option value="CUSTOMER_ORDER">Customer Order</option>
                    <option value="PRODUCTION_NEED">Production Need</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Remarks
                  </label>
                  <textarea
                    name="remarks"
                    value={formData.remarks}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder={`Add notes about this ${selectedMovement?.label.toLowerCase()}...`}
                  />
                </div>
              </div>

              {/* Validation warnings */}
              {movementType === 'RELEASE' && stock?.stockStatus !== validStatuses.QUARANTINE && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center text-red-700">
                    <FiAlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Warning: Stock is not in QUARANTINE status</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    Only stock with QUARANTINE status can be released. Current status: {stock?.stockStatus}
                  </p>
                </div>
              )}

              {movementType === 'UNRESERVE' && stock?.stockStatus !== validStatuses.RESERVED && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center text-red-700">
                    <FiAlertCircle className="w-5 h-5 mr-2" />
                    <span className="font-medium">Warning: Stock is not in RESERVED status</span>
                  </div>
                  <p className="text-sm text-red-600 mt-1">
                    Only stock with RESERVED status can be unreserved. Current status: {stock?.stockStatus}
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/warehouse/stock')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={moving || availableQuantity <= 0}
                  className={`px-8 py-3 bg-gradient-to-r ${
                    movementType === 'QUARANTINE' || movementType === 'BLOCK' ? 'from-red-600 to-red-700' :
                    movementType === 'RESERVE' ? 'from-yellow-600 to-yellow-700' :
                    movementType === 'RELEASE' || movementType === 'UNBLOCK' || movementType === 'UNRESERVE' ? 'from-green-600 to-green-700' :
                    'from-blue-600 to-blue-700'
                  } text-white font-medium rounded-lg hover:opacity-90 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                >
                  {moving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiMove className="mr-2" />
                      {selectedMovement?.label} Stock
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Summary & Details */}
        <div className="space-y-6">
          {/* Movement Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Movement Summary</h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm text-gray-600">Movement Type</div>
                <div className="flex items-center mt-1">
                  <div className={`p-2 rounded-lg mr-3 ${selectedMovement?.color}`}>
                    {selectedMovement?.icon}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{selectedMovement?.label}</div>
                    <div className="text-xs text-gray-500">{selectedMovement?.description}</div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-sm text-gray-600">Moving Quantity</div>
                  <div className="text-xl font-bold text-blue-900">{formData.quantity || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Remaining After</div>
                  <div className="text-xl font-bold text-gray-900">
                    {availableQuantity - parseInt(formData.quantity || 0)}
                  </div>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-600">Current Location</div>
                <div className="font-medium">{stock?.warehouseLocation?.locationCode}</div>
              </div>
              
              {requiresDestination && formData.toLocationId && (
                <div>
                  <div className="text-sm text-gray-600">Destination</div>
                  <div className="font-medium text-green-900">
                    {locations.find(l => l.id === parseInt(formData.toLocationId))?.locationCode}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stock Status */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                  {stock?.stockStatus || 'UNKNOWN'}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Batch:</span>
                  <span className="font-medium">{stock?.batchNumber || 'N/A'}</span>
                </div>
                {stock?.expiryDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Expiry:</span>
                    <span className={`font-medium ${
                      new Date(stock.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {new Date(stock.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {stock?.grnNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">GRN:</span>
                    <span className="font-medium">{stock.grnNumber}</span>
                  </div>
                )}
              </div>
              
              {/* Status validation for current movement */}
              {selectedMovement?.allowedSourceStatuses && (
                <div className="mt-4 pt-3 border-t border-gray-200">
                  <div className="text-sm font-medium text-gray-700 mb-2">Status Requirements:</div>
                  <div className={`text-sm ${selectedMovement.allowedSourceStatuses.includes(stock?.stockStatus) ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedMovement.allowedSourceStatuses.includes(stock?.stockStatus) 
                      ? '✓ Status is valid for this movement'
                      : '✗ Status is not valid for this movement'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Allowed: {selectedMovement.allowedSourceStatuses.join(', ')}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Guidelines */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <FiAlertCircle className="mr-2 text-green-600" />
              Important Guidelines
            </h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                <span>Ensure physical movement matches system update</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                <span>Check destination capacity before moving</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                <span>Document all movements for audit trail</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                <span>Verify stock availability before reserving</span>
              </li>
              {movementType === 'RELEASE' && (
                <li className="flex items-start">
                  <div className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-3 flex-shrink-0"></div>
                  <span className="font-medium">Stock must be in QUARANTINE status to release</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveStock;