// src/AppRoutes.jsx - Fixed version
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Login } from '../pages/Login';
import { Dashboard } from '../pages/Dashboard';
import { Users } from '../pages/Users';
import { MainLayout } from '../layouts/MainLayout';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { toast } from 'react-toastify';

import ProductCreate from '../pages/product/ProductCreate';
import ProductManage from '../pages/product/ProductManage';
import ProductView from '../pages/product/ProductView';
import ProductEdit from '../pages/product/ProductEdit';

// PSI & Part Pages
import PSICreate from '../pages/PSICreate';
import PartCreate from '../pages/PartCreate';
import PartManage from '../pages/PartManage';
import PSIView from '../pages/PSIView';
import PartEdit from '../pages/part/PartEdit';
import PartView from '../pages/part/PartView';
import PSIEdit from '../pages/PSIEdit';

// Supplier Pages
import CreateSupplier from '../pages/supplier/CreateSupplier';
import ManageSuppliers from '../pages/supplier/ManageSuppliers';

// GRN Pages
import CreateGRN from '../pages/grn/CreateGRN';
import ManageGRNs from '../pages/grn/ManageGRNs';
import GRNView from '../pages/grn/GRNView';

// Warehouse Pages
import WarehouseStock from '../pages/warehouse/WarehouseStock';

import MoveStock from '../pages/warehouse/MoveStock';
import WarehouseLocations from '../pages/warehouse/WarehouseLocations';
import CreateWarehouseLocation from '../pages/warehouse/CreateWarehouseLocation';
import InspectGRN from '../pages/grn/InspectGRN';

import { BatchCreate } from '../pages/batch/BatchCreate';
import { BatchStatusBoard } from '../pages/batch/BatchStatusBoard';
import { BatchAssign } from '../pages/batch/BatchAssign';
import { BatchDetail } from '../pages/batch/BatchDetail';
import { BatchDashboard } from '../pages/batch/BatchDashboard';
import { BatchComplete } from '../pages/batch/BatchComplete';


// Protected Route Component
const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner className="h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Check if required roles are specified
  if (requiredRoles.length > 0) {
    // If requiredRoles is an array, check if user has any of those roles
    if (Array.isArray(requiredRoles)) {
      if (!requiredRoles.includes(user?.role)) {
        toast.error('You do not have permission to access this page');
        return <Navigate to="/dashboard" />;
      }
    } 
    // If requiredRoles is a string, check exact match
    else if (user?.role !== requiredRoles) {
      toast.error('You do not have permission to access this page');
      return <Navigate to="/dashboard" />;
    }
  }

  return children;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      
      {/* Protected Routes with Main Layout */}
      <Route path="/" element={
        <ProtectedRoute>
          <MainLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* User Management - ADMIN only */}
        <Route path="users" element={
          <ProtectedRoute requiredRoles="ADMIN">
            <Users />
          </ProtectedRoute>
        } />
        
        {/* Supplier/Vendor Routes */}
        <Route path="vendor/create" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'WAREHOUSE_MANAGER']}>
            <CreateSupplier />
          </ProtectedRoute>
        } />
        <Route path="vendor/manage" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'WAREHOUSE_MANAGER']}>
            <ManageSuppliers />
          </ProtectedRoute>
        } />
        
        {/* Inspection Routes */}
       <Route path="product/create" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'ENGINEERING']}>
    <ProductCreate />
  </ProtectedRoute>
} />
<Route path="product/manage" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'ENGINEERING', 'WAREHOUSE_MANAGER']}>
    <ProductManage />
  </ProtectedRoute>
} />
<Route path="product/view/:id" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'ENGINEERING', 'WAREHOUSE_MANAGER', 'SUPERVISOR']}>
    <ProductView />
  </ProtectedRoute>
} />
<Route path="product/edit/:id" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'ENGINEERING']}>
    <ProductEdit />
  </ProtectedRoute>
} />

<Route path="batch/:id/complete" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'SUPERVISOR']}>
    <BatchComplete />
  </ProtectedRoute>
} />


{/*batch */}
        {/* Batch Routes - CORRECTED */}
        <Route path="batch/dashboard" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR', 'WAREHOUSE_MANAGER']}>
            <BatchDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="batch/create" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR']}>
            <BatchCreate />
          </ProtectedRoute>
        } />
        
        <Route path="batch/status" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR', 'WAREHOUSE_MANAGER']}>
            <BatchStatusBoard />
          </ProtectedRoute>
        } />
        
        <Route path="batch/assign" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR']}>
            <BatchAssign />
          </ProtectedRoute>
        } />
        
        <Route path="batch/:id" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR', 'WAREHOUSE_MANAGER']}>
            <BatchDetail />
          </ProtectedRoute>
        } />
        
        <Route path="batch/:id/assign" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'PRODUCTION_MANAGER', 'SUPERVISOR']}>
            <BatchAssign />
          </ProtectedRoute>
        } />
        
        {/* PSI Routes */}
        <Route path="psi/create" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'INSPECTION_OFFICER']}>
            <PSICreate />
          </ProtectedRoute>
        } />
        <Route path="psi/view" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'INSPECTION_OFFICER', 'WAREHOUSE_MANAGER', 'SUPERVISOR']}>
            <PSIView />
          </ProtectedRoute>
        } />
        <Route path="psi/edit/:id" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'INSPECTION_OFFICER']}>
            <PSIEdit />
          </ProtectedRoute>
        } />
        
        {/* Part Routes */}
        <Route path="part/create" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'INSPECTION_OFFICER']}>
            <PartCreate />
          </ProtectedRoute>
        } />
        <Route path="part/manage" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'INSPECTION_OFFICER', 'WAREHOUSE_MANAGER', 'SUPERVISOR']}>
            <PartManage />
          </ProtectedRoute>
        } />
        <Route path="part/edit/:id" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'INSPECTION_OFFICER']}>
            <PartEdit />
          </ProtectedRoute>
        } />
        <Route path="part/view/:id" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'INSPECTION_OFFICER', 'WAREHOUSE_MANAGER', 'SUPERVISOR']}>
            <PartView />
          </ProtectedRoute>
        } />
        
        {/* GRN/Material Inward Routes */}
        <Route path="material/receive/new" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'WAREHOUSE_MANAGER']}>
            <CreateGRN />
          </ProtectedRoute>
        } />
        <Route path="material/receive" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'WAREHOUSE_MANAGER', 'INSPECTION_OFFICER']}>
            <ManageGRNs />
          </ProtectedRoute>
        } />
        <Route path="grn/view/:id" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'WAREHOUSE_MANAGER', 'INSPECTION_OFFICER']}>
            <GRNView />
          </ProtectedRoute>
        } />
        <Route path="inspection/grn/:id" element={
  <ProtectedRoute requiredRoles={['ADMIN', 'INSPECTION_OFFICER']}>
    <InspectGRN />
  </ProtectedRoute>
} />
 
        {/* Warehouse Routes */}
        <Route path="warehouse/stock" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'WAREHOUSE_MANAGER', 'INSPECTION_OFFICER']}>
            <WarehouseStock />
          </ProtectedRoute>
        } />
        
        <Route path="warehouse/stock/move/:id" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'WAREHOUSE_MANAGER']}>
            <MoveStock />
          </ProtectedRoute>
        } />
        <Route path="warehouse/locations" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'WAREHOUSE_MANAGER', 'INSPECTION_OFFICER']}>
            <WarehouseLocations />
          </ProtectedRoute>
        } />
        <Route path="warehouse/locations/create" element={
          <ProtectedRoute requiredRoles={['ADMIN', 'WAREHOUSE_MANAGER']}>
            <CreateWarehouseLocation />
          </ProtectedRoute>
        } />
        
        {/* Placeholder/Under Development Routes */}
        <Route path="raw-material/create" element={
          <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Raw Material</h1>
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <p className="text-gray-600">This feature is currently being developed.</p>
            </div>
          </div>
        } />
        
        <Route path="raw-material/manage" element={
          <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Raw Materials</h1>
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <p className="text-gray-600">This feature is currently being developed.</p>
            </div>
          </div>
        } />
        
        <Route path="warehouse" element={
          <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Warehouse Management</h1>
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <p className="text-gray-600">This feature is currently being developed.</p>
            </div>
          </div>
        } />
        
        <Route path="warehouse/inventory" element={
          <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Warehouse Inventory</h1>
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <p className="text-gray-600">This feature is currently being developed.</p>
            </div>
          </div>
        } />
  
        <Route path="production" element={
          <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Production</h1>
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <p className="text-gray-600">This feature is currently being developed.</p>
            </div>
          </div>
        } />
        
        <Route path="attendance/daily" element={
          <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Daily Attendance</h1>
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <p className="text-gray-600">This feature is currently being developed.</p>
            </div>
          </div>
        } />
        
        <Route path="procurement" element={
          <div className="max-w-7xl mx-auto p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Procurement</h1>
            <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
              <p className="text-gray-600">This feature is currently being developed.</p>
            </div>
          </div>
        } />
        
        <Route path="admin/roles" element={
          <ProtectedRoute requiredRoles="ADMIN">
            <div className="max-w-7xl mx-auto p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Role Management</h1>
              <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                <p className="text-gray-600">This feature is currently being developed.</p>
              </div>
            </div>
          </ProtectedRoute>
        } />
        
        {/* Catch all for unimplemented routes */}
        <Route path="*" element={
          <div className="max-w-7xl mx-auto p-6">
            <div className="bg-white rounded-xl shadow border border-gray-200 p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Page Under Development</h2>
              <p className="text-gray-600">This feature is currently being developed.</p>
              <button
                onClick={() => window.history.back()}
                className="mt-6 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
              >
                Go Back
              </button>
            </div>
          </div>
        } />
      </Route>
      
      {/* Catch all - redirect to dashboard if authenticated, else login */}
      <Route path="*" element={
        <Navigate to="/dashboard" />
      } />
    </Routes>
  );
};