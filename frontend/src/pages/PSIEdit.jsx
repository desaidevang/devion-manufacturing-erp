// src/pages/PSIEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  FiSave, FiX, FiRefreshCw, FiArrowLeft,
  FiFileText, FiCheckCircle, FiAlertCircle,
  FiList, FiCode, FiType, FiInfo,
  FiUpload, FiCopy, FiLink
} from 'react-icons/fi';
import PSIService from '../services/psiService';
import { toast } from 'react-toastify';

const PSIEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    standardCode: '',
    standardName: '',
    description: '',
    standardType: 'DIMENSIONAL',
    version: '1.0',
    inspectionItems: '[]',
    isActive: true
  });
  
  const [inspectionItems, setInspectionItems] = useState([]);
  const [newItem, setNewItem] = useState({
    itemCode: '',
    itemName: '',
    specification: '',
    tolerance: '',
    method: 'VISUAL',
    frequency: '100%'
  });
  
  // Standard type options
  const standardTypeOptions = [
    { value: 'DIMENSIONAL', label: 'Dimensional', color: 'bg-blue-100 text-blue-800', icon: '📏' },
    { value: 'VISUAL', label: 'Visual', color: 'bg-green-100 text-green-800', icon: '👁️' },
    { value: 'MATERIAL', label: 'Material', color: 'bg-amber-100 text-amber-800', icon: '🧱' },
    { value: 'PERFORMANCE', label: 'Performance', color: 'bg-purple-100 text-purple-800', icon: '⚡' },
    { value: 'SAFETY', label: 'Safety', color: 'bg-red-100 text-red-800', icon: '🛡️' },
    { value: 'GENERAL', label: 'General', color: 'bg-gray-100 text-gray-800', icon: '📄' }
  ];
  
  // Inspection method options
  const methodOptions = [
    { value: 'VISUAL', label: 'Visual Inspection' },
    { value: 'MEASUREMENT', label: 'Measurement' },
    { value: 'TEST', label: 'Functional Test' },
    { value: 'ANALYSIS', label: 'Chemical Analysis' },
    { value: 'DOCUMENT', label: 'Document Review' }
  ];
  
  // Frequency options
  const frequencyOptions = [
    { value: '100%', label: '100% (All pieces)' },
    { value: 'SAMPLE', label: 'Sampling' },
    { value: 'FIRST_ARTICLE', label: 'First Article' },
    { value: 'PERIODIC', label: 'Periodic' }
  ];

  useEffect(() => {
    fetchPSIData();
  }, [id]);

  const fetchPSIData = async () => {
    setLoading(true);
    try {
      const response = await PSIService.getPSIById(id);
      const psi = response.data;
      
      setFormData({
        standardCode: psi.standardCode,
        standardName: psi.standardName,
        description: psi.description || '',
        standardType: psi.standardType,
        version: psi.version || '1.0',
        inspectionItems: psi.inspectionItems || '[]',
        isActive: psi.isActive
      });
      
      // Parse inspection items if they exist
      if (psi.inspectionItems) {
        try {
          const items = JSON.parse(psi.inspectionItems);
          setInspectionItems(Array.isArray(items) ? items : []);
        } catch (error) {
          console.error('Error parsing inspection items:', error);
          setInspectionItems([]);
        }
      }
    } catch (error) {
      console.error('Error fetching PSI:', error);
      toast.error('Failed to load PSI standard');
      navigate('/psi/view');
    } finally {
      setLoading(false);
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

  const handleAddInspectionItem = () => {
    if (!newItem.itemCode || !newItem.itemName) {
      toast.error('Item code and name are required');
      return;
    }

    const item = {
      ...newItem,
      id: Date.now(), // Temporary ID
      isActive: true
    };

    setInspectionItems(prev => [...prev, item]);
    
    // Update form data with new inspection items
    const updatedItems = [...inspectionItems, item];
    setFormData(prev => ({
      ...prev,
      inspectionItems: JSON.stringify(updatedItems)
    }));
    
    // Reset new item form
    setNewItem({
      itemCode: '',
      itemName: '',
      specification: '',
      tolerance: '',
      method: 'VISUAL',
      frequency: '100%'
    });
  };

  const handleRemoveInspectionItem = (index) => {
    const updatedItems = inspectionItems.filter((_, i) => i !== index);
    setInspectionItems(updatedItems);
    setFormData(prev => ({
      ...prev,
      inspectionItems: JSON.stringify(updatedItems)
    }));
  };

  const handleUpdateInspectionItem = (index, field, value) => {
    const updatedItems = [...inspectionItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setInspectionItems(updatedItems);
    setFormData(prev => ({
      ...prev,
      inspectionItems: JSON.stringify(updatedItems)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Prepare update data
      const updateData = {
        standardName: formData.standardName,
        description: formData.description,
        standardType: formData.standardType,
        version: formData.version,
        inspectionItems: formData.inspectionItems,
        isActive: formData.isActive
      };
      
      await PSIService.updatePSI(id, updateData);
      
      toast.success('✅ PSI Standard updated successfully!');
      setTimeout(() => {
        navigate('/psi/view');
      }, 1500);
    } catch (error) {
      console.error('Error updating PSI:', error);
      toast.error(error.response?.data?.message || 'Failed to update PSI standard');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-200 rounded-full"></div>
            <div className="w-20 h-20 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-6 text-lg font-medium text-gray-700">Loading PSI Standard</p>
          <p className="mt-2 text-gray-500">Fetching inspection standard information...</p>
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
                to="/psi/view"
                className="mr-4 p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <FiArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                  <FiFileText className="mr-3 text-purple-700" />
                  Edit PSI Standard
                </h1>
                <p className="text-gray-600 mt-2">
                  Update product standard inspection details
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-lg">
                {formData.standardCode}
              </span>
              <span className="mx-2 text-gray-400">•</span>
              <span className="text-gray-600">Version {formData.version}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/psi/view')}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center"
            >
              <FiX className="mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition flex items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mt-4 h-1 bg-gradient-to-r from-purple-600 via-blue-500 to-purple-400 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Basic Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 rounded-lg mr-3">
                <FiFileText className="w-6 h-6 text-blue-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>
                <p className="text-sm text-gray-600">Standard details and description</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Standard Code (Read-only) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.standardCode}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <div className="absolute right-3 top-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(formData.standardCode);
                        toast.success('Standard code copied to clipboard');
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600"
                      title="Copy standard code"
                    >
                      <FiCopy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Standard code cannot be changed after creation
                </p>
              </div>

              {/* Standard Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Name *
                </label>
                <input
                  type="text"
                  name="standardName"
                  value={formData.standardName}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter standard name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Enter detailed description of the standard..."
                />
              </div>

              {/* Standard Type and Version */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Standard Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Standard Type *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {standardTypeOptions.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => handleSelectChange('standardType', type.value)}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium transition flex items-center justify-center ${
                          formData.standardType === type.value
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

                {/* Version */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Version
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="version"
                      value={formData.version}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="e.g., 1.0"
                    />
                    <div className="absolute right-3 top-3 text-sm text-gray-500">
                      v
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Update version when making significant changes
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Inspection Items Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 rounded-lg mr-3">
                <FiList className="w-6 h-6 text-green-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Inspection Checklist</h2>
                <p className="text-sm text-gray-600">Define inspection items and requirements</p>
              </div>
            </div>

            {/* Add New Item Form */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-4">Add New Inspection Item</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Item Code *
                  </label>
                  <input
                    type="text"
                    value={newItem.itemCode}
                    onChange={(e) => setNewItem(prev => ({ ...prev, itemCode: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., ITM-001"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={newItem.itemName}
                    onChange={(e) => setNewItem(prev => ({ ...prev, itemName: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., Surface Finish Check"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Specification
                  </label>
                  <input
                    type="text"
                    value={newItem.specification}
                    onChange={(e) => setNewItem(prev => ({ ...prev, specification: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., Ra ≤ 1.6µm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tolerance
                  </label>
                  <input
                    type="text"
                    value={newItem.tolerance}
                    onChange={(e) => setNewItem(prev => ({ ...prev, tolerance: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., ±0.1mm"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Inspection Method
                  </label>
                  <select
                    value={newItem.method}
                    onChange={(e) => setNewItem(prev => ({ ...prev, method: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    {methodOptions.map((method) => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Inspection Frequency
                  </label>
                  <select
                    value={newItem.frequency}
                    onChange={(e) => setNewItem(prev => ({ ...prev, frequency: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    {frequencyOptions.map((freq) => (
                      <option key={freq.value} value={freq.value}>
                        {freq.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                onClick={handleAddInspectionItem}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition flex items-center"
              >
                <FiList className="mr-2" />
                Add to Checklist
              </button>
            </div>

            {/* Inspection Items List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">
                  Current Inspection Items ({inspectionItems.length})
                </h3>
                {inspectionItems.length > 0 && (
                  <button
                    onClick={() => {
                      setInspectionItems([]);
                      setFormData(prev => ({ ...prev, inspectionItems: '[]' }));
                    }}
                    className="text-xs text-red-600 hover:text-red-800 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {inspectionItems.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                  <FiList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No inspection items added yet</p>
                  <p className="text-sm text-gray-500 mt-1">Add items to create inspection checklist</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {inspectionItems.map((item, index) => (
                    <div key={item.id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center mb-2">
                            <span className="font-semibold text-gray-900 text-sm mr-3">
                              {item.itemCode}
                            </span>
                            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                              {item.method}
                            </span>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {item.itemName}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveInspectionItem(index)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                          title="Remove item"
                        >
                          <FiX className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <label className="text-xs text-gray-500">Specification</label>
                          <input
                            type="text"
                            value={item.specification || ''}
                            onChange={(e) => handleUpdateInspectionItem(index, 'specification', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                            placeholder="Enter specification"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-500">Tolerance</label>
                          <input
                            type="text"
                            value={item.tolerance || ''}
                            onChange={(e) => handleUpdateInspectionItem(index, 'tolerance', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                            placeholder="Enter tolerance"
                          />
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-500">Method</label>
                          <select
                            value={item.method}
                            onChange={(e) => handleUpdateInspectionItem(index, 'method', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                          >
                            {methodOptions.map((method) => (
                              <option key={method.value} value={method.value}>
                                {method.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="text-xs text-gray-500">Frequency</label>
                          <select
                            value={item.frequency}
                            onChange={(e) => handleUpdateInspectionItem(index, 'frequency', e.target.value)}
                            className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition text-sm"
                          >
                            {frequencyOptions.map((freq) => (
                              <option key={freq.value} value={freq.value}>
                                {freq.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">
                <FiInfo className="inline mr-1" />
                These inspection items will be used as a checklist during quality inspections.
                Each item represents a specific check or measurement to be performed.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Status & Actions */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-amber-100 rounded-lg mr-3">
                <FiAlertCircle className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Status & Actions</h2>
                <p className="text-sm text-gray-600">Standard status and management</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Active Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Standard Status
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-2 ${formData.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      <span className={`font-medium ${formData.isActive ? 'text-green-700' : 'text-gray-600'}`}>
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
                      ? 'This standard is active and can be linked to parts.'
                      : 'This standard is inactive and cannot be used for new inspections.'}
                  </p>
                </div>
              </div>

              {/* Version History */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Version Information
                </label>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-sm text-gray-700">Current Version</div>
                      <div className="text-2xl font-bold text-blue-700">
                        v{formData.version}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">Standard Code</div>
                      <div className="text-lg font-semibold text-gray-900">
                        {formData.standardCode}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    Update version number when making major changes to the standard
                  </p>
                </div>
              </div>

              {/* Linked Parts Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FiLink className="inline mr-1" />
                  Linked Parts Information
                </label>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    This PSI standard can be linked to multiple parts. Changes to this standard will affect all linked parts.
                  </p>
                  <div className="flex items-center text-sm">
                    <FiInfo className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-gray-700">
                      Linked parts: <span className="font-semibold">Check parts list</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Standard Code:</span>
                <span className="font-semibold">{formData.standardCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Standard Type:</span>
                <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                  standardTypeOptions.find(t => t.value === formData.standardType)?.color || 'bg-gray-100 text-gray-800'
                }`}>
                  {standardTypeOptions.find(t => t.value === formData.standardType)?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Version:</span>
                <span className="font-semibold">v{formData.version}</span>
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
                <span className="text-gray-600">Inspection Items:</span>
                <span className="font-semibold">{inspectionItems.length}</span>
              </div>
            </div>

            {/* Preview JSON Button */}
            <div className="mt-6">
              <button
                onClick={() => {
                  try {
                    const json = JSON.stringify(JSON.parse(formData.inspectionItems), null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    window.open(url, '_blank');
                  } catch (error) {
                    toast.error('Invalid JSON data');
                  }
                }}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition flex items-center justify-center text-sm"
              >
                <FiCode className="mr-2" />
                Preview JSON Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Edit mode • Last updated: {new Date().toLocaleDateString()}
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/psi/view')}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-medium rounded-lg hover:from-purple-700 hover:to-purple-800 transition flex items-center shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <FiRefreshCw className="mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" />
                  Update Standard
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PSIEdit;