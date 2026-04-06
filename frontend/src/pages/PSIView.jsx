// src/pages/PSIView.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiEye, FiEdit2, FiTrash2, FiSearch, FiFilter,
  FiDownload, FiRefreshCw, FiPlus, FiCheckCircle,
  FiXCircle, FiActivity, FiAlertCircle, FiTrendingUp
} from 'react-icons/fi';
import PSIService from '../services/psiService';
import toast from 'react-hot-toast';

const PSIView = () => {
  const [psiRecords, setPsiRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);

  const standardTypeLabels = {
    DIMENSIONAL: { label: 'Dimensional', color: 'bg-blue-100 text-blue-800' },
    VISUAL: { label: 'Visual', color: 'bg-green-100 text-green-800' },
    MATERIAL: { label: 'Material', color: 'bg-amber-100 text-amber-800' },
    PERFORMANCE: { label: 'Performance', color: 'bg-purple-100 text-purple-800' },
    SAFETY: { label: 'Safety', color: 'bg-red-100 text-red-800' },
    GENERAL: { label: 'General', color: 'bg-gray-100 text-gray-800' }
  };

  useEffect(() => {
    fetchPSIRecords();
  }, []);

  useEffect(() => {
    filterRecords();
  }, [searchTerm, filterType, filterStatus, psiRecords]);

  const fetchPSIRecords = async () => {
    setLoading(true);
    try {
      const response = await PSIService.getAllPSI();
      setPsiRecords(response.data);
      setFilteredRecords(response.data);
    } catch (error) {
      console.error('Error fetching PSI records:', error);
      toast.error('Failed to load PSI records');
    } finally {
      setLoading(false);
    }
  };

  const filterRecords = () => {
    let filtered = psiRecords;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(record =>
        record.standardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.standardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'ALL') {
      filtered = filtered.filter(record => record.standardType === filterType);
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(record => 
        filterStatus === 'ACTIVE' ? record.isActive : !record.isActive
      );
    }

    setFilteredRecords(filtered);
  };

  const handleViewDetails = (record) => {
    setSelectedRecord(record);
    setShowDetails(true);
  };

  const handleEdit = (id) => {
    // Navigate to edit page
    window.location.href = `/psi/edit/${id}`;
  };

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!recordToDelete) return;

    try {
      await PSIService.deactivatePSI(recordToDelete.id);
      toast.success('✅ PSI Standard deactivated successfully');
      fetchPSIRecords();
      setShowDeleteConfirm(false);
      setRecordToDelete(null);
    } catch (error) {
      console.error('Error deleting PSI:', error);
      toast.error('Failed to deactivate PSI standard');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStats = () => {
    const total = psiRecords.length;
    const active = psiRecords.filter(r => r.isActive).length;
    const dimensional = psiRecords.filter(r => r.standardType === 'DIMENSIONAL').length;
    
    return { total, active, dimensional };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading PSI records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PSI Standards</h1>
            <p className="text-gray-600 mt-2">
              Manage Product Standard Inspection (PSI) records
            </p>
          </div>
          <Link
            to="/psi/create"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center shadow-lg"
          >
            <FiPlus className="mr-2" />
            Create New PSI
          </Link>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Standards</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiActivity className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <FiTrendingUp className="mr-1" />
            <span>All PSI standards in system</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Standards</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-600">
            <FiCheckCircle className="mr-1" />
            <span>Ready for use in inspections</span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Dimensional Standards</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.dimensional}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiAlertCircle className="w-6 h-6 text-purple-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-600">
            <FiActivity className="mr-1" />
            <span>Dimensional inspection standards</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by code, name, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Type
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="ALL">All Types</option>
              <option value="DIMENSIONAL">Dimensional</option>
              <option value="VISUAL">Visual</option>
              <option value="MATERIAL">Material</option>
              <option value="PERFORMANCE">Performance</option>
              <option value="SAFETY">Safety</option>
              <option value="GENERAL">General</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center mt-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchPSIRecords}
              className="px-4 py-2 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
            <button className="px-4 py-2 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center">
              <FiDownload className="mr-2" />
              Export
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredRecords.length} of {psiRecords.length} records
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Standard Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Standard Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Version
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Created Date
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <FiFilter className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No PSI records found</p>
                      <p className="mt-2">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const typeInfo = standardTypeLabels[record.standardType] || 
                    { label: record.standardType, color: 'bg-gray-100 text-gray-800' };
                  
                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-blue-700">
                          {record.standardCode}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {record.standardName}
                        </div>
                        {record.description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {record.description}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        v{record.version}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            record.isActive ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <span className={`text-sm font-medium ${
                            record.isActive ? 'text-green-700' : 'text-gray-600'
                          }`}>
                            {record.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDate(record.createdAt)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleViewDetails(record)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                            title="View Details"
                          >
                            <FiEye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleEdit(record.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Edit"
                          >
                            <FiEdit2 className="w-5 h-5" />
                          </button>
                          {record.isActive && (
                            <button
                              onClick={() => handleDeleteClick(record)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Deactivate"
                            >
                              <FiTrash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showDetails && selectedRecord && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedRecord.standardName}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Code: <span className="font-semibold">{selectedRecord.standardCode}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <FiXCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-gray-900">{selectedRecord.description || 'No description provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Standard Type</label>
                    <div className="mt-1">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        standardTypeLabels[selectedRecord.standardType]?.color || 'bg-gray-100 text-gray-800'
                      }`}>
                        {standardTypeLabels[selectedRecord.standardType]?.label || selectedRecord.standardType}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Version</label>
                    <p className="mt-1 text-gray-900 font-semibold">v{selectedRecord.version}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1 flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        selectedRecord.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                      <span className={`font-medium ${
                        selectedRecord.isActive ? 'text-green-700' : 'text-gray-600'
                      }`}>
                        {selectedRecord.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created By</label>
                    <p className="mt-1 text-gray-900">{selectedRecord.createdBy || 'System'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created On</label>
                    <p className="mt-1 text-gray-900">{formatDate(selectedRecord.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Inspection Items Preview */}
              {selectedRecord.inspectionItems && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Inspection Checklist</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm overflow-auto max-h-64">
                      {JSON.stringify(JSON.parse(selectedRecord.inspectionItems), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && recordToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <FiTrash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Deactivate PSI Standard
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to deactivate <span className="font-semibold">{recordToDelete.standardCode}</span>? 
                This will mark it as inactive and it won't be available for new inspections.
              </p>
              
              <div className="flex justify-center space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setRecordToDelete(null);
                  }}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition"
                >
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PSIView;