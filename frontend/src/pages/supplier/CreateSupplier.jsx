import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiSave, FiX, FiCheck, FiAlertCircle, 
  FiTruck, FiUser, FiMail, FiPhone, 
  FiMapPin, FiCreditCard, FiCalendar, FiStar
} from 'react-icons/fi';
import SupplierService from '../../services/supplierService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const CreateSupplier = () => {
  const navigate = useNavigate();
  
  const [supplierData, setSupplierData] = useState({
    supplierCode: '',
    supplierName: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
    gstNumber: '',
    panNumber: '',
    paymentTerms: 'Net 30',
    rating: 3
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Payment terms options
  const paymentTerms = [
    { value: 'Net 7', label: 'Net 7 Days' },
    { value: 'Net 15', label: 'Net 15 Days' },
    { value: 'Net 30', label: 'Net 30 Days' },
    { value: 'Net 45', label: 'Net 45 Days' },
    { value: 'Net 60', label: 'Net 60 Days' },
    { value: 'COD', label: 'Cash on Delivery' },
    { value: 'Advance', label: 'Advance Payment' }
  ];

  // Rating options
  const ratingOptions = [
    { value: 1, label: 'Poor', color: 'text-red-600' },
    { value: 2, label: 'Fair', color: 'text-orange-600' },
    { value: 3, label: 'Good', color: 'text-yellow-600' },
    { value: 4, label: 'Very Good', color: 'text-green-600' },
    { value: 5, label: 'Excellent', color: 'text-emerald-600' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSupplierData(prev => ({
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!supplierData.supplierCode.trim()) {
      newErrors.supplierCode = 'Supplier code is required';
    } else if (supplierData.supplierCode.length < 3) {
      newErrors.supplierCode = 'Supplier code must be at least 3 characters';
    }
    
    if (!supplierData.supplierName.trim()) {
      newErrors.supplierName = 'Supplier name is required';
    }
    
    if (supplierData.email && !/\S+@\S+\.\S+/.test(supplierData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (supplierData.phone && !/^\d{10}$/.test(supplierData.phone)) {
      newErrors.phone = 'Invalid phone number (10 digits required)';
    }
    
    if (supplierData.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(supplierData.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST number format';
    }
    
    if (supplierData.panNumber && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(supplierData.panNumber)) {
      newErrors.panNumber = 'Invalid PAN number format';
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
      await SupplierService.createSupplier(supplierData);
      toast.success('✅ Supplier created successfully!');
      navigate('/vendor/manage');
    } catch (error) {
      console.error('Error creating supplier:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data ||
                          error.message ||
                          'Failed to create supplier';
      toast.error(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      navigate('/vendor/manage');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiTruck className="mr-3 text-blue-700" />
              Create New Supplier
            </h1>
            <p className="text-gray-600 mt-2">
              Add a new vendor/supplier to the system
            </p>
          </div>
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg">
            <FiAlertCircle className="w-5 h-5 text-blue-700" />
            <span className="text-sm font-medium text-blue-800">Vendor Master</span>
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
            <FiUser className="mr-2" />
            Supplier Details
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Supplier Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="supplierCode"
                value={supplierData.supplierCode}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.supplierCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., SUP-001"
              />
              {errors.supplierCode && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.supplierCode}
                </p>
              )}
            </div>

            {/* Supplier Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="supplierName"
                value={supplierData.supplierName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.supplierName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., Sanatan Autoplast"
              />
              {errors.supplierName && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.supplierName}
                </p>
              )}
            </div>

            {/* Contact Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Person
              </label>
              <input
                type="text"
                name="contactPerson"
                value={supplierData.contactPerson}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="e.g., Mr. Sharma"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={supplierData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., contact@supplier.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={supplierData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 9876543210"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.phone}
                </p>
              )}
            </div>

            {/* Payment Terms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms
              </label>
              <select
                name="paymentTerms"
                value={supplierData.paymentTerms}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              >
                {paymentTerms.map(term => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
            </div>

            {/* GST Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={supplierData.gstNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.gstNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 27AABCS1429B1Z"
              />
              {errors.gstNumber && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.gstNumber}
                </p>
              )}
            </div>

            {/* PAN Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number
              </label>
              <input
                type="text"
                name="panNumber"
                value={supplierData.panNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                  errors.panNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., ABCDE1234F"
              />
              {errors.panNumber && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <FiAlertCircle className="mr-1" /> {errors.panNumber}
                </p>
              )}
            </div>

            {/* Rating */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Supplier Rating
              </label>
              <div className="flex items-center space-x-4">
                {ratingOptions.map((rating) => (
                  <label
                    key={rating.value}
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-all ${
                      supplierData.rating === rating.value
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => setSupplierData(prev => ({ ...prev, rating: rating.value }))}
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={rating.value}
                      checked={supplierData.rating === rating.value}
                      onChange={() => setSupplierData(prev => ({ ...prev, rating: rating.value }))}
                      className="sr-only"
                    />
                    <div className="flex items-center">
                      <FiStar className={`w-5 h-5 ${rating.color}`} />
                      <div className="ml-2">
                        <span className="text-sm font-medium text-gray-900">
                          {rating.label}
                        </span>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <FiStar
                              key={i}
                              className={`w-4 h-4 ${
                                i < rating.value ? rating.color : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <textarea
                name="address"
                value={supplierData.address}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                placeholder="Enter complete address..."
              />
            </div>
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
            {loading ? 'Creating...' : 'Create Supplier'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateSupplier;