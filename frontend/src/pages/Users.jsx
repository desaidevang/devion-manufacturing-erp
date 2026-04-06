// src/pages/Users.jsx
import React, { useState, useEffect } from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';
import { userService } from '../services/userService';
import { 
  FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiEye, 
  FiSave, FiSearch, FiFilter, FiRefreshCw, FiUser, 
  FiMail, FiShield, FiCalendar, FiClock, FiLock,
  FiChevronLeft, FiChevronRight, FiDownload, FiAlertCircle
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Users = () => {
  useProtectedRoute('ADMIN');
  
  // State Management
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  
  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  
  // Form States
  const [createFormData, setCreateFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'EMPLOYEE',
  });
  
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    role: 'EMPLOYEE',
    isActive: true,
    password: '',
  });

  // Fetch Users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter Users whenever dependencies change
  useEffect(() => {
    let result = users;
    
    // Search filter
    if (searchTerm) {
      result = result.filter(user =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Role filter
    if (selectedRole !== 'ALL') {
      result = result.filter(user => user.role === selectedRole);
    }
    
    // Status filter
    if (selectedStatus !== 'ALL') {
      result = result.filter(user => 
        selectedStatus === 'ACTIVE' ? user.isActive : !user.isActive
      );
    }
    
    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, searchTerm, selectedRole, selectedStatus]);

  // Fetch users from backend
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  // CREATE User
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Get current user ID for createdBy field
      const currentUserData = JSON.parse(localStorage.getItem('user_data') || '{}');
      
      // Call backend API
      const createdUser = await userService.createUser({
        username: createFormData.username,
        password: createFormData.password,
        email: createFormData.email,
        fullName: createFormData.fullName,
        role: createFormData.role,
        createdBy: currentUserData.id || 1, // Fallback to 1 if no user ID
      });
      
      toast.success('User created successfully');
      setShowCreateModal(false);
      resetCreateForm();
      fetchUsers(); // Refresh data from server
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(error.response?.data?.error || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  // UPDATE User
  const handleEditUser = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare update data
      const updateData = {
        username: editFormData.username,
        email: editFormData.email,
        fullName: editFormData.fullName,
        role: editFormData.role,
        isActive: editFormData.isActive,
      };
      
      // Only include password if it was changed
      if (editFormData.password && editFormData.password.trim() !== '') {
        updateData.password = editFormData.password;
      }
      
      // Call backend API
      const updatedUser = await userService.updateUser(selectedUser.id, updateData);
      
      toast.success('User updated successfully');
      setShowEditModal(false);
      setSelectedUser(null);
      resetEditForm();
      fetchUsers(); // Refresh data from server
    } catch (error) {
      console.error('Update user error:', error);
      toast.error(error.response?.data?.error || 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  // DELETE User
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await userService.deleteUser(userId);
      toast.success('User deleted successfully');
      fetchUsers(); // Refresh data from server
    } catch (error) {
      console.error('Delete user error:', error);
      toast.error(error.response?.data?.error || 'Failed to delete user');
    }
  };

  // UPDATE Status
  const handleStatusToggle = async (userId, currentStatus) => {
    try {
      await userService.updateUserStatus(userId, !currentStatus);
      toast.success('User status updated');
      fetchUsers(); // Refresh data from server
    } catch (error) {
      console.error('Status toggle error:', error);
      toast.error(error.response?.data?.error || 'Failed to update status');
    }
  };

  // Form Helpers
  const resetCreateForm = () => {
    setCreateFormData({
      username: '',
      password: '',
      email: '',
      fullName: '',
      role: 'EMPLOYEE',
    });
  };

  const resetEditForm = () => {
    setEditFormData({
      username: '',
      email: '',
      fullName: '',
      role: 'EMPLOYEE',
      isActive: true,
      password: '',
    });
  };

  const handleEditClick = (user) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      password: '', // Don't populate password for security
    });
    setShowEditModal(true);
  };

  const handleViewDetails = (user) => {
    setSelectedUser(user);
    setViewMode('details');
  };

  // UI Helpers
  const getRoleBadge = (role) => {
    const badges = {
      ADMIN: { bg: 'bg-red-100', text: 'text-red-800', label: 'Admin' },
      INSPECTION_OFFICER: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Inspection Officer' },
      WAREHOUSE_MANAGER: { bg: 'bg-green-100', text: 'text-green-800', label: 'Warehouse Manager' },
      SUPERVISOR: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Supervisor' },
      EMPLOYEE: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Employee' },
    };
    return badges[role] || { bg: 'bg-gray-100', text: 'text-gray-800', label: role };
  };

  const getStatusBadge = (isActive) => {
    return isActive 
      ? { bg: 'bg-green-100', text: 'text-green-800', label: 'Active', icon: FiCheck }
      : { bg: 'bg-red-100', text: 'text-red-800', label: 'Inactive', icon: FiX };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Loading State
  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-gray-600">Loading users...</span>
      </div>
    );
  }

  // User Details View
  if (viewMode === 'details' && selectedUser) {
    const user = selectedUser;
    const roleBadge = getRoleBadge(user.role);
    const statusBadge = getStatusBadge(user.isActive);
    const StatusIcon = statusBadge.icon;
    
    return (
      <div className="animate-fade-in">
        {/* Back Button */}
        <button
          onClick={() => setViewMode('list')}
          className="mb-6 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
        >
          <FiChevronLeft className="mr-2" />
          Back to Users List
        </button>

        {/* User Details Card */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                  <span className="text-2xl font-bold text-white">
                    {user.fullName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{user.fullName}</h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                      {roleBadge.label}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text}`}>
                      <StatusIcon className="mr-1 h-4 w-4" />
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleEditClick(user)}
                  className="btn-primary bg-white text-blue-600 hover:bg-blue-50 border border-white"
                >
                  <FiEdit2 className="mr-2" />
                  Edit User
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className="btn-secondary bg-transparent text-white border-white hover:bg-white/10"
                >
                  Close
                </button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 lg:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
              {/* Basic Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Basic Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <FiUser className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Username</p>
                      <p className="font-medium break-all">@{user.username}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <FiMail className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Email Address</p>
                      <p className="font-medium break-all">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <FiShield className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">User Role</p>
                      <p className="font-medium">{user.role.replace('_', ' ')}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${roleBadge.bg} ${roleBadge.text} ml-2`}>
                      {roleBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Account Information</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <FiCalendar className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Account Created</p>
                      <p className="font-medium">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <FiClock className="h-5 w-5 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Last Login</p>
                      <p className="font-medium">{formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center p-4 bg-gray-50 rounded-lg">
                    <div className="h-5 w-5 mr-3 flex items-center justify-center flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-500">Account Status</p>
                      <p className="font-medium">{user.isActive ? 'Active and Verified' : 'Deactivated'}</p>
                    </div>
                    <button
                      onClick={() => handleStatusToggle(user.id, user.isActive)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ml-2 ${
                        user.isActive
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 pt-8 border-t border-gray-200">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="text-sm text-gray-500">
                  User ID: <span className="font-mono text-gray-700">{user.id}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this user?')) {
                        handleDeleteUser(user.id);
                        setViewMode('list');
                      }
                    }}
                    className="btn-secondary text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={user.role === 'ADMIN'}
                  >
                    <FiTrash2 className="mr-2" />
                    Delete User
                  </button>
                  <button
                    onClick={() => handleEditClick(user)}
                    className="btn-primary"
                  >
                    <FiEdit2 className="mr-2" />
                    Edit User
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main List View
  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">Manage all system users and their permissions</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchUsers}
            className="btn-secondary flex items-center"
            title="Refresh"
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center"
            disabled={loading}
          >
            <FiPlus className="mr-2 h-5 w-5" />
            Add New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{users.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiUser className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {users.filter(u => u.isActive).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Admins</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {users.filter(u => u.role === 'ADMIN').length}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <FiShield className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today's Logins</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {users.filter(u => {
                  const today = new Date();
                  const lastLogin = u.lastLogin ? new Date(u.lastLogin) : null;
                  return lastLogin && lastLogin.toDateString() === today.toDateString();
                }).length}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <FiClock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Users
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, or username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-10"
                disabled={loading}
              />
            </div>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="input-field"
              disabled={loading}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="INSPECTION_OFFICER">Inspection Officer</option>
              <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="EMPLOYEE">Employee</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input-field"
              disabled={loading}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.map((user) => {
                const roleBadge = getRoleBadge(user.role);
                const statusBadge = getStatusBadge(user.isActive);
                const StatusIcon = statusBadge.icon;
                
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.fullName.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.fullName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">@{user.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadge.bg} ${roleBadge.text}`}>
                        {roleBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleStatusToggle(user.id, user.isActive)}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.bg} ${statusBadge.text} hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed`}
                        disabled={loading || (user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN' && u.isActive).length <= 1 && user.isActive)}
                        title={user.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN' && u.isActive).length <= 1 && user.isActive ? "Cannot deactivate the last admin" : ""}
                      >
                        <StatusIcon className="mr-1 h-4 w-4" />
                        {statusBadge.label}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewDetails(user)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded transition-colors"
                          title="View Details"
                          disabled={loading}
                        >
                          <FiEye className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleEditClick(user)}
                          className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded transition-colors"
                          title="Edit User"
                          disabled={loading}
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={user.role === 'ADMIN' ? "Cannot delete admin users" : "Delete User"}
                          disabled={loading || user.role === 'ADMIN'}
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FiAlertCircle className="mx-auto h-12 w-12" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500">Try adjusting your search filters or add a new user.</p>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <LoadingSpinner size="md" />
            <p className="text-gray-500 mt-2">Loading users...</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
            <span className="font-medium">
              {Math.min(indexOfLastUser, filteredUsers.length)}
            </span>{' '}
            of <span className="font-medium">{filteredUsers.length}</span> users
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={prevPage}
              disabled={currentPage === 1 || loading}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <FiChevronLeft className="h-5 w-5" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNumber}
                  onClick={() => paginate(pageNumber)}
                  disabled={loading}
                  className={`w-10 h-10 rounded-lg border transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 hover:bg-gray-50'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {pageNumber}
                </button>
              );
            })}
            
            <button
              onClick={nextPage}
              disabled={currentPage === totalPages || loading}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <FiChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full animate-slide-up">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-500 p-1 transition-colors"
                disabled={loading}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={createFormData.fullName}
                  onChange={(e) => setCreateFormData({...createFormData, fullName: e.target.value})}
                  className="input-field"
                  placeholder="Enter full name"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={createFormData.username}
                  onChange={(e) => setCreateFormData({...createFormData, username: e.target.value})}
                  className="input-field"
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={createFormData.email}
                  onChange={(e) => setCreateFormData({...createFormData, email: e.target.value})}
                  className="input-field"
                  placeholder="Enter email address"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  name="password"
                  required
                  value={createFormData.password}
                  onChange={(e) => setCreateFormData({...createFormData, password: e.target.value})}
                  className="input-field"
                  placeholder="Enter password (min 6 characters)"
                  minLength={6}
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={createFormData.role}
                  onChange={(e) => setCreateFormData({...createFormData, role: e.target.value})}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="INSPECTION_OFFICER">Inspection Officer</option>
                  <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">Edit User</h2>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-400 hover:text-gray-500 p-1 transition-colors"
                disabled={loading}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleEditUser} className="p-6 space-y-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-lg">
                    {editFormData.fullName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{editFormData.fullName}</h3>
                  <p className="text-sm text-gray-500">@{editFormData.username}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                  className="input-field"
                  placeholder="Enter full name"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  required
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                  className="input-field"
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                  className="input-field"
                  placeholder="Enter email address"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Change Password (Optional)
                </label>
                <input
                  type="password"
                  name="password"
                  value={editFormData.password}
                  onChange={(e) => setEditFormData({...editFormData, password: e.target.value})}
                  className="input-field"
                  placeholder="Leave blank to keep current password"
                  minLength={6}
                  disabled={loading}
                />
                {editFormData.password && (
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  name="role"
                  value={editFormData.role}
                  onChange={(e) => setEditFormData({...editFormData, role: e.target.value})}
                  className="input-field"
                  disabled={loading}
                >
                  <option value="EMPLOYEE">Employee</option>
                  <option value="SUPERVISOR">Supervisor</option>
                  <option value="INSPECTION_OFFICER">Inspection Officer</option>
                  <option value="WAREHOUSE_MANAGER">Warehouse Manager</option>
                  <option value="ADMIN">Administrator</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  id="isActive"
                  type="checkbox"
                  checked={editFormData.isActive}
                  onChange={(e) => setEditFormData({...editFormData, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  disabled={loading || (selectedUser.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN' && u.isActive).length <= 1 && editFormData.isActive)}
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  Account Active
                </label>
              </div>

              {selectedUser.role === 'ADMIN' && users.filter(u => u.role === 'ADMIN' && u.isActive).length <= 1 && editFormData.isActive && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-700">
                    <FiAlertCircle className="inline mr-1" />
                    This is the last active admin. Account cannot be deactivated.
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedUser(null);
                  }}
                  className="btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center"
                  disabled={loading}
                >
                  {loading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <FiSave className="mr-2 h-4 w-4" />
                  )}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};