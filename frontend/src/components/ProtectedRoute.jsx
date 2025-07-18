import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-6 rounded shadow text-center text-gray-800">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="mb-4">You must be logged in to access this page.</p>
          <a
            href="/login"
            className="text-blue-600 hover:underline font-medium"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
