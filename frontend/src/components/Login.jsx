import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL
}/login`,
        { email, password },
        { withCredentials: true }
      );
      // assume backend returns { accessToken }
      localStorage.setItem('accessToken', res.data.accessToken);
      navigate('/');
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message ||
        'Login failed. Check credentials and try again.'
      );
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>

        {error && (
          <p className="mb-4 text-red-600 text-sm text-center">{error}</p>
        )}

        <label className="block mb-2">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError(''); }}
          required
          className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <label className="block mb-2">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError(''); }}
          required
          className="w-full p-2 border rounded mb-6 focus:outline-none focus:ring-2 focus:ring-green-400"
        />

        <button
          type="submit"
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
        >
          Login
        </button>
      </form>
    </div>
  );
}
