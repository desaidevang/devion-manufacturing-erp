// src/pages/PSICreate.jsx - User-friendly version
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSave, FiX, FiCheck, FiAlertCircle, 
  FiFileText, FiTarget, FiEye, FiPackage,
  FiShield, FiGlobe, FiActivity, FiGrid,
  FiPlus, FiTrash2, FiEdit2
} from 'react-icons/fi';
import PSIService from '../services/psiService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PSICreate = () => {
  const navigate = useNavigate();
  
  // Initial inspection item template
  const initialInspectionItem = {
    item: '',
    specification: '',
    tool: '',
    acceptable: 'YES',
    notes: ''
  };

  const [psiData, setPsiData] = useState({
    standardCode: '',
    standardName: '',
    description: '',
    standardType: 'DIMENSIONAL',
    version: '1.0',
    inspectionItems: JSON.stringify([]), // Start with empty array
    isActive: true
  });

  const [inspectionItems, setInspectionItems] = useState([]);
  const [currentItem, setCurrentItem] = useState({ ...initialInspectionItem });
  const [editingIndex, setEditingIndex] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const standardTypes = [
    { value: 'DIMENSIONAL', label: 'Dimensional', icon: FiTarget, color: 'text-blue-600' },
    { value: 'VISUAL', label: 'Visual', icon: FiEye, color: 'text-green-600' },
    { value: 'MATERIAL', label: 'Material', icon: FiPackage, color: 'text-amber-600' },
    { value: 'PERFORMANCE', label: 'Performance', icon: FiActivity, color: 'text-purple-600' },
    { value: 'SAFETY', label: 'Safety', icon: FiShield, color: 'text-red-600' },
    { value: 'GENERAL', label: 'General', icon: FiGlobe, color: 'text-gray-600' }
  ];

  const acceptableOptions = [
    { value: 'YES', label: 'Yes', color: 'bg-green-100 text-green-800' },
    { value: 'NO', label: 'No', color: 'bg-red-100 text-red-800' },
    { value: 'NA', label: 'N/A', color: 'bg-gray-100 text-gray-800' },
    { value: 'CUSTOM', label: 'Custom Value', color: 'bg-blue-100 text-blue-800' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPsiData(prev => ({
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

  const handleItemChange = (e) => {
    const { name, value } = e.target;
    setCurrentItem(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addInspectionItem = () => {
    // Validate current item
    if (!currentItem.item.trim() || !currentItem.specification.trim()) {
      toast.error('Item name and specification are required');
      return;
    }

    if (editingIndex !== null) {
      // Update existing item
      const updatedItems = [...inspectionItems];
      updatedItems[editingIndex] = { ...currentItem };
      setInspectionItems(updatedItems);
      setEditingIndex(null);
      toast.success('Item updated successfully');
    } else {
      // Add new item
      setInspectionItems(prev => [...prev, { ...currentItem }]);
      toast.success('Item added successfully');
    }

    // Reset form and update JSON
    setCurrentItem({ ...initialInspectionItem });
    updateInspectionItemsJSON([...inspectionItems, { ...currentItem }]);
  };

  const updateInspectionItemsJSON = (items) => {
    setPsiData(prev => ({
      ...prev,
      inspectionItems: JSON.stringify(items, null, 2)
    }));
  };

  const editItem = (index) => {
    setCurrentItem({ ...inspectionItems[index] });
    setEditingIndex(index);
    // Scroll to form
    document.getElementById('inspection-form').scrollIntoView({ behavior: 'smooth' });
  };

  const deleteItem = (index) => {
    if (window.confirm('Are you sure you want to delete this inspection item?')) {
      const updatedItems = inspectionItems.filter((_, i) => i !== index);
      setInspectionItems(updatedItems);
      updateInspectionItemsJSON(updatedItems);
      toast.success('Item deleted successfully');
      
      if (editingIndex === index) {
        setCurrentItem({ ...initialInspectionItem });
        setEditingIndex(null);
      }
    }
  };

  const clearAllItems = () => {
    if (window.confirm('Are you sure you want to clear all inspection items?')) {
      setInspectionItems([]);
      setCurrentItem({ ...initialInspectionItem });
      setEditingIndex(null);
      updateInspectionItemsJSON([]);
      toast.success('All items cleared');
    }
  };

  const loadSampleItems = () => {
    const sampleItems = [
      {
        item: "Inner Diameter",
        specification: "Ø6.20(+0.20/-0)",
        tool: "Pin Gauge",
        acceptable: "YES",
        notes: "Check with standard pin gauge set"
      },
      {
        item: "Surface Finish",
        specification: "No rust, dents, or scratches",
        tool: "Visual Inspection",
        acceptable: "YES",
        notes: "Under proper lighting conditions"
      },
      {
        item: "Plating Thickness",
        specification: "13μ MIN",
        tool: "Plating Thickness Tester",
        acceptable: "YES",
        notes: "Measure at 3 different points"
      }
    ];
    
    setInspectionItems(sampleItems);
    updateInspectionItemsJSON(sampleItems);
    toast.success('Sample items loaded');
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!psiData.standardCode.trim()) {
      newErrors.standardCode = 'Standard code is required';
    } else if (psiData.standardCode.length < 3) {
      newErrors.standardCode = 'Standard code must be at least 3 characters';
    }
    
    if (!psiData.standardName.trim()) {
      newErrors.standardName = 'Standard name is required';
    }
    
    if (inspectionItems.length === 0) {
      newErrors.inspectionItems = 'At least one inspection item is required';
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
      const response = await PSIService.createPSI(psiData);
      toast.success('✅ PSI Standard created successfully!');
      navigate('/psi/view');
    } catch (error) {
      console.error('Error creating PSI:', error);
      toast.error(error.response?.data?.message || 'Failed to create PSI standard');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/psi/view');
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiFileText className="mr-3 text-blue-700" />
              Create New PSI Standard
            </h1>
            <p className="text-gray-600 mt-2">
              Define new Product Standard Inspection (PSI) criteria
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-blue-700" />
            <span className="text-sm font-medium text-blue-800">PSI Standards</span>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <FiFileText className="mr-2" />
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Standard Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="standardCode"
                value={psiData.standardCode}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.standardCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., PSI-001"
              />
              {errors.standardCode && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.standardCode}
                </p>
              )}
            </div>

            {/* Standard Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Standard Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="standardName"
                value={psiData.standardName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.standardName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., CLAMP RH Dimensional Inspection"
              />
              {errors.standardName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.standardName}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={psiData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Describe the purpose and scope of this PSI standard..."
              />
            </div>

            {/* Standard Type Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Standard Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {standardTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <label
                      key={type.value}
                      className={`relative flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                        psiData.standardType === type.value
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="standardType"
                        value={type.value}
                        checked={psiData.standardType === type.value}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className="flex items-center">
                        <div className={`p-2 rounded-lg ${type.color.replace('text-', 'bg-')} bg-opacity-10`}>
                          <Icon className={`w-5 h-5 ${type.color}`} />
                        </div>
                        <div className="ml-3">
                          <span className="text-sm font-medium text-gray-900">
                            {type.label}
                          </span>
                        </div>
                      </div>
                      {psiData.standardType === type.value && (
                        <div className="absolute top-2 right-2">
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <FiCheck className="w-3 h-3 text-white" />
                          </div>
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Version and Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version
              </label>
              <input
                type="text"
                name="version"
                value={psiData.version}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., 1.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isActive"
                    value="true"
                    checked={psiData.isActive === true}
                    onChange={() => setPsiData(prev => ({ ...prev, isActive: true }))}
                    className="mr-2"
                  />
                  <span className="flex items-center text-green-700">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="isActive"
                    value="false"
                    checked={psiData.isActive === false}
                    onChange={() => setPsiData(prev => ({ ...prev, isActive: false }))}
                    className="mr-2"
                  />
                  <span className="flex items-center text-gray-600">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Inactive
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Inspection Items Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center">
              <FiCheck className="mr-2" />
              Inspection Checklist
            </h2>
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={loadSampleItems}
                className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition text-sm font-medium"
              >
                Load Sample
              </button>
              <button
                type="button"
                onClick={clearAllItems}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
              >
                Clear All
              </button>
            </div>
          </div>

          {errors.inspectionItems && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm flex items-center">
                <FiAlertCircle className="mr-2" /> {errors.inspectionItems}
              </p>
            </div>
          )}

          {/* Add/Edit Item Form */}
          <div id="inspection-form" className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-md font-medium text-gray-800 mb-4">
              {editingIndex !== null ? `Editing Item #${editingIndex + 1}` : 'Add New Inspection Item'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Item Name */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Item <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="item"
                  value={currentItem.item}
                  onChange={handleItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g., Inner Diameter"
                />
              </div>

              {/* Specification */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Specification <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="specification"
                  value={currentItem.specification}
                  onChange={handleItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g., Ø6.20(+0.20/-0)"
                />
              </div>

              {/* Tool */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tool
                </label>
                <input
                  type="text"
                  name="tool"
                  value={currentItem.tool}
                  onChange={handleItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g., Pin Gauge"
                />
              </div>

              {/* Acceptable Criteria */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Acceptable
                </label>
                <select
                  name="acceptable"
                  value={currentItem.acceptable}
                  onChange={handleItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {acceptableOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div className="md:col-span-2 lg:col-span-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  name="notes"
                  value={currentItem.notes}
                  onChange={handleItemChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="Additional notes or instructions"
                />
              </div>
            </div>

            {/* Add/Update Button */}
            <div className="mt-4 flex justify-end">
              {editingIndex !== null && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentItem({ ...initialInspectionItem });
                    setEditingIndex(null);
                  }}
                  className="px-4 py-2 mr-3 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm font-medium"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="button"
                onClick={addInspectionItem}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition text-sm font-medium flex items-center"
              >
                <FiPlus className="mr-2" />
                {editingIndex !== null ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </div>

          {/* Inspection Items Table */}
          {inspectionItems.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Specification
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Tool
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Acceptable
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inspectionItems.map((item, index) => {
                    const acceptableOption = acceptableOptions.find(opt => opt.value === item.acceptable);
                    return (
                      <tr key={index} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.item}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                          {item.specification}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {item.tool || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${acceptableOption?.color || 'bg-gray-100 text-gray-800'}`}>
                            {acceptableOption?.label || item.acceptable}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                          {item.notes || '-'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center space-x-2">
                            <button
                              type="button"
                              onClick={() => editItem(index)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteItem(index)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="mt-4 text-sm text-gray-500">
                Total Items: {inspectionItems.length}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FiCheck className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Inspection Items Added</h3>
              <p className="text-gray-600 mb-6">Start by adding your first inspection item using the form above.</p>
              <button
                type="button"
                onClick={loadSampleItems}
                className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition font-medium"
              >
                Load Sample Items
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <div className="flex items-center">
              <FiAlertCircle className="mr-2 text-blue-600" />
              <span>All changes will be saved automatically</span>
            </div>
          </div>
          <div className="flex space-x-4">
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
              {loading ? 'Creating...' : 'Create PSI Standard'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PSICreate;