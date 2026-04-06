// src/pages/warehouse/WarehouseStock.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiSearch, FiFilter, FiDownload, FiRefreshCw,
  FiPackage, FiMapPin, FiAlertCircle, FiTrendingUp,
  FiEye, FiMove, FiArchive, FiActivity,
  FiXCircle, FiCalendar, FiBox, FiUser,
  FiTag, FiDollarSign
} from 'react-icons/fi';
import WarehouseStockService from '../../services/WarehouseStockService';
import WarehouseLocationService from '../../services/warehouseLocationService';
import { toast } from 'react-toastify';

const WarehouseStock = () => {
  const [stocks, setStocks] = useState([]);
  const [filteredStocks, setFilteredStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [locations, setLocations] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  
  const navigate = useNavigate();
  
  // Updated status colors to match backend statuses
  const statusColors = {
    AVAILABLE: 'bg-green-100 text-green-800 border border-green-200',
    QUARANTINE: 'bg-red-100 text-red-800 border border-red-200',
    RESERVED: 'bg-blue-100 text-blue-800 border border-blue-200',
    EXPIRED: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    DAMAGED: 'bg-red-200 text-red-900 border border-red-300',
    IN_TRANSIT: 'bg-purple-100 text-purple-800 border border-purple-200',
    HOLD: 'bg-gray-100 text-gray-800 border border-gray-200',
    // Fallback for any other status
    DEFAULT: 'bg-gray-100 text-gray-800 border border-gray-200'
  };

  useEffect(() => {
    fetchStocks();
    fetchLocations();
  }, []);

  useEffect(() => {
    filterStocks();
  }, [searchTerm, filterLocation, filterStatus, stocks]);

  const fetchStocks = async () => {
    setLoading(true);
    try {
      const response = await WarehouseStockService.getAllStocks();
      console.log('Fetched stocks:', response.data); // Debug log
      const stocksData = response.data || [];
      
      // Log first few items to see structure
      if (stocksData.length > 0) {
        console.log('Sample stock item:', {
          id: stocksData[0].id,
          part: stocksData[0].part,
          location: stocksData[0].warehouseLocation,
          batch: stocksData[0].batchNumber,
          status: stocksData[0].stockStatus,
          supplier: stocksData[0].supplier,
          grn: stocksData[0].grnNumber
        });
      }
      
      setStocks(stocksData);
      setFilteredStocks(stocksData);
      toast.success(`Loaded ${stocksData.length} stock items`);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Failed to load warehouse stock');
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await WarehouseLocationService.getActiveLocations();
      setLocations(response.data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
    }
  };

  const filterStocks = () => {
    let filtered = [...stocks];

    // Search filter with null safety
    if (searchTerm) {
      filtered = filtered.filter(stock => {
        const partNumber = stock.part?.partNumber || '';
        const partName = stock.part?.partName || '';
        const batchNumber = stock.batchNumber || '';
        const locationCode = stock.warehouseLocation?.locationCode || '';
        const supplierName = stock.supplier?.supplierName || '';
        const grnNumber = stock.grnNumber || '';
        
        const searchLower = searchTerm.toLowerCase();
        return (
          partNumber.toLowerCase().includes(searchLower) ||
          partName.toLowerCase().includes(searchLower) ||
          batchNumber.toLowerCase().includes(searchLower) ||
          locationCode.toLowerCase().includes(searchLower) ||
          supplierName.toLowerCase().includes(searchLower) ||
          grnNumber.toLowerCase().includes(searchLower)
        );
      });
    }

    // Location filter
    if (filterLocation !== 'ALL') {
      filtered = filtered.filter(stock => {
        const locationId = stock.warehouseLocation?.id;
        return locationId && locationId.toString() === filterLocation;
      });
    }

    // Status filter - map frontend values to backend values
    if (filterStatus !== 'ALL') {
      const statusMap = {
        'ACTIVE': 'AVAILABLE',
        'QUARANTINE': 'QUARANTINE',
        'RESERVED': 'RESERVED',
        'EXPIRED': 'EXPIRED',
        'DAMAGED': 'DAMAGED',
        'BLOCKED': 'HOLD',
        'IN_TRANSIT': 'IN_TRANSIT'
      };
      
      const backendStatus = statusMap[filterStatus] || filterStatus;
      filtered = filtered.filter(stock => stock.stockStatus === backendStatus);
    }

    // Sort by available quantity (lowest first)
    filtered.sort((a, b) => (a.availableQuantity || 0) - (b.availableQuantity || 0));

    setFilteredStocks(filtered);
  };

  const handleViewDetails = (stock) => {
    console.log('Viewing stock details:', stock); // Debug log
    setSelectedStock(stock);
    setShowDetails(true);
  };

  const handleMoveStock = (stockId) => {
    navigate(`/warehouse/stock/move/${stockId}`);
  };

  const handleAdjustStock = (stockId) => {
    navigate(`/warehouse/stock/adjust/${stockId}`);
  };

  const getStats = () => {
    const totalItems = stocks.length;
    const totalQuantity = stocks.reduce((sum, stock) => sum + (stock.quantity || 0), 0);
    const totalValue = stocks.reduce((sum, stock) => sum + (parseFloat(stock.totalValue) || 0), 0);
    
    // Calculate low stock: available quantity <= reorder level AND available quantity > 0
    const lowStock = stocks.filter(stock => {
      const available = stock.availableQuantity || 0;
      const reorder = stock.reorderLevel || 0;
      return available <= reorder && available > 0;
    }).length;
    
    // Calculate items in quarantine
    const quarantineItems = stocks.filter(stock => stock.stockStatus === 'QUARANTINE').length;
    
    // Calculate items about to expire (within 30 days)
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    const expiringSoon = stocks.filter(stock => {
      if (!stock.expiryDate) return false;
      const expiryDate = new Date(stock.expiryDate);
      return expiryDate <= thirtyDaysFromNow && expiryDate >= today;
    }).length;
    
    return { 
      totalItems, 
      totalQuantity, 
      totalValue, 
      lowStock,
      quarantineItems,
      expiringSoon
    };
  };

  const stats = getStats();

  const formatCurrency = (value) => {
    if (!value) return '₹0.00';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'AVAILABLE': 'Active',
      'QUARANTINE': 'Quarantine',
      'RESERVED': 'Reserved',
      'EXPIRED': 'Expired',
      'DAMAGED': 'Damaged',
      'IN_TRANSIT': 'In Transit',
      'HOLD': 'On Hold'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Warehouse Stock</p>
          <p className="mt-2 text-gray-500">Fetching inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
              <FiPackage className="mr-3 text-blue-700" />
              Warehouse Stock Management
            </h1>
            <p className="text-gray-600 mt-2">
              Track, manage, and monitor your inventory in real-time
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchStocks}
              className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center shadow-sm"
            >
              <FiRefreshCw className="mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-400 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Items</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalItems}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiPackage className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600">
            Different SKUs in inventory
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Total Quantity</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalQuantity.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiBox className="w-5 h-5 text-green-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-green-600">
            Total units across all locations
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Total Value</p>
              <p className="text-xl font-bold text-gray-900 mt-2 truncate">
                {formatCurrency(stats.totalValue)}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiDollarSign className="w-5 h-5 text-purple-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-purple-600">
            Current inventory valuation
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.lowStock}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiAlertCircle className="w-5 h-5 text-red-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-red-600">
            Below reorder level
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl border border-yellow-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-yellow-700 font-medium">Quarantine</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.quarantineItems}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiAlertCircle className="w-5 h-5 text-yellow-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-yellow-600">
            Items under inspection
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Expiring Soon</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.expiringSoon}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiCalendar className="w-5 h-5 text-orange-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-orange-600">
            Expiring in 30 days
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by part number, name, batch, location, supplier, or GRN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiMapPin className="inline mr-1" /> Location
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="ALL">All Locations</option>
              {locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.locationCode} - {location.locationName}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFilter className="inline mr-1" /> Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="QUARANTINE">Quarantine</option>
              <option value="RESERVED">Reserved</option>
              <option value="EXPIRED">Expired</option>
              <option value="DAMAGED">Damaged</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="BLOCKED">On Hold</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-blue-700">{filteredStocks.length}</span> of{' '}
            <span className="font-semibold">{stocks.length}</span> stock items
            {searchTerm && (
              <span className="ml-2 text-blue-600">
                • Searching for: "{searchTerm}"
              </span>
            )}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => toast.info('Export feature coming soon!')}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center"
            >
              <FiDownload className="mr-2" />
              Export CSV
            </button>
            <div className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredStocks.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
              <FiPackage className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No stock items found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterLocation !== 'ALL' || filterStatus !== 'ALL'
                ? 'Try adjusting your search or filters to find what you are looking for.'
                : 'No stock items available. Stock is automatically added when GRN items are approved.'}
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterLocation('ALL');
                setFilterStatus('ALL');
              }}
              className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Part Details
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Batch & Dates
                    </th>
                    <th className="px6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Quantities
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status & Value
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStocks.map((stock) => {
                    const part = stock.part || {};
                    const location = stock.warehouseLocation || {};
                    const supplier = stock.supplier || {};
                    const status = stock.stockStatus || 'UNKNOWN';
                    const statusColor = statusColors[status] || statusColors.DEFAULT;
                    
                    return (
                      <tr key={stock.id} className="hover:bg-gray-50 transition group">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold text-blue-700 group-hover:text-blue-800">
                              {part.partNumber || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-900">
                              {part.partName || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 mt-1 flex items-center">
                              <FiTag className="mr-1" />
                              Type: {part.partType || 'N/A'}
                              {part.classCode && (
                                <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                                  {part.classCode}
                                </span>
                              )}
                            </div>
                            {supplier.supplierName && (
                              <div className="text-xs text-gray-500 mt-1 flex items-center">
                                <FiUser className="mr-1" />
                                Supplier: {supplier.supplierName}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              <FiMapPin className="inline mr-1 text-gray-400" />
                              {location.locationCode || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {location.locationName || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {[location.zone, location.rack, location.shelf, location.bin]
                                .filter(Boolean)
                                .join(' / ') || 'No location details'}
                            </div>
                            {location.isQuarantine && (
                              <div className="text-xs text-red-600 mt-1 font-medium">
                                ⚠️ Quarantine Location
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-gray-600">Batch:</span>
                              <span className="ml-2 font-medium">{stock.batchNumber || 'N/A'}</span>
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <FiCalendar className="mr-1" />
                              {stock.manufacturingDate ? (
                                <span>Mfg: {formatDate(stock.manufacturingDate)}</span>
                              ) : (
                                <span>Mfg: N/A</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <FiCalendar className="mr-1" />
                              {stock.expiryDate ? (
                                <span className={new Date(stock.expiryDate) < new Date() ? 'text-red-600 font-medium' : ''}>
                                  Exp: {formatDate(stock.expiryDate)}
                                  {new Date(stock.expiryDate) < new Date() && ' ⚠️'}
                                </span>
                              ) : (
                                <span>Exp: N/A</span>
                              )}
                            </div>
                            {stock.grnNumber && (
                              <div className="text-xs text-blue-600 font-medium">
                                GRN: {stock.grnNumber}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium">{stock.quantity || 0}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Available:</span>
                              <span className={`font-medium ${
                                (stock.availableQuantity || 0) <= (stock.reorderLevel || 0) 
                                  ? 'text-red-600' 
                                  : 'text-green-600'
                              }`}>
                                {stock.availableQuantity || 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Reserved:</span>
                              <span className="font-medium text-blue-600">{stock.reservedQuantity || 0}</span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Reorder Level:</span>
                              <span>{stock.reorderLevel || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                                {getStatusDisplay(status)}
                              </span>
                            </div>
                            <div className="text-sm font-medium">
                              {formatCurrency(stock.totalValue)}
                            </div>
                            <div className="text-xs text-gray-500">
                              Unit: {formatCurrency(stock.unitPrice)} each
                            </div>
                            {stock.shelfLifeDays && (
                              <div className="text-xs text-gray-500">
                                Shelf Life: {stock.shelfLifeDays} days
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(stock)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition hover:scale-105"
                              title="View Details"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>
                            
                            <button
                              onClick={() => handleMoveStock(stock.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition hover:scale-105"
                              title="Move Stock"
                            >
                              <FiMove className="w-5 h-5" />
                            </button>
                            
                            <button
                              onClick={() => handleAdjustStock(stock.id)}
                              className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition hover:scale-105"
                              title="Adjust Quantity"
                            >
                              <FiArchive className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                  <span className="font-semibold">{filteredStocks.length}</span> items • 
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-red-600 font-medium">{stats.lowStock}</span> low stock • 
                  <span className="mx-2 text-gray-400">•</span>
                  Total value: <span className="font-semibold">{formatCurrency(stats.totalValue)}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={fetchStocks}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center hover:underline"
                  >
                    <FiRefreshCw className="mr-1" />
                    Refresh Data
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Enhanced Details Modal */}
      {showDetails && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiPackage className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Stock Item Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedStock.part?.partNumber} - {selectedStock.part?.partName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    statusColors[selectedStock.stockStatus] || statusColors.DEFAULT
                  }`}>
                    {getStatusDisplay(selectedStock.stockStatus)}
                  </span>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="p-2 hover:bg-white rounded-lg transition shadow-sm hover:shadow"
                  >
                    <FiXCircle className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Part & Location Info */}
                <div className="space-y-6">
                  {/* Part Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiPackage className="mr-2" />
                      Part Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500">Part Number</label>
                        <div className="font-medium text-gray-900">{selectedStock.part?.partNumber || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Part Name</label>
                        <div className="font-medium text-gray-900">{selectedStock.part?.partName || 'N/A'}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Type</label>
                          <div className="font-medium text-gray-900">{selectedStock.part?.partType || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Class</label>
                          <div className="font-medium text-gray-900">{selectedStock.part?.classCode || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Location Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiMapPin className="mr-2" />
                      Location Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500">Location Code</label>
                        <div className="font-medium text-gray-900">{selectedStock.warehouseLocation?.locationCode || 'N/A'}</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Location Name</label>
                        <div className="font-medium text-gray-900">{selectedStock.warehouseLocation?.locationName || 'N/A'}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Zone</label>
                          <div className="font-medium text-gray-900">{selectedStock.warehouseLocation?.zone || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Rack</label>
                          <div className="font-medium text-gray-900">{selectedStock.warehouseLocation?.rack || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Shelf</label>
                          <div className="font-medium text-gray-900">{selectedStock.warehouseLocation?.shelf || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Bin</label>
                          <div className="font-medium text-gray-900">{selectedStock.warehouseLocation?.bin || 'N/A'}</div>
                        </div>
                      </div>
                      {selectedStock.warehouseLocation?.isQuarantine && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                          ⚠️ This is a quarantine location
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Middle Column - Stock & Quantity Info */}
                <div className="space-y-6">
                  {/* Stock Quantities */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiBox className="mr-2" />
                      Stock Quantities
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-xs text-blue-700 font-medium">Total Quantity</div>
                        <div className="text-2xl font-bold text-blue-900 mt-1">{selectedStock.quantity || 0}</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-xs text-green-700 font-medium">Available</div>
                        <div className="text-2xl font-bold text-green-900 mt-1">{selectedStock.availableQuantity || 0}</div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <div className="text-xs text-yellow-700 font-medium">Reserved</div>
                        <div className="text-2xl font-bold text-yellow-900 mt-1">{selectedStock.reservedQuantity || 0}</div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-xs text-purple-700 font-medium">Total Value</div>
                        <div className="text-lg font-bold text-purple-900 mt-1 truncate">
                          {formatCurrency(selectedStock.totalValue)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock Levels */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiActivity className="mr-2" />
                      Stock Levels
                    </h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Minimum</label>
                          <div className="font-medium text-gray-900">{selectedStock.minimumStockLevel || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Maximum</label>
                          <div className="font-medium text-gray-900">{selectedStock.maximumStockLevel || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Reorder Level</label>
                          <div className="font-medium text-gray-900">{selectedStock.reorderLevel || 'N/A'}</div>
                        </div>
                      </div>
                      {selectedStock.shelfLifeDays && (
                        <div>
                          <label className="text-xs text-gray-500">Shelf Life</label>
                          <div className="font-medium text-gray-900">{selectedStock.shelfLifeDays} days</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiDollarSign className="mr-2" />
                      Pricing Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500">Unit Price</label>
                        <div className="font-medium text-gray-900">{formatCurrency(selectedStock.unitPrice)}</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Total Value</label>
                        <div className="font-medium text-gray-900">{formatCurrency(selectedStock.totalValue)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Batch, Dates & Supplier Info */}
                <div className="space-y-6">
                  {/* Batch & Dates */}
                  {(selectedStock.batchNumber || selectedStock.manufacturingDate || selectedStock.expiryDate) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <FiCalendar className="mr-2" />
                        Batch & Dates
                      </h3>
                      <div className="space-y-3">
                        {selectedStock.batchNumber && (
                          <div>
                            <label className="text-xs text-gray-500">Batch Number</label>
                            <div className="font-medium text-gray-900">{selectedStock.batchNumber}</div>
                          </div>
                        )}
                        {selectedStock.manufacturingDate && (
                          <div>
                            <label className="text-xs text-gray-500">Manufacturing Date</label>
                            <div className="font-medium text-gray-900">{formatDate(selectedStock.manufacturingDate)}</div>
                          </div>
                        )}
                        {selectedStock.expiryDate && (
                          <div>
                            <label className="text-xs text-gray-500">Expiry Date</label>
                            <div className={`font-medium ${
                              new Date(selectedStock.expiryDate) < new Date() ? 'text-red-600' : 'text-gray-900'
                            }`}>
                              {formatDate(selectedStock.expiryDate)}
                              {new Date(selectedStock.expiryDate) < new Date() && ' (Expired)'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Supplier Information */}
                  {selectedStock.supplier && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <FiUser className="mr-2" />
                        Supplier Information
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-gray-500">Supplier Name</label>
                          <div className="font-medium text-gray-900">{selectedStock.supplier.supplierName || 'N/A'}</div>
                        </div>
                        {selectedStock.supplier.supplierCode && (
                          <div>
                            <label className="text-xs text-gray-500">Supplier Code</label>
                            <div className="font-medium text-gray-900">{selectedStock.supplier.supplierCode}</div>
                          </div>
                        )}
                        {selectedStock.supplierBatchNumber && (
                          <div>
                            <label className="text-xs text-gray-500">Supplier Batch</label>
                            <div className="font-medium text-gray-900">{selectedStock.supplierBatchNumber}</div>
                          </div>
                        )}
                        {selectedStock.supplierInvoiceNumber && (
                          <div>
                            <label className="text-xs text-gray-500">Invoice Number</label>
                            <div className="font-medium text-gray-900">{selectedStock.supplierInvoiceNumber}</div>
                          </div>
                        )}
                        {selectedStock.supplierDeliveryDate && (
                          <div>
                            <label className="text-xs text-gray-500">Delivery Date</label>
                            <div className="font-medium text-gray-900">{formatDate(selectedStock.supplierDeliveryDate)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Source Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">
                      Source Information
                    </h3>
                    <div className="space-y-3">
                      {selectedStock.grnNumber && (
                        <div>
                          <label className="text-xs text-gray-500">GRN Number</label>
                          <div className="font-medium text-blue-900">{selectedStock.grnNumber}</div>
                          {selectedStock.grnItemId && (
                            <div className="text-xs text-gray-500 mt-1">Item ID: {selectedStock.grnItemId}</div>
                          )}
                        </div>
                      )}
                      <div>
                        <label className="text-xs text-gray-500">Created By</label>
                        <div className="font-medium text-gray-900">{selectedStock.createdBy || 'System'}</div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Created On</label>
                          <div className="text-sm text-gray-900">{formatDate(selectedStock.createdAt)}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Last Updated</label>
                          <div className="text-sm text-gray-900">{formatDate(selectedStock.updatedAt)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Remarks Section */}
              {selectedStock.remarks && (
                <div className="mt-6 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Remarks
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedStock.remarks}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Stock ID: <span className="font-mono font-medium">{selectedStock.id}</span>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleMoveStock(selectedStock.id)}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center shadow-sm"
                  >
                    <FiMove className="mr-2" />
                    Move Stock
                  </button>
                  <button
                    onClick={() => handleAdjustStock(selectedStock.id)}
                    className="px-4 py-2 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition flex items-center shadow-sm"
                  >
                    <FiArchive className="mr-2" />
                    Adjust Quantity
                  </button>
                  <button
                    onClick={() => setShowDetails(false)}
                    className="px-6 py-2 bg-gray-200 text-gray-800 font-medium rounded-lg hover:bg-gray-300 transition shadow-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseStock;