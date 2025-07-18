import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../services/api';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'

  useEffect(() => {
    const verify = async () => {
      try {
        await axios.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setTimeout(() => navigate('/login'), 3000);
      } catch (err) {
        setStatus('error');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        {status === 'verifying' && (
          <>
            <h2 className="text-xl font-semibold text-blue-600">Verifying...</h2>
            <p className="mt-4 text-gray-600">Please wait while we verify your email.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <h2 className="text-xl font-bold text-green-600">Email Verified ✅</h2>
            <p className="mt-4 text-gray-600">Redirecting to login page...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <h2 className="text-xl font-bold text-red-600">Invalid or Expired Token ❌</h2>
            <p className="mt-4 text-gray-600">Please register again or contact support.</p>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
