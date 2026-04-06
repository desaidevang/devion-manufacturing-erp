// src/pages/warehouse/WarehouseLocations.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiMapPin, FiSearch, FiFilter, FiPlus, FiRefreshCw,
  FiEdit, FiTrash2, FiEye, FiCheckCircle, FiXCircle,
  FiTrendingUp, FiArchive, FiLayers, FiAlertCircle,
  FiDatabase, FiPackage, FiThermometer, FiDroplet
} from 'react-icons/fi';
import WarehouseLocationService from '../../services/warehouseLocationService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const WarehouseLocations = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterZone, setFilterZone] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLocations();
  }, []);

  useEffect(() => {
    filterLocations();
  }, [searchTerm, filterStatus, filterZone, filterType, locations]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await WarehouseLocationService.getAllLocations();
      console.log('Fetched locations:', response.data); // Debug log
      const locationsData = response.data || [];
      setLocations(locationsData);
      setFilteredLocations(locationsData);
      toast.success(`Loaded ${locationsData.length} warehouse locations`);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const filterLocations = () => {
    let filtered = locations;

    // Search filter - updated for backend fields
    if (searchTerm) {
      filtered = filtered.filter(location =>
        location.locationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.locationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.zone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.rack?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.shelf?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter - using isActive instead of status
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(location => {
        if (filterStatus === 'ACTIVE') return location.isActive === true;
        if (filterStatus === 'INACTIVE') return location.isActive === false;
        return true;
      });
    }

    // Zone filter
    if (filterZone !== 'ALL') {
      filtered = filtered.filter(location => location.zone === filterZone);
    }

    // Type filter
    if (filterType !== 'ALL') {
      filtered = filtered.filter(location => location.locationType === filterType);
    }

    setFilteredLocations(filtered);
  };

  const handleDeleteLocation = async () => {
    if (!selectedLocation) return;

    try {
      await WarehouseLocationService.deleteLocation(selectedLocation.id);
      toast.success('Location deleted successfully');
      setShowDeleteConfirm(false);
      setSelectedLocation(null);
      fetchLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      const errorMsg = error.response?.data?.message || 'Failed to delete location';
      toast.error(errorMsg);
    }
  };

  const handleViewDetails = (location) => {
    console.log('Viewing location details:', location); // Debug log
    setSelectedLocation(location);
    setShowDetails(true);
  };

  const handleEditLocation = (locationId) => {
    navigate(`/warehouse/locations/edit/${locationId}`);
  };

  const getStats = () => {
    const totalLocations = locations.length;
    const activeLocations = locations.filter(l => l.isActive === true).length;
    
    // Calculate occupied locations (locations with currentOccupancy > 0)
    const occupiedLocations = locations.filter(l => (l.currentOccupancy || 0) > 0).length;
    
    // Get unique zones
    const zones = [...new Set(locations.map(l => l.zone).filter(Boolean))].length;
    
    // Calculate total capacity
    const totalCapacity = locations.reduce((sum, loc) => sum + (loc.capacity || 0), 0);
    
    // Calculate total occupied
    const totalOccupied = locations.reduce((sum, loc) => sum + (loc.currentOccupancy || 0), 0);
    
    // Calculate utilization percentage
    const utilizationRate = totalCapacity > 0 ? (totalOccupied / totalCapacity * 100).toFixed(1) : 0;

    return { 
      totalLocations, 
      activeLocations, 
      occupiedLocations, 
      zones,
      totalCapacity,
      totalOccupied,
      utilizationRate
    };
  };

  const stats = getStats();

  const getStatusBadge = (isActive, isQuarantine) => {
    if (isQuarantine) {
      return 'bg-red-100 text-red-800 border border-red-200';
    }
    return isActive ? 
      'bg-green-100 text-green-800 border border-green-200' : 
      'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getZones = () => {
    const zones = [...new Set(locations.map(l => l.zone).filter(Boolean))];
    return zones;
  };

  const getLocationTypes = () => {
    const types = [...new Set(locations.map(l => l.locationType).filter(Boolean))];
    return types;
  };

  const getLocationTypeLabel = (type) => {
    const typeMap = {
      'RAW_MATERIAL': 'Raw Material',
      'INSPECTION': 'Inspection',
      'QUARANTINE': 'Quarantine',
      'FINISHED_GOODS': 'Finished Goods',
      'SEMI_FINISHED': 'Semi-Finished',
      'ASSEMBLY': 'Assembly',
      'TOOL_ROOM': 'Tool Room',
      'PACKING': 'Packing',
      'SHIPPING': 'Shipping',
      'GENERAL_STORE': 'General Store'
    };
    return typeMap[type] || type;
  };

  const formatCapacity = (current, total) => {
    if (total === null || total === 0) return 'Unlimited';
    return `${current || 0} / ${total}`;
  };

  const calculateUtilization = (current, total) => {
    if (!total || total === 0) return 0;
    return ((current || 0) / total * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Warehouse Locations</p>
          <p className="mt-2 text-gray-500">Fetching location data...</p>
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
              <FiMapPin className="mr-3 text-blue-700" />
              Warehouse Location Management
            </h1>
            <p className="text-gray-600 mt-2">
              Organize, track, and optimize your warehouse storage spaces
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchLocations}
              className="px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center shadow-sm"
            >
              <FiRefreshCw className="mr-2" />
              Refresh Data
            </button>
            <Link
              to="/warehouse/locations/create"
              className="px-6 py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition flex items-center shadow-lg"
            >
              <FiPlus className="mr-2" />
              New Location
            </Link>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-400 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Locations</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalLocations}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiMapPin className="w-5 h-5 text-blue-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600">
            Storage locations
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Active</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.activeLocations}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiCheckCircle className="w-5 h-5 text-green-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-green-600">
            Available for use
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Occupied</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.occupiedLocations}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiArchive className="w-5 h-5 text-purple-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-purple-600">
            Locations with stock
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">Total Capacity</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalCapacity.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiDatabase className="w-5 h-5 text-orange-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-orange-600">
            Total storage units
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-red-700 font-medium">Used Capacity</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {stats.totalOccupied.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiPackage className="w-5 h-5 text-red-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-red-600">
            Occupied units
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-xl border border-teal-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-teal-700 font-medium">Utilization</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.utilizationRate}%</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiTrendingUp className="w-5 h-5 text-teal-700" />
            </div>
          </div>
          <div className="mt-3 text-xs text-teal-600">
            Storage efficiency
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search locations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Zone Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFilter className="inline mr-1" /> Zone
            </label>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="ALL">All Zones</option>
              {getZones().map(zone => (
                <option key={zone} value={zone}>{zone}</option>
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
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiFilter className="inline mr-1" /> Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="ALL">All Types</option>
              {getLocationTypes().map(type => (
                <option key={type} value={type}>{getLocationTypeLabel(type)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-semibold text-blue-700">{filteredLocations.length}</span> of{' '}
            <span className="font-semibold">{locations.length}</span> locations
            {searchTerm && (
              <span className="ml-2 text-blue-600">
                • Searching for: "{searchTerm}"
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">
            Utilization: <span className="font-semibold">{stats.utilizationRate}%</span>
          </div>
        </div>
      </div>

      {/* Locations Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredLocations.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
              <FiMapPin className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterStatus !== 'ALL' || filterZone !== 'ALL' || filterType !== 'ALL'
                ? 'Try adjusting your search or filters to find what you are looking for.'
                : 'No warehouse locations configured yet.'}
            </p>
            <Link
              to="/warehouse/locations/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white font-medium rounded-lg hover:from-green-700 hover:to-green-800 transition shadow-lg"
            >
              <FiPlus className="mr-2" />
              Create First Location
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Location Code
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Details & Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Storage Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Capacity & Utilization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLocations.map((location) => {
                    const currentOccupancy = location.currentOccupancy || 0;
                    const capacity = location.capacity || 0;
                    const utilization = calculateUtilization(currentOccupancy, capacity);
                    const isQuarantine = location.isQuarantine || false;
                    
                    return (
                      <tr key={location.id} className="hover:bg-gray-50 transition group">
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-lg font-bold text-blue-900 group-hover:text-blue-800">
                              {location.locationCode || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              ID: {location.id}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {location.locationName || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">
                                {getLocationTypeLabel(location.locationType)}
                              </span>
                            </div>
                            {location.remarks && (
                              <div className="text-xs text-gray-500 mt-2 truncate max-w-xs">
                                {location.remarks}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="text-gray-600">Zone:</span>
                              <span className="ml-2 font-medium">{location.zone || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Rack:</span>
                              <span className="ml-2 font-medium">{location.rack || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Shelf:</span>
                              <span className="ml-2 font-medium">{location.shelf || 'N/A'}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Bin:</span>
                              <span className="ml-2 font-medium">{location.bin || 'N/A'}</span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="text-sm">
                              <span className="text-gray-600">Capacity:</span>
                              <span className="ml-2 font-medium">
                                {formatCapacity(currentOccupancy, capacity)}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="text-gray-600">Available:</span>
                              <span className="ml-2 font-medium text-green-600">
                                {capacity ? (capacity - currentOccupancy) : '∞'}
                              </span>
                            </div>
                            {capacity > 0 && (
                              <>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className={`h-2 rounded-full ${
                                      utilization > 90 ? 'bg-red-500' :
                                      utilization > 70 ? 'bg-yellow-500' :
                                      'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                  ></div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {utilization}% utilized
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(location.isActive, isQuarantine)}`}>
                              {isQuarantine ? 'QUARANTINE' : (location.isActive ? 'ACTIVE' : 'INACTIVE')}
                            </span>
                            {location.temperatureRange && (
                              <div className="text-xs text-gray-600 flex items-center">
                                <FiThermometer className="mr-1" />
                                {location.temperatureRange}
                              </div>
                            )}
                            {location.humidityRange && (
                              <div className="text-xs text-gray-600 flex items-center">
                                <FiDroplet className="mr-1" />
                                {location.humidityRange}
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleViewDetails(location)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition hover:scale-105"
                              title="View Details"
                            >
                              <FiEye className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleEditLocation(location.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition hover:scale-105"
                              title="Edit Location"
                            >
                              <FiEdit className="w-4 h-4" />
                            </button>
                            
                            {currentOccupancy === 0 && (
                              <button
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setShowDeleteConfirm(true);
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition hover:scale-105"
                                title="Delete Location"
                              >
                                <FiTrash2 className="w-4 h-4" />
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
            
            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                  <span className="font-semibold">{filteredLocations.length}</span> locations • 
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-green-600 font-medium">{stats.activeLocations}</span> active • 
                  <span className="mx-2 text-gray-400">•</span>
                  <span className="text-blue-600 font-medium">{stats.zones}</span> zones
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={fetchLocations}
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
      {showDetails && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FiMapPin className="w-8 h-8 text-blue-600 mr-3" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Location Details
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                      {selectedLocation.locationCode} - {selectedLocation.locationName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-white rounded-lg transition shadow-sm hover:shadow"
                >
                  <FiXCircle className="w-6 h-6 text-gray-500 hover:text-gray-700" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Location Code</label>
                          <div className="font-medium text-blue-900">{selectedLocation.locationCode}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Location Name</label>
                          <div className="font-medium">{selectedLocation.locationName}</div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Type</label>
                        <div className="font-medium">{getLocationTypeLabel(selectedLocation.locationType)}</div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Zone</label>
                        <div className="font-medium">{selectedLocation.zone || 'N/A'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Storage Address */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Storage Address</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Rack</label>
                          <div className="font-medium">{selectedLocation.rack || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Shelf</label>
                          <div className="font-medium">{selectedLocation.shelf || 'N/A'}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Bin</label>
                          <div className="font-medium">{selectedLocation.bin || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Environmental Conditions */}
                  {(selectedLocation.temperatureRange || selectedLocation.humidityRange) && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Environmental Conditions</h3>
                      <div className="space-y-3">
                        {selectedLocation.temperatureRange && (
                          <div className="flex items-center">
                            <FiThermometer className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-xs text-gray-500">Temperature Range</div>
                              <div className="font-medium">{selectedLocation.temperatureRange}</div>
                            </div>
                          </div>
                        )}
                        {selectedLocation.humidityRange && (
                          <div className="flex items-center">
                            <FiDroplet className="w-4 h-4 text-gray-400 mr-2" />
                            <div>
                              <div className="text-xs text-gray-500">Humidity Range</div>
                              <div className="font-medium">{selectedLocation.humidityRange}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Capacity & Status */}
                <div className="space-y-6">
                  {/* Capacity Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Capacity Information</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 rounded-lg p-4 text-center">
                        <div className="text-xs text-blue-700 font-medium">Total Capacity</div>
                        <div className="text-2xl font-bold text-blue-900 mt-1">
                          {selectedLocation.capacity || 'Unlimited'}
                        </div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center">
                        <div className="text-xs text-green-700 font-medium">Current Occupancy</div>
                        <div className="text-2xl font-bold text-green-900 mt-1">
                          {selectedLocation.currentOccupancy || 0}
                        </div>
                      </div>
                      <div className="bg-yellow-50 rounded-lg p-4 text-center">
                        <div className="text-xs text-yellow-700 font-medium">Available</div>
                        <div className="text-2xl font-bold text-yellow-900 mt-1">
                          {selectedLocation.capacity ? 
                            (selectedLocation.capacity - (selectedLocation.currentOccupancy || 0)) : 
                            'Unlimited'}
                        </div>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-4 text-center">
                        <div className="text-xs text-purple-700 font-medium">Utilization</div>
                        <div className="text-lg font-bold text-purple-900 mt-1">
                          {selectedLocation.capacity && selectedLocation.capacity > 0 ? 
                            `${calculateUtilization(selectedLocation.currentOccupancy, selectedLocation.capacity)}%` : 
                            'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {selectedLocation.capacity && selectedLocation.capacity > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>0%</span>
                          <span>100%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${
                              parseFloat(calculateUtilization(selectedLocation.currentOccupancy, selectedLocation.capacity)) > 90 ? 'bg-red-500' :
                              parseFloat(calculateUtilization(selectedLocation.currentOccupancy, selectedLocation.capacity)) > 70 ? 'bg-yellow-500' :
                              'bg-green-500'
                            }`}
                            style={{ 
                              width: `${Math.min(parseFloat(calculateUtilization(selectedLocation.currentOccupancy, selectedLocation.capacity)), 100)}%` 
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Status Information */}
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-medium text-gray-700 mb-3">Status Information</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(selectedLocation.isActive, selectedLocation.isQuarantine)}`}>
                          {selectedLocation.isQuarantine ? 'QUARANTINE' : (selectedLocation.isActive ? 'ACTIVE' : 'INACTIVE')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700">Created By</span>
                        <span className="font-medium">{selectedLocation.createdBy || 'System'}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-gray-500">Created On</label>
                          <div className="text-sm">{new Date(selectedLocation.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Last Updated</label>
                          <div className="text-sm">{selectedLocation.updatedAt ? 
                            new Date(selectedLocation.updatedAt).toLocaleDateString() : 'Never'}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remarks */}
                  {selectedLocation.remarks && (
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Remarks</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedLocation.remarks}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Location ID: <span className="font-mono font-medium">{selectedLocation.id}</span>
                </div>
                <div className="flex space-x-4">
                  <button
                    onClick={() => handleEditLocation(selectedLocation.id)}
                    className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition flex items-center shadow-sm"
                  >
                    <FiEdit className="mr-2" />
                    Edit Location
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedLocation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                  <FiAlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Delete Location
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Are you sure you want to delete location <span className="font-semibold">{selectedLocation.locationCode}</span>? This action cannot be undone.
                </p>
                {selectedLocation.currentOccupancy > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-yellow-700">
                      ⚠️ This location has {selectedLocation.currentOccupancy} items. Deleting it will affect stock records.
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedLocation(null);
                  }}
                  className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLocation}
                  disabled={selectedLocation.currentOccupancy > 0}
                  className="px-6 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Location
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseLocations;