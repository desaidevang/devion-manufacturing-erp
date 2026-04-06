// src/pages/part/PartView.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiEdit2, FiPackage, FiFileText,
  FiAlertCircle, FiClock, FiCalendar, FiUser,
  FiTarget, FiLink, FiCheckCircle, FiXCircle,
  FiPrinter, FiDownload, FiShare2, FiCopy,
  FiArchive, FiActivity, FiTrendingUp, FiDatabase
} from 'react-icons/fi';
import PartService from '../../services/partService';
import { toast } from 'react-toastify';

const PartView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [part, setPart] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Part type labels
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
  
  // Class code labels
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
    fetchPartData();
  }, [id]);

  const fetchPartData = async () => {
    setLoading(true);
    try {
      const response = await PartService.getPartById(id);
      setPart(response.data);
    } catch (error) {
      console.error('Error fetching part:', error);
      toast.error('Failed to load part data');
      navigate('/part/manage');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRevision = (revision) => {
    if (!revision) return 'Rev. 00';
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

  const handleCopyPartNumber = () => {
    navigator.clipboard.writeText(part.partNumber);
    toast.success('Part number copied to clipboard');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    toast.info('Export feature coming soon!');
  };

  const handleDeactivate = async () => {
    try {
      await PartService.deactivatePart(id);
      toast.success('✅ Part deactivated successfully');
      navigate('/part/manage');
    } catch (error) {
      console.error('Error deactivating part:', error);
      toast.error('Failed to deactivate part');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Part Details</p>
          <p className="mt-2 text-gray-500">Fetching part information...</p>
        </div>
      </div>
    );
  }

  if (!part) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
          <FiPackage className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Part Not Found</h2>
          <p className="text-gray-600 mb-6">The requested part could not be found.</p>
          <Link
            to="/part/manage"
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
          >
            <FiArrowLeft className="mr-2" />
            Back to Parts
          </Link>
        </div>
      </div>
    );
  }

  const typeInfo = partTypeLabels[part.partType] || 
    { label: part.partType, color: 'bg-gray-100 text-gray-800', icon: '📄' };
  
  const classInfo = classCodeLabels[part.classCode] || 
    { label: part.classCode, color: 'bg-gray-100 text-gray-800' };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center">
              <Link
                to="/part/manage"
                className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                  <FiPackage className="mr-3 text-blue-700" />
                  {part.partName}
                </h1>
                <div className="flex items-center mt-2 space-x-4">
                  <div className="flex items-center">
                    <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {part.partNumber}
                    </span>
                    <button
                      onClick={handleCopyPartNumber}
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                      title="Copy part number"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                  {part.drawingNumber && (
                    <div className="flex items-center text-sm text-gray-600">
                      <FiFileText className="mr-1" />
                      <span>{part.drawingNumber}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-1 ${part.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className={`text-sm ${part.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                      {part.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrint}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Print"
              >
                <FiPrinter className="w-5 h-5" />
              </button>
              <button
                onClick={handleExport}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                title="Export"
              >
                <FiDownload className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(`/part/edit/${id}`)}
                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center"
              >
                <FiEdit2 className="mr-2" />
                Edit
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-400 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-700 font-medium">Part Age</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{getPartAge(part.createdAt)}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiClock className="w-6 h-6 text-blue-700" />
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            Created: {formatDate(part.createdAt)}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-700 font-medium">Linked Standards</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {part.linkedPsiStandards?.length || 0}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiTarget className="w-6 h-6 text-green-700" />
            </div>
          </div>
          <div className="mt-2 text-xs text-green-600">
            Inspection standards
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-purple-700 font-medium">Part Type</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{typeInfo.short}</p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiPackage className="w-6 h-6 text-purple-700" />
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-600">
            {typeInfo.label}
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border border-amber-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-amber-700 font-medium">Classification</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {classInfo.label.split(' ')[0].charAt(0)}
              </p>
            </div>
            <div className="p-3 bg-white rounded-lg shadow-sm">
              <FiAlertCircle className="w-6 h-6 text-amber-700" />
            </div>
          </div>
          <div className="mt-2 text-xs text-amber-600">
            {classInfo.label}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <FiFileText className="mr-3 text-blue-700" />
              Basic Information
            </h2>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">Description</label>
                <p className="text-gray-900 bg-gray-50 rounded-lg p-4 min-h-[100px]">
                  {part.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2">Drawing Number</label>
                  <div className="flex items-center">
                    <FiFileText className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-gray-900 font-medium">
                      {part.drawingNumber || 'Not specified'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2">Revision Level</label>
                  <div className="flex items-center">
                    <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-lg font-bold">
                      {formatRevision(part.revisionLevel)}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2">Part Type</label>
                  <div className="flex items-center">
                    <span className={`px-4 py-2 rounded-lg font-medium flex items-center ${typeInfo.color}`}>
                      <span className="mr-2 text-lg">{typeInfo.icon}</span>
                      {typeInfo.label}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2">Classification</label>
                  <div className="flex items-center">
                    <span className={`px-4 py-2 rounded-lg font-medium flex items-center ${classInfo.color} border`}>
                      <FiAlertCircle className="mr-2" />
                      {classInfo.label}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Linked PSI Standards Card */}
          {part.linkedPsiStandards && part.linkedPsiStandards.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <FiTarget className="mr-3 text-green-700" />
                Linked Inspection Standards
                <span className="ml-3 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  {part.linkedPsiStandards.length}
                </span>
              </h2>
              
              <div className="space-y-4">
                {part.linkedPsiStandards.map((psi) => {
                  const typeColors = {
                    DIMENSIONAL: 'bg-blue-100 text-blue-800 border-blue-200',
                    VISUAL: 'bg-green-100 text-green-800 border-green-200',
                    MATERIAL: 'bg-amber-100 text-amber-800 border-amber-200',
                    PERFORMANCE: 'bg-purple-100 text-purple-800 border-purple-200',
                    GENERAL: 'bg-gray-100 text-gray-800 border-gray-200'
                  };
                  
                  return (
                    <div key={psi.id} className={`p-4 rounded-lg border ${typeColors[psi.standardType] || 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="font-bold text-gray-900 text-lg mr-3">
                              {psi.standardCode}
                            </span>
                            <span className={`px-2 py-1 text-xs font-semibold rounded ${typeColors[psi.standardType]}`}>
                              {psi.standardType}
                            </span>
                            <div className={`ml-3 w-2 h-2 rounded-full ${psi.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            <span className={`ml-1 text-xs ${psi.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                              {psi.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          
                          <div className="mb-2">
                            <h4 className="font-medium text-gray-900">{psi.standardName}</h4>
                            {psi.description && (
                              <p className="text-sm text-gray-600 mt-1">{psi.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <button
                          onClick={() => window.open(`/psi/view`, '_blank')}
                          className="ml-4 p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="View Standard Details"
                        >
                          <FiLink className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Metadata & Actions */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <FiActivity className="mr-3 text-blue-700" />
              Status & Metadata
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">Current Status</label>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-2 ${part.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                    <span className={`font-medium ${part.isActive ? 'text-green-700' : 'text-gray-600'}`}>
                      {part.isActive ? 'Active • Ready for use' : 'Inactive • Archived'}
                    </span>
                  </div>
                  {part.isActive && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      Deactivate
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">Created Information</label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <FiUser className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Created By</div>
                      <div className="font-medium">{part.createdBy || 'System'}</div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <FiCalendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-500">Created On</div>
                      <div className="font-medium">{formatDate(part.createdAt)}</div>
                    </div>
                  </div>
                  {part.updatedAt && (
                    <div className="flex items-center">
                      <FiClock className="w-4 h-4 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm text-gray-500">Last Updated</div>
                        <div className="font-medium">{formatDate(part.updatedAt)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2">Part Details</label>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-blue-700">Part Number:</span>
                      <span className="font-bold">{part.partNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Drawing:</span>
                      <span>{part.drawingNumber || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Revision:</span>
                      <span className="font-semibold">{formatRevision(part.revisionLevel)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700">Age:</span>
                      <span>{getPartAge(part.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
            
            <div className="space-y-3">
              <button
                onClick={() => navigate(`/part/edit/${id}`)}
                className="w-full px-4 py-3 bg-blue-50 text-blue-700 font-medium rounded-lg hover:bg-blue-100 transition flex items-center justify-center"
              >
                <FiEdit2 className="mr-2" />
                Edit Part Details
              </button>
              
              <button
                onClick={handleCopyPartNumber}
                className="w-full px-4 py-3 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition flex items-center justify-center"
              >
                <FiCopy className="mr-2" />
                Copy Part Number
              </button>
              
              <button
                onClick={handlePrint}
                className="w-full px-4 py-3 bg-gray-50 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition flex items-center justify-center"
              >
                <FiPrinter className="mr-2" />
                Print Details
              </button>
              
              {part.isActive && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full px-4 py-3 bg-red-50 text-red-700 font-medium rounded-lg hover:bg-red-100 transition flex items-center justify-center"
                >
                  <FiArchive className="mr-2" />
                  Deactivate Part
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
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
                      You are about to archive <span className="font-bold">{part.partNumber}</span>. 
                      This part will be marked as inactive.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg ${typeInfo.color.replace('text-', 'bg-')} bg-opacity-20 mr-3`}>
                    <span className="text-lg">{typeInfo.icon}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{part.partName}</div>
                    <div className="text-sm text-gray-600">{part.partNumber}</div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeactivate}
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

export default PartView;