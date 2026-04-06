// src/pages/Login.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FiLogIn, FiLock, FiUser, FiShield, FiPackage, 
  FiCheckCircle, FiBriefcase, FiUserCheck, FiChevronRight,
  FiArrowRight, FiGlobe, FiDatabase, FiUsers, FiTrendingUp,
  FiHelpCircle, FiAlertCircle
} from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { LoadingSpinner } from '../components/LoadingSpinner';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [selectedRole, setSelectedRole] = useState('EMPLOYEE');
  const [activeTab, setActiveTab] = useState('role'); // 'role' or 'login'
  
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);

    try {
      const response = await login(username, password);
      toast.success(`Welcome back, ${response.fullName}!`);
      navigate(location.state?.from || '/dashboard');
    } catch (error) {
      console.error('Login error details:', error);
      
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else if (error.message === 'Network Error') {
        toast.error('Cannot connect to server. Please check your connection.');
      } else if (error.response?.status === 401) {
        toast.error('Invalid credentials. Please try again.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setActiveTab('login');
    setUsername('');
    setPassword('');
  };

  const handleBackToRoles = () => {
    setActiveTab('role');
  };

  const getRoleIcon = (role) => {
    const iconClass = "h-6 w-6";
    switch(role) {
      case 'ADMIN': return <FiShield className={iconClass} />;
      case 'INSPECTION_OFFICER': return <FiCheckCircle className={iconClass} />;
      case 'WAREHOUSE_MANAGER': return <FiPackage className={iconClass} />;
      case 'SUPERVISOR': return <FiBriefcase className={iconClass} />;
      case 'EMPLOYEE': return <FiUserCheck className={iconClass} />;
      default: return <FiUser className={iconClass} />;
    }
  };

  const getRoleColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'from-red-500 to-red-600';
      case 'INSPECTION_OFFICER': return 'from-blue-500 to-blue-600';
      case 'WAREHOUSE_MANAGER': return 'from-green-500 to-green-600';
      case 'SUPERVISOR': return 'from-purple-500 to-purple-600';
      case 'EMPLOYEE': return 'from-amber-500 to-amber-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleCardColor = (role) => {
    switch(role) {
      case 'ADMIN': return 'hover:border-red-300 hover:bg-red-50';
      case 'INSPECTION_OFFICER': return 'hover:border-blue-300 hover:bg-blue-50';
      case 'WAREHOUSE_MANAGER': return 'hover:border-green-300 hover:bg-green-50';
      case 'SUPERVISOR': return 'hover:border-purple-300 hover:bg-purple-50';
      case 'EMPLOYEE': return 'hover:border-amber-300 hover:bg-amber-50';
      default: return 'hover:border-gray-300 hover:bg-gray-50';
    }
  };

  const getRoleName = (role) => {
    switch(role) {
      case 'ADMIN': return 'Administrator';
      case 'INSPECTION_OFFICER': return 'Inspection Officer';
      case 'WAREHOUSE_MANAGER': return 'Warehouse Manager';
      case 'SUPERVISOR': return 'Supervisor';
      case 'EMPLOYEE': return 'Employee';
      default: return 'User';
    }
  };

  const getRoleDescription = (role) => {
    switch(role) {
      case 'ADMIN': return 'Full system access & management';
      case 'INSPECTION_OFFICER': return 'Quality control & inspections';
      case 'WAREHOUSE_MANAGER': return 'Inventory & warehouse operations';
      case 'SUPERVISOR': return 'Production supervision';
      case 'EMPLOYEE': return 'Daily operations & tasks';
      default: return 'System access';
    }
  };

  const roles = ['ADMIN', 'INSPECTION_OFFICER', 'WAREHOUSE_MANAGER', 'SUPERVISOR', 'EMPLOYEE'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-7xl">
        {/* Main Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            {/* Left Side - Brand & Info */}
            <div className="lg:col-span-5 bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8 lg:p-12">
              <div className="h-full flex flex-col">
                {/* Brand */}
                <div className="mb-8">
                  <div className="flex items-center">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl shadow-lg flex items-center justify-center">
                      <span className="text-2xl font-bold">D</span>
                    </div>
                    <div className="ml-4">
                      <h1 className="text-3xl font-bold">Devion Technologies ERP</h1>
                      <p className="text-blue-200 text-sm">Enterprise Resource Planning</p>
                    </div>
                  </div>
                </div>

                {/* Welcome Message */}
                <div className="mb-10">
                  <h2 className="text-2xl font-bold mb-4">Welcome Back</h2>
                  <p className="text-blue-100 text-lg">
                    Secure, enterprise-grade resource planning system for Devion Technologies.
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-6 mb-10">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-800/30 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4">
                      <FiShield className="h-5 w-5 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Enterprise Security</h3>
                      <p className="text-blue-200 text-sm">256-bit encryption & role-based access</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-800/30 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4">
                      <FiDatabase className="h-5 w-5 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Centralized Data</h3>
                      <p className="text-blue-200 text-sm">Real-time synchronization across departments</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-800/30 backdrop-blur-sm rounded-lg flex items-center justify-center mr-4">
                      <FiTrendingUp className="h-5 w-5 text-blue-300" />
                    </div>
                    <div>
                      <h3 className="font-semibold">Performance Analytics</h3>
                      <p className="text-blue-200 text-sm">Data-driven insights & reporting</p>
                    </div>
                  </div>
                </div>

                {/* Status & Footer */}
                <div className="mt-auto">
                  <div className="mb-6">
                    <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-green-900/30 backdrop-blur-sm">
                      <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
                      <span className="text-sm font-medium">System Status: Operational</span>
                    </div>
                  </div>
                  <div className="border-t border-blue-700/30 pt-4">
                    <p className="text-blue-300 text-sm">
                      © 2025 Devion Technologies. All rights reserved.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Login */}
            <div className="lg:col-span-7 p-8 lg:p-12">
              <div className="h-full flex flex-col">
                {/* Tabs */}
                <div className="flex mb-8">
                  <button
                    onClick={() => setActiveTab('role')}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                      activeTab === 'role'
                        ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Select Role
                  </button>
                  <button
                    onClick={() => setActiveTab('login')}
                    className={`px-6 py-3 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                      activeTab === 'login'
                        ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={!selectedRole}
                  >
                    Sign In
                  </button>
                </div>

                <div className="flex-1">
                  {/* Role Selection */}
                  {activeTab === 'role' && (
                    <div>
                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Your Role</h2>
                        <p className="text-gray-600">Choose your designated role to continue</p>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
                        {roles.map((role) => {
                          const isSelected = selectedRole === role;
                          
                          return (
                            <button
                              key={role}
                              onClick={() => handleRoleSelect(role)}
                              className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center text-center
                                ${isSelected ? 'border-blue-500 ring-2 ring-blue-200 bg-blue-50' : 'border-gray-200'}
                                ${getRoleCardColor(role)} hover:shadow-md active:scale-[0.98]`}
                            >
                              <div className={`mb-3 p-3 rounded-lg bg-gradient-to-br ${getRoleColor(role)} text-white shadow-sm`}>
                                {getRoleIcon(role)}
                              </div>
                              <span className="font-semibold text-gray-900 mb-1">{getRoleName(role)}</span>
                              <span className="text-xs text-gray-600">{getRoleDescription(role)}</span>
                              {isSelected && (
                                <div className="mt-3">
                                  <span className="inline-flex items-center text-sm text-blue-600 font-medium">
                                    Selected
                                    <FiChevronRight className="ml-1 h-4 w-4" />
                                  </span>
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <div className="bg-blue-50 rounded-xl border border-blue-100 p-6">
                        <div className="flex items-start">
                          <FiHelpCircle className="h-6 w-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="text-sm font-semibold text-blue-900 mb-2">Need Help Selecting Your Role?</h3>
                            <p className="text-sm text-blue-700">
                              Your role is assigned by your department head. If you're unsure which role to select, 
                              please contact your supervisor or IT support at{' '}
                              <span className="font-medium">it-support@deviontech.in</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 flex justify-end">
                        <button
                          onClick={() => setActiveTab('login')}
                          disabled={!selectedRole}
                          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg
                            hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          Continue to Sign In
                          <FiArrowRight className="ml-2 h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Login Form */}
                  {activeTab === 'login' && (
                    <div>
                      <div className="mb-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
                            <div className="flex items-center">
                              <div className={`p-2 rounded-lg bg-gradient-to-br ${getRoleColor(selectedRole)} text-white mr-3`}>
                                {getRoleIcon(selectedRole)}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{getRoleName(selectedRole)}</p>
                                <p className="text-sm text-gray-600">{getRoleDescription(selectedRole)}</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={handleBackToRoles}
                            className="text-sm text-gray-500 hover:text-gray-700 hover:underline flex items-center"
                          >
                            Change Role
                          </button>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-gray-50 rounded-xl p-6">
                          <div className="space-y-5">
                            <div>
                              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                Username
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiUser className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  id="username"
                                  type="text"
                                  required
                                  value={username}
                                  onChange={(e) => setUsername(e.target.value)}
                                  className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                  placeholder="Enter your username"
                                  autoComplete="username"
                                  spellCheck="false"
                                  autoFocus
                                />
                              </div>
                            </div>

                            <div>
                              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <FiLock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  id="password"
                                  type="password"
                                  required
                                  value={password}
                                  onChange={(e) => setPassword(e.target.value)}
                                  className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white"
                                  placeholder="Enter your password"
                                  autoComplete="current-password"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              id="remember-me"
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                              Remember this device
                            </label>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setUsername('');
                              setPassword('');
                            }}
                            className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
                          >
                            Clear form
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 
                            text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200
                            disabled:opacity-50 disabled:cursor-not-allowed
                            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transform hover:-translate-y-0.5"
                        >
                          <div className="flex items-center justify-center">
                            {isLoading ? (
                              <>
                                <LoadingSpinner size="sm" className="mr-3" />
                                <span>Authenticating...</span>
                              </>
                            ) : (
                              <>
                                <FiLogIn className="mr-3 h-5 w-5" />
                                <span className="text-base">Sign In to System</span>
                              </>
                            )}
                          </div>
                        </button>
                      </form>

                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-start">
                          <FiAlertCircle className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Having trouble signing in?</span>
                              {' '}Contact IT Support at{' '}
                              <span className="text-blue-600 font-medium">it-support@deviontech.in</span>
                              {' '}or call extension 1234.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Info */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-center text-sm text-gray-500">
                    <div>
                      ERP System v1.0.0 • Last updated: Dec 2024
                    </div>
                    <div className="mt-2 sm:mt-0">
                      <span className="inline-flex items-center">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        Secure Connection • HTTPS
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};