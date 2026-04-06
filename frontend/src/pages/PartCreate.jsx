// src/pages/PartCreate.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSave, FiX, FiCheck, FiAlertCircle, 
  FiPackage, FiGrid, FiList, FiTarget,
  FiPlus, FiSearch, FiRefreshCw, FiLink
} from 'react-icons/fi';
import PartService from '../services/partService';
import { useAuth } from '../contexts/AuthContext';
import PSIService from '../services/psiService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PartCreate = () => {
  const navigate = useNavigate();
  
  // Updated state to match backend DTO field names
  const [partData, setPartData] = useState({
    partNumber: '',
    partName: '',
    description: '',
    drawingNumber: '',
    revisionLevel: '00',  // Changed from revisionLevel to revisionNumber
    partType: 'COMPONENT',
    classCode: 'CRITICAL',
    psiStandardIds: []
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [availablePsi, setAvailablePsi] = useState([]);
  const [selectedPsi, setSelectedPsi] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingPsi, setLoadingPsi] = useState(false);
  const { user } = useAuth();

  // Part types - ensure these match your enum exactly
  const partTypes = [
    { value: 'ASSEMBLY', label: 'Assembly', color: 'text-blue-600' },
    { value: 'COMPONENT', label: 'Component', color: 'text-green-600' },
    { value: 'SUB_ASSEMBLY', label: 'Sub-Assembly', color: 'text-purple-600' },
    { value: 'RAW_MATERIAL', label: 'Raw Material', color: 'text-amber-600' },
    { value: 'FINISHED_GOOD', label: 'Finished Good', color: 'text-emerald-600' },
    { value: 'SEMI_FINISHED', label: 'Semi-Finished', color: 'text-gray-600' }
  ];

  // Class codes - ensure these match your enum exactly
  const classCodes = [
    { value: 'CRITICAL', label: 'Critical (C)', color: 'bg-red-100 text-red-800' },
    { value: 'MAJOR', label: 'Major (A)', color: 'bg-orange-100 text-orange-800' },
    { value: 'MINOR', label: 'Minor (B)', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'GENERAL', label: 'General (G)', color: 'bg-gray-100 text-gray-800' }
  ];

  // Load available PSI standards
  useEffect(() => {
    fetchPSIStandards();
  }, []);

  const fetchPSIStandards = async () => {
    setLoadingPsi(true);
    try {
      const response = await PSIService.getActivePSI();
      
      // Remove duplicates based on ID
      const uniquePsi = response.data.reduce((acc, current) => {
        const x = acc.find(item => item.id === current.id);
        if (!x) {
          return acc.concat([current]);
        } else {
          console.warn(`Duplicate ID found: ${current.id} - ${current.standardCode}`);
          return acc;
        }
      }, []);
      
      console.log(`Original: ${response.data.length}, Unique: ${uniquePsi.length}`);
      
      setAvailablePsi(uniquePsi);
    } catch (error) {
      console.error('Error fetching PSI standards:', error);
      toast.error('Failed to load PSI standards');
    } finally {
      setLoadingPsi(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPartData(prev => ({
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

  // Handle radio button changes for partType and classCode
  const handleRadioChange = (name, value) => {
    setPartData(prev => ({
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

  const togglePsiSelection = (psiId) => {
    const isSelected = partData.psiStandardIds.includes(psiId);
    
    if (isSelected) {
      // Remove from selection
      setPartData(prev => ({
        ...prev,
        psiStandardIds: prev.psiStandardIds.filter(id => id !== psiId)
      }));
      
      // Remove from selected list
      setSelectedPsi(prev => prev.filter(psi => psi.id !== psiId));
    } else {
      // Add to selection
      const psiToAdd = availablePsi.find(psi => psi.id === psiId);
      if (psiToAdd) {
        setPartData(prev => ({
          ...prev,
          psiStandardIds: [...prev.psiStandardIds, psiId]
        }));
        setSelectedPsi(prev => [...prev, psiToAdd]);
      }
    }
  };

  const removeSelectedPsi = (psiId) => {
    setPartData(prev => ({
      ...prev,
      psiStandardIds: prev.psiStandardIds.filter(id => id !== psiId)
    }));
    setSelectedPsi(prev => prev.filter(psi => psi.id !== psiId));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!partData.partNumber.trim()) {
      newErrors.partNumber = 'Part number is required';
    } else if (partData.partNumber.length < 3) {
      newErrors.partNumber = 'Part number must be at least 3 characters';
    }
    
    if (!partData.partName.trim()) {
      newErrors.partName = 'Part name is required';
    }
    
    if (!partData.partType) {
      newErrors.partType = 'Part type is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setLoading(true);
    try {
      // Log the data being sent
      console.log('Submitting part data:', JSON.stringify(partData, null, 2));
      
      // Ensure data structure matches backend DTO
      const requestData = {
        partNumber: partData.partNumber,
        partName: partData.partName,
        description: partData.description || '',
        drawingNumber: partData.drawingNumber || '',
        revisionNumber: partData.revisionNumber || '00',  // Use revisionNumber
        partType: partData.partType,
        classCode: partData.classCode,
        psiStandardIds: partData.psiStandardIds || []
      };
      
      console.log('Request data to backend:', requestData);
      
      const response = await PartService.createPart(requestData);
      console.log('Response:', response);
      
      toast.success('✅ Part created successfully!');
      navigate('/part/manage');
    } catch (error) {
      console.error('Full error object:', error);
      
      // Check if error has response
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
        console.error('Request URL:', error.config?.url);
        console.error('Request data:', error.config?.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      // Show specific error message
      const errorMessage = error.response?.data?.message || 
                          error.response?.data ||
                          error.message ||
                          'Failed to create part';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/part/manage');
    }
  };

  // Filter PSI standards based on search
  const filteredPsi = availablePsi.filter(psi =>
    psi.standardCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
    psi.standardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    psi.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiPackage className="mr-3 text-blue-700" />
              Create New Part
            </h1>
            <p className="text-gray-600 mt-2">
              Define new part and link inspection standards
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-blue-700" />
            <span className="text-sm font-medium text-blue-800">Part Master</span>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <FiPackage className="mr-2" />
            Part Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Part Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="partNumber"
                value={partData.partNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.partNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., GA0C1910B0"
              />
              {errors.partNumber && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.partNumber}
                </p>
              )}
            </div>

            {/* Part Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Part Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="partName"
                value={partData.partName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.partName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., ADJUSTER ASSY."
              />
              {errors.partName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.partName}
                </p>
              )}
            </div>

            {/* Drawing Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Drawing Number
              </label>
              <input
                type="text"
                name="drawingNumber"
                value={partData.drawingNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., F/RQC/002"
              />
            </div>

            {/* Revision Number - Updated field name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Revision Number
              </label>
              <input
                type="text"
                name="revisionNumber"  // Changed from revisionLevel
                value={partData.revisionNumber}  // Changed from revisionLevel
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., 00"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={partData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Describe the part and its purpose..."
              />
            </div>

            {/* Part Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Part Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {partTypes.map((type) => (
                  <label
                    key={type.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      partData.partType === type.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleRadioChange('partType', type.value)}
                  >
                    <input
                      type="radio"
                      name="partType"
                      value={type.value}
                      checked={partData.partType === type.value}
                      onChange={() => handleRadioChange('partType', type.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <div className={`p-2 rounded-lg ${type.color.replace('text-', 'bg-')} bg-opacity-10`}>
                        <FiPackage className={`w-4 h-4 ${type.color}`} />
                      </div>
                      <div className="ml-2">
                        <span className="text-sm font-medium text-gray-900">
                          {type.label}
                        </span>
                      </div>
                    </div>
                    {partData.partType === type.value && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <FiCheck className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {errors.partType && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.partType}
                </p>
              )}
            </div>

            {/* Class Code Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Class Code
              </label>
              <div className="grid grid-cols-2 gap-3">
                {classCodes.map((code) => (
                  <label
                    key={code.value}
                    className={`relative flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                      partData.classCode === code.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleRadioChange('classCode', code.value)}
                  >
                    <input
                      type="radio"
                      name="classCode"
                      value={code.value}
                      checked={partData.classCode === code.value}
                      onChange={() => handleRadioChange('classCode', code.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${code.color}`}>
                        {code.label}
                      </span>
                    </div>
                    {partData.classCode === code.value && (
                      <div className="absolute top-2 right-2">
                        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center">
                          <FiCheck className="w-2 h-2 text-white" />
                        </div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PSI Standards Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiTarget className="mr-2" />
              Link PSI Standards
            </h2>
            <button
              type="button"
              onClick={fetchPSIStandards}
              className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium flex items-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh List
            </button>
          </div>

          {/* Selected PSI Standards */}
          {selectedPsi.length > 0 && (
            <div className="mb-8">
              <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                <FiCheck className="mr-2 text-green-600" />
                Selected Standards ({selectedPsi.length})
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex flex-wrap gap-2">
                  {selectedPsi.map((psi) => (
                    <div
                      key={psi.id}
                      className="flex items-center bg-white border border-green-300 rounded-lg px-3 py-2"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {psi.standardCode}: {psi.standardName}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeSelectedPsi(psi.id)}
                        className="ml-2 text-red-600 hover:text-red-800"
                      >
                        <FiX className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Search PSI Standards */}
          <div className="mb-6">
            <div className="relative">
              <FiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search PSI standards by code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Available PSI Standards */}
          <div className="mb-8">
            <h3 className="text-md font-medium text-gray-800 mb-3 flex items-center">
              <FiList className="mr-2 text-blue-600" />
              Available PSI Standards
            </h3>
            
            {loadingPsi ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading PSI standards...</p>
              </div>
            ) : filteredPsi.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FiList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No PSI standards found</p>
                <p className="text-sm text-gray-500 mt-1">
                  {searchTerm ? 'Try a different search term' : 'Create PSI standards first'}
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Select
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Code
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Standard Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Version
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPsi.map((psi) => {
                      const isSelected = partData.psiStandardIds.includes(psi.id);
                      const typeColors = {
                        DIMENSIONAL: 'bg-blue-100 text-blue-800',
                        VISUAL: 'bg-green-100 text-green-800',
                        MATERIAL: 'bg-amber-100 text-amber-800',
                        PERFORMANCE: 'bg-purple-100 text-purple-800',
                        SAFETY: 'bg-red-100 text-red-800',
                        GENERAL: 'bg-gray-100 text-gray-800'
                      };
                      
                      // Use a combination of fields for the key
                      const uniqueKey = `${psi.id}-${psi.standardCode}-${psi.standardName}`;
                      
                      return (
                        <tr 
                          key={uniqueKey} 
                          className={`hover:bg-gray-50 transition cursor-pointer ${
                            isSelected ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => togglePsiSelection(psi.id)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => togglePsiSelection(psi.id)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {psi.standardCode}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {psi.standardName}
                            </div>
                            {psi.description && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {psi.description}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              typeColors[psi.standardType] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {psi.standardType}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            v{psi.version}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
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
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center shadow-lg disabled:opacity-50"
          >
            <FiSave className="mr-2" />
            {loading ? 'Creating...' : 'Create Part'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PartCreate;