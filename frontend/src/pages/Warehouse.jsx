import React from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

export const Warehouse = () => {
  useProtectedRoute();
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Warehouse Management</h1>
      <div className="card p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Warehouse Module</h3>
        <p className="text-gray-600">This module is under development.</p>
      </div>
    </div>
  );
};