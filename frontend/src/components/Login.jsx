import { useState } from 'react';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleSubmit = e => { e.preventDefault(); /* auth logic */ };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-center">Login</h2>
        <label className="block mb-2">Email</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
          className="w-full p-2 border rounded mb-4 focus:outline-none focus:ring-2 focus:ring-green-400" />
        <label className="block mb-2">Password</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
          className="w-full p-2 border rounded mb-6 focus:outline-none focus:ring-2 focus:ring-green-400" />
        <button type="submit" className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700">Login</button>
      </form>
    </div>
  );
}