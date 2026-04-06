// src/pages/part/PartEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiSave, FiX, FiRefreshCw, FiArrowLeft,
  FiPackage, FiFileText, FiTag, FiAlertCircle,
  FiLink, FiCheckCircle, FiInfo, FiUpload,FiSearch
} from 'react-icons/fi';
import PartService from '../../services/partService';
import PSIService from '../../services/psiService';
import { toast } from 'react-toastify';

const PartEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    partNumber: '',
    partName: '',
    description: '',
    drawingNumber: '',
    revisionLevel: '00',
    partType: 'COMPONENT',
    classCode: 'CRITICAL',
    isActive: true,
    psiStandardIds: []
  });
  
  const [psiStandards, setPsiStandards] = useState([]);
  const [availablePSI, setAvailablePSI] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  
  // Part type options
  const partTypeOptions = [
    { value: 'ASSEMBLY', label: 'Assembly', icon: '🛠️', color: 'bg-blue-100 text-blue-800' },
    { value: 'COMPONENT', label: 'Component', icon: '⚙️', color: 'bg-green-100 text-green-800' },
    { value: 'SUB_ASSEMBLY', label: 'Sub-Assembly', icon: '🔩', color: 'bg-purple-100 text-purple-800' },
    { value: 'RAW_MATERIAL', label: 'Raw Material', icon: '📦', color: 'bg-amber-100 text-amber-800' },
    { value: 'FINISHED_GOOD', label: 'Finished Good', icon: '✅', color: 'bg-emerald-100 text-emerald-800' },
    { value: 'SEMI_FINISHED', label: 'Semi-Finished', icon: '🔄', color: 'bg-gray-100 text-gray-800' }
  ];
  
  // Class code options
  const classCodeOptions = [
    { value: 'CRITICAL', label: 'Critical (C)', color: 'bg-red-100 text-red-800', description: 'Critical safety/functional parts' },
    { value: 'MAJOR', label: 'Major (A)', color: 'bg-orange-100 text-orange-800', description: 'Major functional parts' },
    { value: 'MINOR', label: 'Minor (B)', color: 'bg-yellow-100 text-yellow-800', description: 'Minor cosmetic parts' },
    { value: 'GENERAL', label: 'General (G)', color: 'bg-gray-100 text-gray-800', description: 'General non-critical parts' }
  ];

  useEffect(() => {
    fetchPartData();
    fetchAvailablePSI();
  }, [id]);

  const fetchPartData = async () => {
    setLoading(true);
    try {
      const response = await PartService.getPartById(id);
      const part = response.data;
      
      setFormData({
        partNumber: part.partNumber,
        partName: part.partName,
        description: part.description || '',
        drawingNumber: part.drawingNumber || '',
        revisionLevel: part.revisionLevel || '00',
        partType: part.partType,
        classCode: part.classCode,
        isActive: part.isActive,
        psiStandardIds: part.linkedPsiStandards?.map(psi => psi.id) || []
      });
      
      setPsiStandards(part.linkedPsiStandards || []);
    } catch (error) {
      console.error('Error fetching part:', error);
      toast.error('Failed to load part data');
      navigate('/part/manage');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePSI = async () => {
    try {
      const response = await PSIService.getActivePSI();
      setAvailablePSI(response.data);
    } catch (error) {
      console.error('Error fetching PSI standards:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePSIStandard = (psiId) => {
    setFormData(prev => {
      const currentIds = [...prev.psiStandardIds];
      if (currentIds.includes(psiId)) {
        return {
          ...prev,
          psiStandardIds: currentIds.filter(id => id !== psiId)
        };
      } else {
        return {
          ...prev,
          psiStandardIds: [...currentIds, psiId]
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Prepare data for update
      const updateData = {
        partName: formData.partName,
        description: formData.description,
        drawingNumber: formData.drawingNumber,
        revisionLevel: formData.revisionLevel,
        partType: formData.partType,
        classCode: formData.classCode,
        isActive: formData.isActive,
        psiStandardIds: formData.psiStandardIds
      };
      
      await PartService.updatePart(id, updateData);
      
      toast.success('✅ Part updated successfully!');
      setTimeout(() => {
        navigate('/part/manage');
      }, 1500);
    } catch (error) {
      console.error('Error updating part:', error);
      toast.error(error.response?.data?.message || 'Failed to update part');
    } finally {
      setSaving(false);
    }
  };

  // Filter available PSI standards
  const filteredPSI = availablePSI.filter(psi => {
    const matchesSearch = psi.standardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         psi.standardName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || psi.standardType === filterType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-blue-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading Part Data</p>
          <p className="mt-2 text-gray-500">Fetching part information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
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
                  Edit Part
                </h1>
                <p className="text-gray-600 mt-2">
                  Update part details and linked inspection standards
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-lg">
                {formData.partNumber}
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-gray-600">Editing mode</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/part/manage')}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center"
            >
              <FiX className="mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-400 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 rounded-lg mr-3">
                <FiInfo className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
                <p className="text-sm text-gray-600">Essential part details and specifications</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Part Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part Name *
                </label>
                <input
                  type="text"
                  name="partName"
                  value={formData.partName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter part name"
                />
              </div>

              {/* Drawing Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Drawing Number
                </label>
                <input
                  type="text"
                  name="drawingNumber"
                  value={formData.drawingNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., DWG-1234"
                />
              </div>

              {/* Revision Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Revision Level
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="revisionLevel"
                    value={formData.revisionLevel}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., 00, 01, A, B"
                  />
                  <div className="absolute right-3 top-3 text-sm text-gray-500">
                    Rev.
                  </div>
                </div>
              </div>

              {/* Part Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part Type *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {partTypeOptions.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleSelectChange('partType', type.value)}
                      className={`px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center ${
                        formData.partType === type.value
                          ? `${type.color} border-2 border-blue-500`
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className="mr-2">{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter detailed description of the part..."
              />
            </div>
          </div>

          {/* Classification & Status Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-amber-100 rounded-lg mr-3">
                <FiAlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Classification & Status</h2>
                <p className="text-sm text-gray-600">Set part classification and active status</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Class Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Classification Code *
                </label>
                <div className="space-y-2">
                  {classCodeOptions.map((code) => (
                    <button
                      key={code.value}
                      type="button"
                      onClick={() => handleSelectChange('classCode', code.value)}
                      className={`w-full px-4 py-3 rounded-lg text-sm font-medium text-left transition flex items-center justify-between ${
                        formData.classCode === code.value
                          ? `${code.color} border-2 border-blue-500`
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{code.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{code.description}</div>
                      </div>
                      {formData.classCode === code.value && (
                        <FiCheckCircle className="w-5 h-5 text-blue-600" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Part Status
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${formData.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className="font-medium">
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                    </label>
                  </div>
                  <p className="text-sm text-gray-600">
                    {formData.isActive
                      ? 'This part is active and can be used in production and inspections.'
                      : 'This part is inactive and will not appear in active part lists.'}
                  </p>
                </div>

                {/* Revision Info */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Revision Details
                  </label>
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-700">Revision</div>
                        <div className="text-2xl font-bold text-blue-700">
                          {formData.revisionLevel || '00'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-700">Part Number</div>
                        <div className="text-lg font-semibold text-gray-900">
                          {formData.partNumber}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - PSI Standards */}
        <div className="space-y-6">
          {/* Linked PSI Standards Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-100 rounded-lg mr-3">
                <FiLink className="w-6 h-6 text-purple-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Inspection Standards</h2>
                <p className="text-sm text-gray-600">Link PSI standards for this part</p>
              </div>
            </div>

            {/* Search and Filter */}
            <div className="mb-4">
              <div className="relative mb-3">
                <FiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search standards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
              </div>
              
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
              >
                <option value="ALL">All Types</option>
                <option value="DIMENSIONAL">Dimensional</option>
                <option value="VISUAL">Visual</option>
                <option value="MATERIAL">Material</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="GENERAL">General</option>
              </select>
            </div>

            {/* Selected Standards Counter */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-700 font-medium">
                  {formData.psiStandardIds.length} standards linked
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, psiStandardIds: [] }))}
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>

            {/* PSI Standards List */}
            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
              {filteredPSI.length === 0 ? (
                <div className="text-center py-8">
                  <FiFileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No PSI standards found</p>
                  <p className="text-sm text-gray-500 mt-1">Try adjusting your search</p>
                </div>
              ) : (
                filteredPSI.map((psi) => {
                  const isSelected = formData.psiStandardIds.includes(psi.id);
                  const typeColors = {
                    DIMENSIONAL: 'bg-blue-100 text-blue-800',
                    VISUAL: 'bg-green-100 text-green-800',
                    MATERIAL: 'bg-amber-100 text-amber-800',
                    PERFORMANCE: 'bg-purple-100 text-purple-800',
                    GENERAL: 'bg-gray-100 text-gray-800'
                  };
                  
                  return (
                    <div
                      key={psi.id}
                      onClick={() => togglePSIStandard(psi.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-1">
                            <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                              typeColors[psi.standardType] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {psi.standardType}
                            </span>
                            <div className={`w-2 h-2 rounded-full ml-2 ${
                              psi.isActive ? 'bg-green-500' : 'bg-gray-400'
                            }`}></div>
                          </div>
                          <div className="font-semibold text-gray-900 text-sm">
                            {psi.standardCode}
                          </div>
                          <div className="text-sm text-gray-600 truncate">
                            {psi.standardName}
                          </div>
                          {psi.description && (
                            <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {psi.description}
                            </div>
                          )}
                        </div>
                        <div className="ml-3 flex-shrink-0">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <FiCheckCircle className="w-4 h-4 text-white" />
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Help Text */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <FiInfo className="inline mr-1 text-gray-400" />
                Select PSI standards to define inspection requirements for this part.
                These standards will be used during quality inspections.
              </p>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Part Number:</span>
                <span className="font-semibold">{formData.partNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Part Type:</span>
                <span className="font-semibold">
                  {partTypeOptions.find(t => t.value === formData.partType)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Classification:</span>
                <span className="font-semibold">
                  {classCodeOptions.find(c => c.value === formData.classCode)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revision:</span>
                <span className="font-semibold">Rev. {formData.revisionLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`font-semibold ${
                  formData.isActive ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {formData.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Linked Standards:</span>
                <span className="font-semibold">{formData.psiStandardIds.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/part/manage')}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Update Part
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartEdit;