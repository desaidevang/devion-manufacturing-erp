// src/pages/warehouse/CreateWarehouseLocation.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FiArrowLeft, FiMapPin, FiPlus, FiCheckCircle,
  FiAlertCircle, FiLayers, FiGrid, FiPackage
} from 'react-icons/fi';
import WarehouseLocationService from '../../services/warehouseLocationService';
import { toast } from 'react-toastify';

const CreateWarehouseLocation = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    locationCode: '',
    locationName: '',
    zone: '',
    rack: '',
    shelf: '',
    bin: '',
    totalCapacity: '',
    occupiedSpace: 0,
    status: 'ACTIVE',
    description: ''
  });

  const zones = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
    'RECEIVING', 'STORAGE', 'PICKING', 'DISPATCH', 'QUARANTINE'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const generateLocationCode = () => {
    const zone = formData.zone || 'A';
    const rack = formData.rack || '01';
    const shelf = formData.shelf || '01';
    const bin = formData.bin || '01';
    
    const code = `${zone}-${String(rack).padStart(2, '0')}-${String(shelf).padStart(2, '0')}-${String(bin).padStart(2, '0')}`;
    setFormData(prev => ({
      ...prev,
      locationCode: code
    }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const locationData = {
      locationCode: formData.locationCode,
      locationName: formData.locationName,
      locationType: 'GENERAL_STORE', // Default or from form
      zone: formData.zone,
      rack: formData.rack,
      shelf: formData.shelf,
      bin: formData.bin,
      capacity: parseInt(formData.totalCapacity) || 0,
      currentOccupancy: parseInt(formData.occupiedSpace) || 0,
      isActive: formData.status === 'ACTIVE',
      remarks: formData.description
    };

    await WarehouseLocationService.createLocation(locationData);
    toast.success('Warehouse location created successfully!');
    navigate('/warehouse/locations');
  } catch (error) {
    console.error('Error creating location:', error);
    toast.error(error.response?.data?.message || 'Failed to create location');
  } finally {
    setLoading(false);
  }
};
  const handleReset = () => {
    setFormData({
      locationCode: '',
      locationName: '',
      zone: '',
      rack: '',
      shelf: '',
      bin: '',
      totalCapacity: '',
      occupiedSpace: 0,
      status: 'ACTIVE',
      description: ''
    });
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <Link
              to="/warehouse/locations"
              className="p-2 mr-4 text-gray-600 hover:bg-gray-100 rounded-lg transition"
            >
              <FiArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                <FiMapPin className="mr-3 text-blue-700" />
                Create Warehouse Location
              </h1>
              <p className="text-gray-600 mt-2">
                Add new storage location to warehouse
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
            >
              Reset Form
            </button>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-blue-400 rounded-full"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <form onSubmit={handleSubmit}>
              {/* Location Code and Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Code *
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      name="locationCode"
                      value={formData.locationCode}
                      onChange={handleInputChange}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="e.g., A-01-01-01"
                      required
                    />
                    <button
                      type="button"
                      onClick={generateLocationCode}
                      className="px-4 py-3 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition"
                    >
                      Generate
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Name *
                  </label>
                  <input
                    type="text"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="e.g., Main Storage A1"
                    required
                  />
                </div>
              </div>

              {/* Zone Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {zones.map(zone => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, zone }))}
                      className={`px-3 py-2 rounded-lg border transition ${
                        formData.zone === zone
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Storage Address */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Storage Address</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rack Number
                    </label>
                    <input
                      type="text"
                      name="rack"
                      value={formData.rack}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shelf Number
                    </label>
                    <input
                      type="text"
                      name="shelf"
                      value={formData.shelf}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bin Number
                    </label>
                    <input
                      type="text"
                      name="bin"
                      value={formData.bin}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="01"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Capacity *
                    </label>
                    <input
                      type="number"
                      name="totalCapacity"
                      value={formData.totalCapacity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      placeholder="100"
                      required
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Status and Description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="FULL">Full</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupied Space
                  </label>
                  <input
                    type="number"
                    name="occupiedSpace"
                    value={formData.occupiedSpace}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    placeholder="0"
                    min="0"
                    max={formData.totalCapacity}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Add description or special instructions for this location..."
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/warehouse/locations')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <FiCheckCircle className="mr-2" />
                      Create Location
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column - Help & Preview */}
        <div className="space-y-6">
          {/* Location Preview */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Location Preview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Location Code:</span>
                <span className="font-bold text-blue-900">
                  {formData.locationCode || 'Not set'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Location Name:</span>
                <span className="font-medium">{formData.locationName || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Zone:</span>
                <span className="font-medium">{formData.zone || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Address:</span>
                <span className="font-medium">
                  {[formData.rack, formData.shelf, formData.bin].filter(Boolean).join('/') || 'Not set'}
                </span>
              </div>
              <div className="pt-3 border-t border-blue-200">
                <div className="flex justify-between">
                  <span className="text-gray-700">Capacity:</span>
                  <span className="font-medium">
                    {formData.occupiedSpace || 0} / {formData.totalCapacity || 'Not set'}
                  </span>
                </div>
                {formData.totalCapacity && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">Utilization</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${((formData.occupiedSpace || 0) / formData.totalCapacity) * 100}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Help */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <FiAlertCircle className="mr-2 text-blue-600" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                <span>Location codes should follow a consistent naming convention</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                <span>Use zones to logically group locations (A, B, C, etc.)</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                <span>Set realistic capacity based on physical space constraints</span>
              </li>
              <li className="flex items-start">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2"></div>
                <span>Descriptions help other users understand location purpose</span>
              </li>
            </ul>
          </div>

          {/* Naming Convention */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
              <FiGrid className="mr-2 text-green-600" />
              Naming Convention
            </h3>
            <div className="text-sm text-gray-700 space-y-3">
              <div className="bg-white rounded p-3 border border-green-200">
                <div className="font-mono text-green-900 text-center">
                  {formData.zone || 'Z'}-{String(formData.rack || '01').padStart(2, '0')}-{String(formData.shelf || '01').padStart(2, '0')}-{String(formData.bin || '01').padStart(2, '0')}
                </div>
                <div className="text-xs text-gray-600 text-center mt-2">
                  Format: Zone-Rack-Shelf-Bin
                </div>
              </div>
              <div className="text-xs text-gray-600">
                <p>Example locations:</p>
                <ul className="mt-1 space-y-1">
                  <li>A-01-01-01 → Zone A, Rack 1, Shelf 1, Bin 1</li>
                  <li>RECEIVING-01-01-01 → Receiving area</li>
                  <li>STORAGE-02-03-04 → Storage zone, Rack 2, Shelf 3, Bin 4</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWarehouseLocation;