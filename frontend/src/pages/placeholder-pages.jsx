// src/pages/placeholder-pages.jsx
import React from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

// Vendor Pages
export const CreateVendor = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Vendor</h1>
      <div className="card p-8">
        <p className="text-gray-600">Vendor creation form will be implemented here.</p>
      </div>
    </div>
  );
};

export const ManageVendors = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Vendors</h1>
      <div className="card p-8">
        <p className="text-gray-600">Vendor management interface will be implemented here.</p>
      </div>
    </div>
  );
};

// Raw Material Pages
export const CreatePart = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Part</h1>
      <div className="card p-8">
        <p className="text-gray-600">Part creation form with specifications will be implemented here.</p>
      </div>
    </div>
  );
};

export const ManageParts = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Parts</h1>
      <div className="card p-8">
        <p className="text-gray-600">Parts management with edit, delete, and search functionality.</p>
      </div>
    </div>
  );
};

export const PartApproval = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Part Approval</h1>
      <div className="card p-8">
        <p className="text-gray-600">Approve or reject raw material parts based on quality standards.</p>
      </div>
    </div>
  );
};

export const MaterialInward = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Material Inward</h1>
      <div className="card p-8">
        <p className="text-gray-600">Record incoming raw materials with inspection status.</p>
      </div>
    </div>
  );
};

// Batch Management Pages
export const CreateBatch = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Batch</h1>
      <div className="card p-8">
        <p className="text-gray-600">Create production batches with specifications and quantities.</p>
      </div>
    </div>
  );
};

export const BatchOverview = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Batch Overview</h1>
      <div className="card p-8">
        <p className="text-gray-600">View all production batches with status and progress.</p>
      </div>
    </div>
  );
};

// Warehouse Pages
export const WarehouseInventory = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Warehouse Inventory</h1>
      <div className="card p-8">
        <p className="text-gray-600">Complete inventory management with stock levels and locations.</p>
      </div>
    </div>
  );
};

// Inspection Pages
export const NewInspection = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">New Inspection</h1>
      <div className="card p-8">
        <p className="text-gray-600">Create new quality inspection for materials or products.</p>
      </div>
    </div>
  );
};

// Attendance Pages
export const DailyAttendance = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Daily Attendance</h1>
      <div className="card p-8">
        <p className="text-gray-600">Record and view daily employee attendance.</p>
      </div>
    </div>
  );
};

// Procurement Page
export const Procurement = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Procurement</h1>
      <div className="card p-8">
        <p className="text-gray-600">Purchase orders and procurement management.</p>
      </div>
    </div>
  );
};

// Finance Page
export const Finance = () => {
  useProtectedRoute();
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Finance</h1>
      <div className="card p-8">
        <p className="text-gray-600">Financial management, invoicing, and payments.</p>
      </div>
    </div>
  );
};

// Admin Pages
export const SystemSettings = () => {
  useProtectedRoute('ADMIN');
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>
      <div className="card p-8">
        <p className="text-gray-600">Configure system parameters and settings.</p>
      </div>
    </div>
  );
};

export const RoleManagement = () => {
  useProtectedRoute('ADMIN');
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Role Management</h1>
      <div className="card p-8">
        <p className="text-gray-600">Manage user roles and permissions.</p>
      </div>
    </div>
  );
};