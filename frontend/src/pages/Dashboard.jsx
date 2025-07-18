import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">
          Welcome, {user?.name || 'User'}! 🎉
        </h1>

        <div className="space-y-2">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
          {user.phoneNumber && <p><strong>Phone:</strong> {user.phoneNumber}</p>}
          {user.gender && <p><strong>Gender:</strong> {user.gender}</p>}
          {user.dateOfBirth && <p><strong>DOB:</strong> {new Date(user.dateOfBirth).toDateString()}</p>}
        </div>

        {user?.address && (
          <div className="mt-4">
            <h2 className="font-semibold">Address</h2>
            <p>{user.address.street}, {user.address.city}</p>
            <p>{user.address.state}, {user.address.country} - {user.address.zipCode}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
