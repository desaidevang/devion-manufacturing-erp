import React, { useState, useEffect } from 'react';
import { 
  FiSearch, FiEdit, FiTrash2, FiEye, FiFilter, 
  FiCheckCircle, FiXCircle, FiAlertCircle, FiRefreshCw,
  FiPlus, FiTruck, FiUser, FiPhone, FiMail, FiStar
} from 'react-icons/fi';
import { Link } from 'react-router-dom';
import SupplierService from '../../services/supplierService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ManageSuppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [approvedFilter, setApprovedFilter] = useState('ALL');

  // Status options
  const statusOptions = [
    { value: 'ALL', label: 'All Statuses' },
    { value: 'ACTIVE', label: 'Active', color: 'bg-green-100 text-green-800' },
    { value: 'INACTIVE', label: 'Inactive', color: 'bg-gray-100 text-gray-800' },
    { value: 'BLACKLISTED', label: 'Blacklisted', color: 'bg-red-100 text-red-800' },
    { value: 'ON_HOLD', label: 'On Hold', color: 'bg-yellow-100 text-yellow-800' }
  ];

  // Approval options
  const approvalOptions = [
    { value: 'ALL', label: 'All' },
    { value: 'APPROVED', label: 'Approved', color: 'text-green-600' },
    { value: 'NOT_APPROVED', label: 'Not Approved', color: 'text-red-600' }
  ];

  // Load suppliers
  const loadSuppliers = async () => {
    setLoading(true);
    try {
      const response = await SupplierService.getAllSuppliers();
      setSuppliers(response.data);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = 
      supplier.supplierCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (supplier.email && supplier.email.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || supplier.status === statusFilter;
    const matchesApproved = approvedFilter === 'ALL' || 
      (approvedFilter === 'APPROVED' && supplier.isApproved) ||
      (approvedFilter === 'NOT_APPROVED' && !supplier.isApproved);

    return matchesSearch && matchesStatus && matchesApproved;
  });

  // Update supplier status
  const updateSupplierStatus = async (id, newStatus) => {
    try {
      await SupplierService.updateSupplierStatus(id, newStatus);
      toast.success('Supplier status updated');
      loadSuppliers(); // Refresh list
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // Update supplier approval
  const updateSupplierApproval = async (id, isApproved) => {
    try {
      await SupplierService.updateSupplierApproval(id, isApproved);
      toast.success(isApproved ? 'Supplier approved' : 'Supplier unapproved');
      loadSuppliers(); // Refresh list
    } catch (error) {
      console.error('Error updating approval:', error);
      toast.error('Failed to update approval');
    }
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch(status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-gray-100 text-gray-800';
      case 'BLACKLISTED': return 'bg-red-100 text-red-800';
      case 'ON_HOLD': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get rating stars
  const renderRating = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <FiStar
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FiTruck className="mr-3 text-blue-700" />
              Supplier Directory
            </h1>
            <p className="text-gray-600 mt-2">
              Manage all vendors and suppliers
            </p>
          </div>
          <Link
            to="/vendor/create"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center shadow-lg"
          >
            <FiPlus className="mr-2" />
            Add New Supplier
          </Link>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Suppliers</p>
              <p className="text-2xl font-bold text-gray-900">{suppliers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiTruck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {suppliers.filter(s => s.status === 'ACTIVE').length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-emerald-600">
                {suppliers.filter(s => s.isApproved).length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 rounded-lg">
              <FiCheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Blacklisted</p>
              <p className="text-2xl font-bold text-red-600">
                {suppliers.filter(s => s.status === 'BLACKLISTED').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FiXCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Suppliers
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by code, name, contact..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Approval Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Approval
            </label>
            <select
              value={approvedFilter}
              onChange={(e) => setApprovedFilter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            >
              {approvalOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-end">
            <button
              onClick={loadSuppliers}
              className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition flex items-center justify-center"
            >
              <FiRefreshCw className="mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading suppliers...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="text-center py-12">
            <FiTruck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No suppliers found</p>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm ? 'Try a different search term' : 'Add your first supplier'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Supplier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.map((supplier) => (
                  <tr key={supplier.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <span className="text-blue-800 font-semibold text-sm">
                              {supplier.supplierCode.substring(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {supplier.supplierName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {supplier.supplierCode}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {supplier.contactPerson || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        {supplier.phone && (
                          <>
                            <FiPhone className="w-3 h-3 mr-1" />
                            {supplier.phone}
                          </>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 flex items-center">
                        {supplier.email && (
                          <>
                            <FiMail className="w-3 h-3 mr-1" />
                            {supplier.email}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        {supplier.gstNumber && (
                          <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded inline-block">
                            GST: {supplier.gstNumber}
                          </div>
                        )}
                        {supplier.panNumber && (
                          <div className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded inline-block">
                            PAN: {supplier.panNumber}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderRating(supplier.rating || 3)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(supplier.status)}`}>
                          {supplier.status}
                        </span>
                        <div className="flex items-center">
                          {supplier.isApproved ? (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                              Approved
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                              Not Approved
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateSupplierApproval(supplier.id, !supplier.isApproved)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                            supplier.isApproved
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={supplier.isApproved ? 'Unapprove' : 'Approve'}
                        >
                          {supplier.isApproved ? 'Unapprove' : 'Approve'}
                        </button>
                        
                        <select
                          value={supplier.status}
                          onChange={(e) => updateSupplierStatus(supplier.id, e.target.value)}
                          className="px-2 py-1.5 border border-gray-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="ACTIVE">Active</option>
                          <option value="INACTIVE">Inactive</option>
                          <option value="ON_HOLD">On Hold</option>
                          <option value="BLACKLISTED">Blacklist</option>
                        </select>
                        
                        <Link
                          to={`/vendor/edit/${supplier.id}`}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <FiEdit className="w-4 h-4" />
                        </Link>
                        
                        <button
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this supplier?')) {
                              // Handle delete
                            }
                          }}
                          className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {filteredSuppliers.length} of {suppliers.length} suppliers
      </div>
    </div>
  );
};

export default ManageSuppliers;