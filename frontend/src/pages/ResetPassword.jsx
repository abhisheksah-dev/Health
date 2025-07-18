import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('');
    setError('');

    try {
      const res = await axios.patch(`/auth/reset-password/${token}`, { password });
      setMsg('Password reset successful!');
      setTimeout(() => navigate('/login'), 2000); // redirect to login
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Reset Password</h2>

        {msg && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">{msg}</div>}
        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Set New Password
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
