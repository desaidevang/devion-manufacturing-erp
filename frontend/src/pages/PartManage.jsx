// src/pages/PartManage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FiEye, FiEdit2, FiTrash2, FiSearch, FiFilter,
  FiDownload, FiRefreshCw, FiPlus, FiCheckCircle,
  FiXCircle, FiActivity, FiAlertCircle, FiTrendingUp,
  FiPackage, FiTarget, FiLink, FiFileText, FiCalendar,
  FiUser, FiDatabase, FiArchive, FiClock
} from 'react-icons/fi';
import PartService from '../services/partService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PartManage = () => {
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ACTIVE');
  const [filterClass, setFilterClass] = useState('ALL');
  const [selectedPart, setSelectedPart] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAllStandards, setShowAllStandards] = useState(false);
  const [partToDelete, setPartToDelete] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    assembly: 0,
    critical: 0,
    component: 0,
    subAssembly: 0
  });

  // Enhanced type labels with icons
  const partTypeLabels = {
    ASSEMBLY: { 
      label: 'Assembly', 
      color: 'bg-blue-100 text-blue-800',
      icon: '🛠️',
      short: 'ASSY'
    },
    COMPONENT: { 
      label: 'Component', 
      color: 'bg-green-100 text-green-800',
      icon: '⚙️',
      short: 'COMP'
    },
    SUB_ASSEMBLY: { 
      label: 'Sub-Assembly', 
      color: 'bg-purple-100 text-purple-800',
      icon: '🔩',
      short: 'SUB'
    },
    RAW_MATERIAL: { 
      label: 'Raw Material', 
      color: 'bg-amber-100 text-amber-800',
      icon: '📦',
      short: 'RAW'
    },
    FINISHED_GOOD: { 
      label: 'Finished Good', 
      color: 'bg-emerald-100 text-emerald-800',
      icon: '✅',
      short: 'FIN'
    },
    SEMI_FINISHED: { 
      label: 'Semi-Finished', 
      color: 'bg-gray-100 text-gray-800',
      icon: '🔄',
      short: 'SEMI'
    }
  };

  // Enhanced class code labels
  const classCodeLabels = {
    CRITICAL: { 
      label: 'Critical (C)', 
      color: 'bg-red-100 text-red-800 border-red-300',
      level: 'HIGH',
      priority: 1
    },
    MAJOR: { 
      label: 'Major (A)', 
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      level: 'MEDIUM',
      priority: 2
    },
    MINOR: { 
      label: 'Minor (B)', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      level: 'LOW',
      priority: 3
    },
    GENERAL: { 
      label: 'General (G)', 
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      level: 'MINIMAL',
      priority: 4
    }
  };

  useEffect(() => {
    fetchParts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [searchTerm, filterType, filterStatus, filterClass, parts]);

  const fetchParts = async () => {
  setLoading(true);
  try {
    const response = await PartService.getAllParts();
    console.log('Parts response:', response.data); // Add this line
    
    // Log first part's linked PSI standards
    if (response.data && response.data.length > 0) {
      console.log('First part linked PSI:', response.data[0].linkedPsiStandards);
      console.log('First PSI isActive:', response.data[0].linkedPsiStandards?.[0]?.isActive);
    }
    
    setParts(response.data);
    setFilteredParts(response.data);
    calculateStats(response.data);
    toast.success(`Loaded ${response.data.length} parts`, { autoClose: 2000 });
  } catch (error) {
    console.error('Error fetching parts:', error);
    toast.error('Failed to load parts');
  } finally {
    setLoading(false);
  }
};


  const calculateStats = (partsData) => {
    const stats = {
      total: partsData.length,
      active: partsData.filter(p => p.isActive).length,
      assembly: partsData.filter(p => p.partType === 'ASSEMBLY').length,
      component: partsData.filter(p => p.partType === 'COMPONENT').length,
      subAssembly: partsData.filter(p => p.partType === 'SUB_ASSEMBLY').length,
      critical: partsData.filter(p => p.classCode === 'CRITICAL').length,
      major: partsData.filter(p => p.classCode === 'MAJOR').length,
      minor: partsData.filter(p => p.classCode === 'MINOR').length,
      general: partsData.filter(p => p.classCode === 'GENERAL').length
    };
    setStats(stats);
  };

  const filterParts = () => {
    let filtered = parts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.drawingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== 'ALL') {
      filtered = filtered.filter(part => part.partType === filterType);
    }

    // Status filter
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(part => 
        filterStatus === 'ACTIVE' ? part.isActive : !part.isActive
      );
    }

    // Class filter
    if (filterClass !== 'ALL') {
      filtered = filtered.filter(part => part.classCode === filterClass);
    }

    // Sort by part number
    filtered.sort((a, b) => a.partNumber.localeCompare(b.partNumber));

    setFilteredParts(filtered);
  };

  const handleViewDetails = (part) => {
    setSelectedPart(part);
    setShowDetails(true);
  };

  const handleEdit = (id) => {
    // Navigate to edit page
    window.location.href = `/part/edit/${id}`;
  };

  const handleDeleteClick = (part) => {
    setPartToDelete(part);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!partToDelete) return;

    try {
      await PartService.deactivatePart(partToDelete.id);
      toast.success(`✅ Part ${partToDelete.partNumber} deactivated successfully`);
      fetchParts();
      setShowDeleteConfirm(false);
      setPartToDelete(null);
    } catch (error) {
      console.error('Error deleting part:', error);
      toast.error('Failed to deactivate part');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatRevision = (revision) => {
    if (!revision) return 'Rev. 00';
    // Remove non-numeric characters and pad
    const revNum = revision.replace(/\D/g, '');
    const padded = revNum.padStart(2, '0');
    return `Rev. ${padded}`;
  };

  const getPartAge = (createdAt) => {
    if (!createdAt) return '';
    const created = new Date(createdAt);
    const now = new Date();
    const diffMonths = (now.getFullYear() - created.getFullYear()) * 12 + 
                      (now.getMonth() - created.getMonth());
    
    if (diffMonths < 1) return 'New';
    if (diffMonths === 1) return '1 month';
    if (diffMonths < 12) return `${diffMonths} months`;
    
    const years = Math.floor(diffMonths / 12);
    return years === 1 ? '1 year' : `${years} years`;
  };

  const handleExport = () => {
    // Implement export functionality
    toast.info('Export feature coming soon!');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Parts</p>
          <p className="mt-2 text-gray-500">Fetching your part database...</p>
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
              Part Master
            </h1>
            <p className="text-gray-600 mt-2">
              Manage parts and link inspection standards
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={fetchParts}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
            <Link
              to="/part/create"
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center shadow-lg"
            >
              <FiPlus className="mr-2" />
              Create New Part
            </Link>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-400 rounded-full"></div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Parts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiDatabase className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-blue-700">
            <FiTrendingUp className="mr-2" />
            <span>All parts in system</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Active Parts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.active}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiCheckCircle className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-700">
            <FiActivity className="mr-2" />
            <span>Ready for production</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Critical Parts</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.critical}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiAlertCircle className="w-6 h-6 text-purple-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-purple-700">
            <FiAlertCircle className="mr-2" />
            <span>Critical classification</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Assemblies</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.assembly}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiPackage className="w-6 h-6 text-amber-700" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-amber-700">
            <FiPackage className="mr-2" />
            <span>Assembly type parts</span>
          </div>
        </div>
      </div>

      {/* Quick Stats Bar */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.component}</div>
              <div className="text-xs text-gray-600">Components</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.subAssembly}</div>
              <div className="text-xs text-gray-600">Sub-Assemblies</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.major}</div>
              <div className="text-xs text-gray-600">Major (A)</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.minor}</div>
              <div className="text-xs text-gray-600">Minor (B)</div>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Last updated: {formatDate(new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by part number, name, drawing, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                >
                  <FiXCircle className="w-4 h-4" />
                </button>
              )}
            </div>
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
              {Object.entries(partTypeLabels).map(([value, info]) => (
                <option key={value} value={value}>
                  {info.icon} {info.label}
                </option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FiAlertCircle className="inline mr-1" /> Class
            </label>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              <option value="ALL">All Classes</option>
              {Object.entries(classCodeLabels).map(([value, info]) => (
                <option key={value} value={value}>
                  {info.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {['ACTIVE', 'INACTIVE', 'ALL'].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    filterStatus === status
                      ? 'bg-blue-100 text-blue-700 border border-blue-300'
                      : 'text-gray-600 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  {status === 'ACTIVE' ? 'Active' : status === 'INACTIVE' ? 'Inactive' : 'All'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center"
            >
              <FiDownload className="mr-2" />
              Export
            </button>
            <div className="text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredParts.length}</span> of{' '}
              <span className="font-semibold">{parts.length}</span> parts
            </div>
          </div>
        </div>
      </div>

      {/* Parts Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {filteredParts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-24 h-24 mx-auto mb-6 text-gray-300">
              <FiPackage className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No parts found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {searchTerm || filterType !== 'ALL' || filterStatus !== 'ACTIVE' || filterClass !== 'ALL'
                ? 'Try adjusting your search or filters to find what you are looking for.'
                : 'Get started by creating your first part.'}
            </p>
            <Link
              to="/part/create"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
            >
              <FiPlus className="mr-2" />
              Create New Part
            </Link>
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
                      Type & Class
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Revision & Age
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      PSI Standards
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
                  {filteredParts.map((part) => {
                    const typeInfo = partTypeLabels[part.partType] || 
                      { label: part.partType, color: 'bg-gray-100 text-gray-800', icon: '📄' };
                    
                    const classInfo = classCodeLabels[part.classCode] || 
                      { label: part.classCode, color: 'bg-gray-100 text-gray-800' };
                    
                    return (
                      <tr 
                        key={part.id} 
                        className="hover:bg-gray-50 transition group"
                        onClick={() => handleViewDetails(part)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div className={`p-2 rounded-lg ${typeInfo.color.replace('text-', 'bg-')} bg-opacity-20 mr-3`}>
                              <span className="text-lg">{typeInfo.icon}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center">
                                <span className="text-sm font-semibold text-blue-700 truncate">
                                  {part.partNumber}
                                </span>
                                <span className="ml-2 text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                                  {typeInfo.short}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-gray-900 truncate mt-1">
                                {part.partName}
                              </div>
                              {part.drawingNumber && (
                                <div className="text-xs text-gray-500 flex items-center mt-1">
                                  <FiFileText className="mr-1" />
                                  Drawing: {part.drawingNumber}
                                </div>
                              )}
                              {part.description && (
                                <div className="text-xs text-gray-500 truncate mt-1 max-w-xs">
                                  {part.description}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div>
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${typeInfo.color} border`}>
                                <span className="mr-1">{typeInfo.icon}</span>
                                {typeInfo.label}
                              </span>
                            </div>
                            <div>
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${classInfo.color} border`}>
                                <FiAlertCircle className="mr-1" />
                                {classInfo.label}
                              </span>
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="space-y-2">
                            <div className="flex items-center">
                              <FiClock className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-semibold text-gray-900">
                                {formatRevision(part.revisionLevel)}
                              </span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                              <span>{getPartAge(part.createdAt)} old</span>
                            </div>
                            <div className="text-xs text-gray-500">
                              Created: {formatDate(part.createdAt)}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex flex-col space-y-2">
                            <div className="flex items-center">
                              <FiTarget className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                              <span className="text-sm font-medium text-gray-900">
                                {part.linkedPsiStandards?.length || 0} standards
                              </span>
                            </div>
                            {part.linkedPsiStandards && part.linkedPsiStandards.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {part.linkedPsiStandards.slice(0, 3).map(psi => (
                                  <span 
                                    key={psi.id}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-lg border border-gray-200"
                                    title={`${psi.standardCode}: ${psi.standardName}`}
                                  >
                                    <FiLink className="w-3 h-3 mr-1" />
                                    {psi.standardCode}
                                  </span>
                                ))}
                                {part.linkedPsiStandards.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg">
                                    +{part.linkedPsiStandards.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                            {(!part.linkedPsiStandards || part.linkedPsiStandards.length === 0) && (
                              <span className="text-xs text-gray-400 italic">No standards linked</span>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full mr-2 ${part.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                            <div className="flex flex-col">
                              <span className={`text-sm font-medium ${part.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                                {part.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {part.createdBy && (
                                <span className="text-xs text-gray-500 flex items-center mt-1">
                                  <FiUser className="mr-1" />
                                  {part.createdBy}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewDetails(part);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                              title="View Details"
                            >
                              <FiEye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(part.id);
                              }}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                              title="Edit"
                            >
                              <FiEdit2 className="w-5 h-5" />
                            </button>
                            {part.isActive && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(part);
                                }}
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
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Table Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-between items-center">
                <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                  Showing <span className="font-semibold">{filteredParts.length}</span> parts • 
                  <span className="mx-2">•</span>
                  {stats.active} active • {stats.critical} critical
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-xs">
                    <span className="text-gray-500">Updated: </span>
                    <span className="font-medium">{formatDate(new Date().toISOString())}</span>
                  </div>
                  <button
                    onClick={fetchParts}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
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
{showAllStandards && selectedPart && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              All Linked Inspection Standards
            </h2>
            <p className="text-sm text-gray-600 mt-1 flex items-center">
              <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                {selectedPart.partNumber} - {selectedPart.partName}
              </span>
              <span className="text-gray-500">
                {selectedPart.linkedPsiStandards?.length || 0} standards linked
              </span>
            </p>
          </div>
          <button
            onClick={() => setShowAllStandards(false)}
            className="p-2 hover:bg-white rounded-lg transition shadow-sm"
          >
            <FiXCircle className="w-6 h-6 text-gray-500" />
          </button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
        {selectedPart.linkedPsiStandards && selectedPart.linkedPsiStandards.length > 0 ? (
          <div className="space-y-4">
            {selectedPart.linkedPsiStandards.map((psi) => (
              <div key={psi.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-300 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <span className="text-lg font-bold text-gray-900 mr-3">{psi.standardCode}</span>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${
                        psi.standardType === 'VISUAL' ? 'bg-purple-100 text-purple-800' :
                        psi.standardType === 'DIMENSIONAL' ? 'bg-blue-100 text-blue-800' :
                        psi.standardType === 'FUNCTIONAL' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {psi.standardType}
                      </span>
                      <span className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                        psi.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {psi.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="mb-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-1">Standard Name</h4>
                      <p className="text-gray-900">{psi.standardName}</p>
                    </div>
                    
                    {psi.description && (
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
                        <p className="text-gray-600 text-sm">{psi.description}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 text-sm">
                      {psi.applicableMaterial && (
                        <div>
                          <span className="text-gray-500">Material: </span>
                          <span className="font-medium">{psi.applicableMaterial}</span>
                        </div>
                      )}
                      {psi.sampleSize && (
                        <div>
                          <span className="text-gray-500">Sample Size: </span>
                          <span className="font-medium">{psi.sampleSize}</span>
                        </div>
                      )}
                      {psi.inspectionMethod && (
                        <div>
                          <span className="text-gray-500">Method: </span>
                          <span className="font-medium">{psi.inspectionMethod}</span>
                        </div>
                      )}
                    </div>
                    
                    {(psi.acceptanceCriteria || psi.referenceDocument) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex flex-wrap gap-2">
                          {psi.acceptanceCriteria && (
                            <span className="px-2 py-1 bg-amber-50 text-amber-700 text-xs rounded border border-amber-200">
                              Criteria: {psi.acceptanceCriteria}
                            </span>
                          )}
                          {psi.referenceDocument && (
                            <span className="px-2 py-1 bg-gray-50 text-gray-700 text-xs rounded border border-gray-200 flex items-center">
                              <FiFileText className="mr-1" />
                              Ref: {psi.referenceDocument}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="ml-4 flex-shrink-0">
                    <button
                      onClick={() => {
                        // Navigate to PSI edit page or open PSI details
                        window.open(`/psi/view/${psi.id}`, '_blank');
                      }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="View Standard Details"
                    >
                      <FiEye className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-3">
              <FiTarget className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Standards Linked</h3>
            <p className="text-gray-600 mb-6">This part doesn't have any inspection standards linked yet.</p>
            <button
              onClick={() => {
                setShowAllStandards(false);
                setShowDetails(false);
                handleEdit(selectedPart.id);
              }}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
            >
              <FiLink className="inline mr-2" />
              Link Inspection Standards
            </button>
          </div>
        )}
        
        <div className="flex justify-end space-x-4 pt-6 mt-6 border-t border-gray-200">
          <button
            onClick={() => setShowAllStandards(false)}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
          >
            Close
          </button>
          {selectedPart.linkedPsiStandards && selectedPart.linkedPsiStandards.length > 0 && (
            <button
              onClick={() => {
                setShowAllStandards(false);
                setShowDetails(false);
                handleEdit(selectedPart.id);
              }}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
            >
              <FiEdit2 className="inline mr-2" />
              Manage Standards
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}
      {/* Enhanced Details Modal */}
      {showDetails && selectedPart && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${partTypeLabels[selectedPart.partType]?.color.replace('text-', 'bg-')} bg-opacity-20 mr-4`}>
                    <span className="text-2xl">{partTypeLabels[selectedPart.partType]?.icon}</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {selectedPart.partName}
                    </h2>
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <span className="font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                        {selectedPart.partNumber}
                      </span>
                      {selectedPart.drawingNumber && (
                        <>
                          <FiFileText className="mr-1" />
                          <span className="font-semibold">{selectedPart.drawingNumber}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="p-2 hover:bg-white rounded-lg transition shadow-sm"
                >
                  <FiXCircle className="w-6 h-6 text-gray-500" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiFileText className="mr-2" />
                      Part Information
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-gray-500">Description</label>
                        <p className="mt-1 text-gray-900">{selectedPart.description || 'No description provided'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs text-gray-500">Revision</label>
                          <div className="mt-1">
                            <span className="px-3 py-1.5 bg-blue-100 text-blue-800 rounded-lg text-sm font-semibold">
                              {formatRevision(selectedPart.revisionLevel)}
                            </span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500">Age</label>
                          <p className="mt-1 text-gray-900 font-medium">{getPartAge(selectedPart.createdAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiUser className="mr-2" />
                      Created By
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs text-gray-500">User</label>
                        <p className="mt-1 text-gray-900 font-medium">{selectedPart.createdBy || 'System'}</p>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Created On</label>
                        <p className="mt-1 text-gray-900">{formatDate(selectedPart.createdAt)}</p>
                      </div>
                      {selectedPart.updatedAt && (
                        <div>
                          <label className="text-xs text-gray-500">Last Updated</label>
                          <p className="mt-1 text-gray-900">{formatDate(selectedPart.updatedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                      <FiPackage className="mr-2" />
                      Classification
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs text-gray-500">Part Type</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                            partTypeLabels[selectedPart.partType]?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            <span className="mr-2">{partTypeLabels[selectedPart.partType]?.icon}</span>
                            {partTypeLabels[selectedPart.partType]?.label || selectedPart.partType}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Class Code</label>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium ${
                            classCodeLabels[selectedPart.classCode]?.color || 'bg-gray-100 text-gray-800'
                          }`}>
                            <FiAlertCircle className="mr-2" />
                            {classCodeLabels[selectedPart.classCode]?.label || selectedPart.classCode}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500">Status</label>
                        <div className="mt-1 flex items-center">
                          <div className={`w-3 h-3 rounded-full mr-2 ${selectedPart.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className={`font-medium ${selectedPart.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                            {selectedPart.isActive ? 'Active • Ready for use' : 'Inactive • Archived'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Linked PSI Standards Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-sm font-medium text-gray-700 flex items-center">
      <FiTarget className="mr-2" />
      Linked Inspection Standards
      <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
        {selectedPart.linkedPsiStandards?.length || 0}
      </span>
    </h3>
    {selectedPart.linkedPsiStandards && selectedPart.linkedPsiStandards.length > 0 && (
      <button
        onClick={() => setShowAllStandards(true)}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center"
      >
        View All
        <FiEye className="ml-1" />
      </button>
    )}
  </div>
  
  {selectedPart.linkedPsiStandards && selectedPart.linkedPsiStandards.length > 0 ? (
    <div className="space-y-2 max-h-60 overflow-y-auto">
      {selectedPart.linkedPsiStandards.map((psi) => (
        <div key={psi.id} className="flex items-center justify-between bg-white p-3 rounded border hover:bg-gray-50 transition">
          <div className="flex-1 min-w-0">
            <div className="flex items-center">
              <span className="font-semibold text-gray-900 text-sm">{psi.standardCode}</span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                {psi.standardType}
              </span>
            </div>
            <div className="text-xs text-gray-600 truncate mt-1">{psi.standardName}</div>
            {psi.description && (
              <div className="text-xs text-gray-500 mt-1 line-clamp-2">{psi.description}</div>
            )}
          </div>
          <div className="ml-3 flex-shrink-0">
            <span className={`px-2 py-1 text-xs font-medium rounded ${
              psi.isActive 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {psi.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-4">
      <div className="text-gray-400 mb-2">
        <FiTarget className="w-8 h-8 mx-auto" />
      </div>
      <p className="text-sm text-gray-600">No inspection standards linked</p>
      <p className="text-xs text-gray-500 mt-1">Link standards to define inspection criteria</p>
      <button
        onClick={() => {
          setShowDetails(false);
          handleEdit(selectedPart.id);
        }}
        className="mt-3 px-4 py-2 text-sm bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition"
      >
        <FiLink className="inline mr-1" />
        Link Standards
      </button>
    </div>
  )}
</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowDetails(false);
                    handleEdit(selectedPart.id);
                  }}
                  className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Edit Part
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {showDeleteConfirm && partToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                    <FiArchive className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Archive Part</h3>
                  <p className="text-sm text-gray-600">Mark part as inactive</p>
                </div>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <FiAlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-red-800">
                      You are about to archive <span className="font-bold">{partToDelete.partNumber}</span>. 
                      This will:
                    </p>
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                      <li>Mark the part as inactive</li>
                      <li>Hide it from active part lists</li>
                      <li>Prevent new inspections for this part</li>
                      <li>Existing data will be preserved</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${partTypeLabels[partToDelete.partType]?.color.replace('text-', 'bg-')} bg-opacity-20 mr-3`}>
                    <span className="text-lg">{partTypeLabels[partToDelete.partType]?.icon}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{partToDelete.partName}</div>
                    <div className="text-sm text-gray-600">{partToDelete.partNumber}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setPartToDelete(null);
                  }}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-5 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition flex-1 flex items-center justify-center"
                >
                  <FiArchive className="mr-2" />
                  Archive Part
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PartManage;