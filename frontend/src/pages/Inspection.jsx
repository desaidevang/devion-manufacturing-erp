import React from 'react';
import { useProtectedRoute } from '../hooks/useProtectedRoute';

export const Inspection = () => {
  useProtectedRoute();
  
  return (
    <div className="animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Inspection Management</h1>
      <div className="card p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Inspection Module</h3>
        <p className="text-gray-600">This module is under development.</p>
      </div>
    </div>
  );
};